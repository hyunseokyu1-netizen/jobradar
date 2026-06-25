'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  STEPS,
  INTRO,
  OUTRO,
  EMPTY_ANSWERS,
  type OnboardingAnswers,
  type Step,
} from './questions'
import { completeOnboarding } from './actions'

interface ChatMessage {
  role: 'ai' | 'user'
  text: string
}

const DRAFT_KEY = 'onboarding_draft_v1'

export default function OnboardingChat({
  initialAnswers,
}: {
  initialAnswers?: OnboardingAnswers
}) {
  const router = useRouter()
  const prefill = !!initialAnswers // "다시 작성" 모드: 기존 답변을 미리 채워 수정
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [stepIndex, setStepIndex] = useState(0)
  const [mode, setMode] = useState<'input' | 'askMore' | 'finishing' | 'done'>('input')
  const [answers, setAnswers] = useState<OnboardingAnswers>(initialAnswers ?? EMPTY_ANSWERS)
  const [input, setInput] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const initialized = useRef(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const step: Step | undefined = STEPS[stepIndex]

  // 질문 텍스트(리스트 단계는 다시 작성 시 편집 힌트 추가)
  function questionText(s: Step): string {
    if (prefill && s.kind === 'list') {
      return `${s.question}\n(기존 내용이 채워져 있어요. 줄바꿈으로 항목을 수정·추가·삭제하세요.)`
    }
    return s.question
  }
  // 해당 단계의 입력칸 프리필 값(리스트는 줄바꿈으로 합침)
  function stepInputValue(s: Step, ans: OnboardingAnswers): string {
    return s.kind === 'list' ? ans[s.key].join('\n') : ans[s.key]
  }

  // 첫 마운트: 인트로 + 첫 질문 (localStorage 답변 복원)
  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    // 신규 작성만 localStorage 임시저장 복원. 다시 작성은 기존 프로필(initialAnswers) 사용.
    if (!prefill) {
      try {
        const saved = localStorage.getItem(DRAFT_KEY)
        if (saved) setAnswers({ ...EMPTY_ANSWERS, ...JSON.parse(saved) })
      } catch {}
    }

    setMessages([
      { role: 'ai', text: INTRO },
      { role: 'ai', text: questionText(STEPS[0]) },
    ])
  }, [])

  // 다시 작성: 각 단계에 도달하면 입력칸에 기존 답변을 미리 채운다
  useEffect(() => {
    if (!prefill) return
    const s = STEPS[stepIndex]
    if (s) setInput(stepInputValue(s, answers))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIndex, prefill])

  // 메시지 추가 시 자동 스크롤
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, mode])

  function persist(next: OnboardingAnswers) {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(next))
    } catch {}
  }

  function pushAi(text: string) {
    setMessages(prev => [...prev, { role: 'ai', text }])
  }
  function pushUser(text: string) {
    setMessages(prev => [...prev, { role: 'user', text }])
  }

  // 다음 단계로 이동 (없으면 마무리)
  function goNextStep(nextAnswers: OnboardingAnswers) {
    const nextIndex = stepIndex + 1
    if (nextIndex < STEPS.length) {
      setStepIndex(nextIndex)
      setMode('input')
      pushAi(questionText(STEPS[nextIndex]))
    } else {
      finish(nextAnswers)
    }
  }

  async function finish(finalAnswers: OnboardingAnswers) {
    setMode('finishing')
    pushAi(OUTRO)
    const result = await completeOnboarding(finalAnswers)
    if (result.error) {
      setErrorMsg(result.error)
      setMode('input')
      return
    }
    try {
      localStorage.removeItem(DRAFT_KEY)
    } catch {}
    setMode('done')
    pushAi('프로필이 완성됐어요! 프로필 페이지로 이동합니다. 🎉')
    setTimeout(() => {
      router.push('/profile')
      router.refresh()
    }, 1200)
  }

  function handleSend() {
    if (!step || mode !== 'input') return
    const text = input.trim()
    setErrorMsg('')

    // 필수 항목 빈 입력 방지
    if (!text) {
      if (step.kind === 'single' && step.optional) {
        pushUser('(건너뜀)')
        setInput('')
        goNextStep(answers)
      } else if (prefill && step.kind === 'list') {
        // 다시 작성: 비우고 보내면 해당 목록 삭제
        pushUser('(없음)')
        setInput('')
        const next = { ...answers, [step.key]: [] }
        setAnswers(next)
        persist(next)
        goNextStep(next)
      }
      return
    }

    pushUser(text)
    setInput('')

    if (step.kind === 'single') {
      const next = { ...answers, [step.key]: text }
      setAnswers(next)
      persist(next)
      goNextStep(next)
    } else if (prefill) {
      // 다시 작성: 여러 줄을 한 번에 항목 배열로 처리(수정·추가·삭제)
      const items = text.split('\n').map(s => s.trim()).filter(Boolean)
      const next = { ...answers, [step.key]: items }
      setAnswers(next)
      persist(next)
      goNextStep(next)
    } else {
      // list(신규): 항목 누적 후 "더 추가?" 묻기
      const next = { ...answers, [step.key]: [...answers[step.key], text] }
      setAnswers(next)
      persist(next)
      setMode('askMore')
      pushAi('더 추가하실 내용이 있나요?')
    }
  }

  function handleAddMore() {
    if (!step || step.kind !== 'list') return
    setMode('input')
    pushAi(step.addMoreQuestion)
  }

  function handleNoMore() {
    setMode('input')
    goNextStep(answers)
  }

  function handleSkip() {
    if (!step || step.kind !== 'single' || !step.optional) return
    pushUser('(건너뜀)')
    setInput('')
    goNextStep(answers)
  }

  const busy = mode === 'finishing' || mode === 'done'
  const progress = Math.min(stepIndex + 1, STEPS.length)

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 flex flex-col h-[70vh]">
      {/* 진행 바 */}
      <div className="px-5 pt-4">
        <div className="flex items-center justify-between text-xs text-zinc-400 mb-1.5">
          <span>프로필 작성</span>
          <span>
            {progress} / {STEPS.length}
          </span>
        </div>
        <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-zinc-900 rounded-full transition-all duration-300"
            style={{ width: `${(progress / STEPS.length) * 100}%` }}
          />
        </div>
      </div>

      {/* 메시지 영역 */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap leading-relaxed ${
                m.role === 'user'
                  ? 'bg-zinc-900 text-white rounded-br-sm'
                  : 'bg-zinc-100 text-zinc-800 rounded-bl-sm'
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
        {mode === 'finishing' && (
          <div className="flex justify-start">
            <div className="bg-zinc-100 text-zinc-400 rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm">
              정리하는 중<span className="animate-pulse">...</span>
            </div>
          </div>
        )}
      </div>

      {/* 입력 영역 */}
      <div className="border-t border-zinc-100 p-3">
        {errorMsg && <p className="text-xs text-red-500 px-2 pb-2">{errorMsg}</p>}

        {mode === 'askMore' ? (
          <div className="flex gap-2">
            <button
              onClick={handleAddMore}
              className="flex-1 border border-zinc-300 rounded-xl py-2.5 text-sm font-medium hover:bg-zinc-50 transition-colors"
            >
              ＋ 추가하기
            </button>
            <button
              onClick={handleNoMore}
              className="flex-1 bg-zinc-900 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-zinc-700 transition-colors"
            >
              다음으로 →
            </button>
          </div>
        ) : (
          <div className="flex items-end gap-2">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
              disabled={busy}
              rows={1}
              placeholder={
                busy
                  ? '잠시만 기다려 주세요...'
                  : step?.kind === 'single' && step.placeholder
                  ? step.placeholder
                  : step?.kind === 'list' && step.placeholder
                  ? step.placeholder
                  : '답변을 입력하세요'
              }
              className="flex-1 resize-none border border-zinc-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10 max-h-32 disabled:bg-zinc-50 disabled:text-zinc-400"
            />
            {step?.kind === 'single' && step.optional && !busy && (
              <button
                onClick={handleSkip}
                className="text-xs text-zinc-400 hover:text-zinc-600 px-2 py-2 whitespace-nowrap transition-colors"
              >
                건너뛰기
              </button>
            )}
            <button
              onClick={handleSend}
              disabled={busy || !input.trim()}
              className="bg-zinc-900 text-white rounded-xl px-5 py-2.5 text-sm font-medium hover:bg-zinc-700 disabled:opacity-40 transition-colors whitespace-nowrap"
            >
              전송
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
