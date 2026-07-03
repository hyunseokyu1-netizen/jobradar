'use client'

import { useState, useRef, useEffect } from 'react'
import { askSupportBot, type SupportMessage } from '@/app/support-actions'

const GREETING = '안녕하세요! MatchDa 사용법 도우미예요. 무엇을 도와드릴까요? 예: "공고는 어디서 추가하나요?", "영어 이력서 만드는 법"'

const SUGGESTIONS = [
  '공고를 어떻게 추가하나요?',
  '영어 이력서 만드는 법',
  '맞춤 이력서가 뭔가요?',
]

export default function SupportChat() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<SupportMessage[]>([{ role: 'assistant', content: GREETING }])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, busy, open])

  async function send(text: string) {
    const content = text.trim()
    if (!content || busy) return
    setInput('')
    const next: SupportMessage[] = [...messages, { role: 'user', content }]
    setMessages(next)
    setBusy(true)
    const res = await askSupportBot(next)
    setBusy(false)
    setMessages(m => [...m, { role: 'assistant', content: res.reply ?? `⚠️ ${res.error ?? '오류가 발생했어요.'}` }])
  }

  return (
    <>
      {/* 토글 버튼 */}
      <button
        type="button"
        aria-label="고객센터 챗봇 열기"
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-5 right-5 z-[60] flex h-14 w-14 items-center justify-center rounded-full bg-[#046C4E] text-white shadow-[0_6px_20px_rgba(4,108,78,0.35)] transition-transform hover:scale-105 active:scale-95"
      >
        {open ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></svg>
        )}
      </button>

      {/* 채팅 패널 */}
      {open && (
        <div className="fixed bottom-24 right-5 z-[60] flex h-[520px] w-[calc(100vw-2.5rem)] max-w-[380px] flex-col overflow-hidden rounded-[16px] border border-[#ECEEF0] bg-white shadow-[0_12px_40px_rgba(16,24,40,0.18)]">
          <div className="flex items-center gap-2.5 border-b border-[#F0F2F4] bg-[#046C4E] px-4 py-3 text-white">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-[15px]">💬</div>
            <div>
              <div className="text-[14px] font-bold">MatchDa 도우미</div>
              <div className="text-[11px] text-white/80">사용법·기능 안내</div>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] whitespace-pre-wrap rounded-[13px] px-3 py-2 text-[13px] leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-[#046C4E] text-white'
                      : 'bg-[#F4F6F8] text-[#344054]'
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {busy && (
              <div className="flex justify-start">
                <div className="rounded-[13px] bg-[#F4F6F8] px-3 py-2 text-[13px] text-[#98A2B3]">답변 작성 중…</div>
              </div>
            )}
            {messages.length === 1 && !busy && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {SUGGESTIONS.map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => send(s)}
                    className="rounded-full border border-[#ECEEF0] bg-white px-3 py-1.5 text-[12px] text-[#475467] transition-colors hover:border-[#046C4E] hover:text-[#046C4E]"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          <form
            onSubmit={e => { e.preventDefault(); send(input) }}
            className="flex items-center gap-2 border-t border-[#F0F2F4] px-3 py-2.5"
          >
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="궁금한 점을 입력하세요"
              className="min-w-0 flex-1 rounded-lg border border-[#ECEEF0] px-3 py-2 text-[13px] outline-none focus:border-[#046C4E]"
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              className="shrink-0 rounded-lg bg-[#046C4E] px-3.5 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-[#035A40] disabled:opacity-50"
            >
              보내기
            </button>
          </form>
        </div>
      )}
    </>
  )
}
