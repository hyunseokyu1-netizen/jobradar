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
import SkillChipInput from '@/components/SkillChipInput'

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
  // 스킬 단계 전용: 자동완성 칩 입력 상태
  const [skillList, setSkillList] = useState<string[]>([])
  const [errorMsg, setErrorMsg] = useState('')
  // "← 이전"으로 돌아온 단계: 리스트 단계도 줄바꿈 일괄 편집으로 처리 (prefill 모드와 동일)
  const [revisit, setRevisit] = useState(false)

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
    if (!s) return
    if (s.kind === 'single' && s.key === 'skills') {
      setSkillList(answers.skills.split(',').map(v => v.trim()).filter(Boolean))
    } else {
      setInput(stepInputValue(s, answers))
    }
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
    setRevisit(false)
    const nextIndex = stepIndex + 1
    if (nextIndex < STEPS.length) {
      setStepIndex(nextIndex)
      setMode('input')
      pushAi(questionText(STEPS[nextIndex]))
    } else {
      finish(nextAnswers)
    }
  }

  // "← 이전" — 이전 단계로 돌아가 기존 답변을 프리필하고 수정하게 한다.
  // askMore 중이면 단계 이동 없이 현재 리스트를 일괄 편집 모드로 전환.
  function handleBack() {
    if (mode === 'finishing' || mode === 'done') return
    const targetIndex = mode === 'askMore' ? stepIndex : stepIndex - 1
    if (targetIndex < 0) return
    const target = STEPS[targetIndex]

    setStepIndex(targetIndex)
    setMode('input')
    setRevisit(true)
    setErrorMsg('')

    if (target.kind === 'single' && target.key === 'skills') {
      setSkillList(answers.skills.split(',').map(v => v.trim()).filter(Boolean))
      setInput('')
    } else {
      setInput(stepInputValue(target, answers))
    }

    pushAi(
      target.kind === 'list'
        ? `${target.question}\n(기존 내용이 채워져 있어요. 줄바꿈으로 항목을 수정·추가·삭제하세요.)`
        : `다시 여쭤볼게요. ${target.question}`
    )
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
      router.push('/discover')
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
      } else if ((prefill || revisit) && step.kind === 'list') {
        // 다시 작성·이전으로 돌아온 경우: 비우고 보내면 해당 목록 삭제
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
    } else if (prefill || revisit) {
      // 다시 작성·이전으로 돌아온 경우: 여러 줄을 한 번에 항목 배열로 처리(수정·추가·삭제)
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

  // 스킬 단계: 칩 목록을 쉼표 문자열로 합쳐 답변 처리
  function handleSkillSend(skills: string[]) {
    if (!step || step.kind !== 'single' || step.key !== 'skills' || mode !== 'input') return
    if (skills.length === 0) return
    setErrorMsg('')
    const text = skills.join(', ')
    pushUser(text)
    const next = { ...answers, skills: text }
    setAnswers(next)
    persist(next)
    goNextStep(next)
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
    // dvh: 모바일 키보드가 올라와도 입력창이 가려지지 않도록 동적 뷰포트 기준
    <div className="bg-white rounded-2xl border border-[#ECEEF0] shadow-[0_1px_2px_rgba(16,24,40,0.04)] flex flex-col h-[70dvh]">
      {/* 진행 바 */}
      <div className="px-5 pt-4">
        <div className="flex items-center justify-between text-xs text-[#98A2B3] mb-1.5">
          <span>프로필 작성</span>
          <span>
            {progress} / {STEPS.length}
          </span>
        </div>
        <div className="h-1.5 bg-[#EEF1F3] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#046C4E] rounded-full transition-all duration-300"
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
                  ? 'bg-[#046C4E] text-white rounded-br-sm'
                  : 'bg-[#F4F6F8] text-[#344054] rounded-bl-sm'
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
        {mode === 'finishing' && (
          <div className="flex justify-start">
            <div className="bg-[#F4F6F8] text-[#98A2B3] rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm">
              정리하는 중<span className="animate-pulse">...</span>
            </div>
          </div>
        )}
      </div>

      {/* 입력 영역 */}
      <div className="border-t border-[#F0F2F4] p-3">
        {errorMsg && <p className="text-xs text-red-500 px-2 pb-2">{errorMsg}</p>}

        {/* 이전 단계로 (첫 질문·완료 중에는 숨김) */}
        {!busy && (stepIndex > 0 || mode === 'askMore') && (
          <button
            type="button"
            onClick={handleBack}
            className="mb-2 px-2 text-xs text-[#98A2B3] transition-colors hover:text-[#046C4E]"
          >
            ← 이전 답변 수정
          </button>
        )}

        {mode === 'askMore' ? (
          <div className="flex gap-2">
            <button
              onClick={handleAddMore}
              className="flex-1 border border-[#E2E6EA] rounded-xl py-2.5 text-sm font-medium text-[#344054] hover:bg-[#F4F6F8] transition-colors"
            >
              ＋ 추가하기
            </button>
            <button
              onClick={handleNoMore}
              className="flex-1 bg-[#046C4E] text-white rounded-xl py-2.5 text-sm font-medium hover:bg-[#035A40] transition-colors"
            >
              다음으로 →
            </button>
          </div>
        ) : step?.kind === 'single' && step.key === 'skills' ? (
          // 스킬 단계: 자동완성 칩 입력 (자유 입력도 가능)
          <SkillChipInput
            value={skillList}
            onChange={setSkillList}
            onSend={handleSkillSend}
            disabled={busy}
            placeholder={step.placeholder ?? '스킬을 입력하면 자동완성됩니다'}
          />
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
              className="flex-1 resize-none border border-[#E2E6EA] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#046C4E] focus:ring-2 focus:ring-[#046C4E]/10 max-h-32 disabled:bg-[#F4F6F8] disabled:text-[#98A2B3]"
            />
            {step?.kind === 'single' && step.optional && !busy && (
              <button
                onClick={handleSkip}
                className="text-xs text-[#98A2B3] hover:text-[#667085] px-2 py-2 whitespace-nowrap transition-colors"
              >
                건너뛰기
              </button>
            )}
            <button
              onClick={handleSend}
              disabled={busy || !input.trim()}
              className="bg-[#046C4E] text-white rounded-xl px-5 py-2.5 text-sm font-medium hover:bg-[#035A40] disabled:opacity-40 transition-colors whitespace-nowrap"
            >
              전송
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
