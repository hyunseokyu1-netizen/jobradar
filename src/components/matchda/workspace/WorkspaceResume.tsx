'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ResumeDocument from './ResumeDocument'
import { Sparkle, FileText } from '../ui/icons'
import { chatEditResume, tailorResumeForJob } from '@/app/profile/actions'
import { saveJobResumeDraft, syncJobResumeEnglish, resyncJobResumeFromMaster } from '@/app/workspace/actions'
import {
  studioToDoc, studioToRender, docToRender, renderResumeHtml, type StudioResume,
} from '@/lib/resume'
import { RESUME_FONT_CSS, type ResumeDesign } from '@/lib/matchda/resume-design'
import type { ResumeDocumentData, ResumeWorkspaceData } from '@/lib/matchda/types'
import { downloadResumeDocx, downloadResumePdf } from '@/lib/download'

type SectionLabels = { summary?: string; experience: string; skills: string; education: string }

/**
 * 워크스페이스 이력서 패널 — 좌: 한국어 원본(직접 편집 + AI 채팅 수정), 우: 영문(공고 맞춤).
 * 좌측 "이 공고에 맞춰 AI 분석"으로 JD 맞춤 한국어본을 생성 → 검토·수정 →
 * 우측 "AI 번역·맞춤화(영어)"로 영어 동기화. 상단에 PDF/DOCX 다운로드, 하단에 AI 어시스턴트 채팅.
 */
export default function WorkspaceResume({
  jobId,
  initialKo,
  initialEnDoc,
  design,
  note,
  contact,
  jobContext,
  masterChanged: initialMasterChanged,
  labels,
}: {
  jobId: string
  initialKo: StudioResume
  initialEnDoc: ResumeDocumentData
  design?: ResumeDesign
  note?: ResumeWorkspaceData['optimizationNote']
  contact: string
  jobContext: { title: string; company: string; description: string | null }
  /** 이 공고 초안을 만든 이후 마스터 이력서(/profile)가 더 최근에 수정됨 */
  masterChanged?: boolean
  labels: {
    original: string
    translated: string
    translating: string
    sections: SectionLabels
    sectionsEn: SectionLabels
    optimizeButton: string
    optimizing: string
  }
}) {
  const router = useRouter()
  const [ko, setKo] = useState<StudioResume>(initialKo)
  const [enDoc, setEnDoc] = useState<ResumeDocumentData>(initialEnDoc)
  const [editKey, setEditKey] = useState(0) // AI 수정 시 contentEditable 강제 remount
  const [busy, setBusy] = useState<'save' | 'chat' | 'tailor' | 'translate' | 'resync' | null>(null)
  const [savedAt, setSavedAt] = useState(false)
  const [dirty, setDirty] = useState(false)
  // 마스터 이력서(/profile)가 이 공고 초안보다 나중에 수정된 경우 안내 배너 노출
  const [masterChanged, setMasterChanged] = useState(!!initialMasterChanged)
  // 모바일(lg 미만): 원본/영문 탭 전환 + AI 채팅 하단 시트. lg 이상에서는 상태 무관하게 둘 다 표시.
  const [mobilePane, setMobilePane] = useState<'ko' | 'en'>('ko')
  const [chatOpen, setChatOpen] = useState(false)
  // AI 수정 직후의 사실 확인 UX — 경고 목록 + 수정 전 스냅샷(되돌리기용)
  const [factWarnings, setFactWarnings] = useState<string[]>([])
  const [undoSnapshot, setUndoSnapshot] = useState<StudioResume | null>(null)

  // 핸들러가 최신 ko를 읽도록 ref 동기화 (blur 커밋 직후 클릭 시 stale 방지)
  const koRef = useRef(ko)
  useEffect(() => { koRef.current = ko }, [ko])

  const [messages, setMessages] = useState<{ role: 'ai' | 'user'; text: string }[]>([
    { role: 'ai', text: '이력서를 어떻게 다듬을까요? 예: "경력 요약을 더 임팩트 있게", "리더십 경험을 강조해줘", "이 공고에 맞게 다시 써줘"' },
  ])
  const [input, setInput] = useState('')
  const [error, setError] = useState('')
  const chatRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, busy])

  // contentEditable blur → ko 상태 커밋
  function commit(mut: (d: StudioResume) => StudioResume, value: string, prev: string) {
    if (value === prev) return
    setKo(d => mut(d))
    setDirty(true)
    setSavedAt(false)
  }

  // 구조 변경(항목·경력 추가/삭제)용 — 값 비교 없이 항상 적용.
  // editKey를 올려 uncontrolled 편집 필드를 최신 데이터로 remount한다.
  function mutate(mut: (d: StudioResume) => StudioResume) {
    setKo(d => mut(d))
    setEditKey(k => k + 1)
    setDirty(true)
    setSavedAt(false)
  }

  async function handleSave() {
    setBusy('save')
    setError('')
    // 공고별 초안 저장 + 영어 재동기화 — 마스터 이력서(/profile)는 건드리지 않는다
    const saveRes = await saveJobResumeDraft(jobId, koRef.current)
    if (saveRes.error) { setError(saveRes.error); setBusy(null); return }
    const sync = await syncJobResumeEnglish(jobId, koRef.current)
    setBusy(null)
    if (sync.error) { setError(sync.error); return }
    if (sync.en) setEnDoc(studioToDoc(sync.en, contact))
    setDirty(false)
    setSavedAt(true)
    // 저장 = 사용자가 AI 제안을 검토·확정한 것 — 경고와 되돌리기 스냅샷 해제
    setFactWarnings([])
    setUndoSnapshot(null)
    setTimeout(() => setSavedAt(false), 2500)
    router.refresh()
  }

  // 마스터 이력서 최신 내용으로 이 공고 초안을 덮어쓴다 (명시적 확인 후 실행)
  async function handleResyncFromMaster() {
    if (!confirm('마스터 이력서 최신 내용을 이 공고 초안에 덮어쓸까요? 지금까지 이 공고에서 수정한 내용은 사라집니다.')) return
    setBusy('resync')
    setError('')
    const res = await resyncJobResumeFromMaster(jobId)
    setBusy(null)
    if (res.error) { setError(res.error); return }
    if (res.ko) {
      setKo(res.ko)
      setEditKey(k => k + 1)
    }
    setMasterChanged(false)
    setDirty(false)
    router.refresh()
  }

  async function handleChatSend() {
    const instruction = input.trim()
    if (!instruction || busy) return
    setInput('')
    setError('')
    setMessages(m => [...m, { role: 'user', text: instruction }])
    setBusy('chat')
    const before = koRef.current
    const res = await chatEditResume(instruction, before, {
      title: jobContext.title,
      company: jobContext.company,
      description: jobContext.description ?? undefined,
    })
    setBusy(null)
    if (res.error) {
      setError(res.error)
      setMessages(m => [...m, { role: 'ai', text: `⚠️ ${res.error}` }])
      return
    }
    // AI 수정은 저장되지 않은 제안 상태 — 사용자가 검토 후 "저장"으로 확정한다
    if (res.ko) {
      setUndoSnapshot(before)
      setFactWarnings((res.warnings ?? []).map(w => w.message))
      setKo(res.ko)
      setEditKey(k => k + 1)
      setDirty(true)
      setSavedAt(false)
    }
    if (res.en) setEnDoc(studioToDoc(res.en, contact))
    setMessages(m => [...m, { role: 'ai', text: `${res.reply ?? '수정했어요.'} 검토 후 "저장"을 눌러 확정해주세요.` }])
  }

  // "이 공고에 맞춰 AI 분석" — 한국어 원본을 JD에 맞춰 재구성 (번역·저장은 별도 단계)
  async function handleTailorToJob() {
    setBusy('tailor')
    setError('')
    const before = koRef.current
    const res = await tailorResumeForJob(jobId, before, {
      title: jobContext.title,
      company: jobContext.company,
      description: jobContext.description,
    })
    setBusy(null)
    if (res.error) { setError(res.error); return }
    if (res.ko) {
      setUndoSnapshot(before)
      setFactWarnings((res.warnings ?? []).map(w => w.message))
      setKo(res.ko)
      setEditKey(k => k + 1)
      setDirty(true)
      setSavedAt(false)
    }
  }

  // AI 제안 거절 — 수정 직전 상태로 복원 (저장 전이므로 DB에는 아무 영향 없음)
  function handleUndoAi() {
    if (!undoSnapshot) return
    setKo(undoSnapshot)
    setEditKey(k => k + 1)
    setUndoSnapshot(null)
    setFactWarnings([])
  }

  // "AI 번역 · 맞춤화 (영어)" — 현재 한국어를 영어로 재동기화하고 저장까지 함께 처리
  async function handleTranslate() {
    setBusy('translate')
    setError('')
    const sync = await syncJobResumeEnglish(jobId, koRef.current)
    setBusy(null)
    if (sync.error) { setError(sync.error); return }
    if (sync.en) setEnDoc(studioToDoc(sync.en, contact))
    setDirty(false)
    setSavedAt(true)
    setTimeout(() => setSavedAt(false), 2500)
    router.refresh()
  }

  const fileBase = `resume_${(ko.name || 'resume').replace(/\s+/g, '_')}`
  const fileBaseEn = `resume_${(enDoc.name || ko.name || 'resume').replace(/\s+/g, '_')}`
  const accentHex = design?.accent ?? '#046C4E'
  const koRender = () => studioToRender(ko, contact, 'ko', accentHex)
  const enRender = () => docToRender(enDoc, accentHex)

  const font = design ? RESUME_FONT_CSS[design.font] : RESUME_FONT_CSS.plex
  const accent = design?.accent ?? '#046C4E'

  const dlBtn = 'flex items-center gap-1 rounded-[8px] border border-[#E2E6EA] bg-white px-2.5 py-[6px] text-[12px] font-semibold text-[#475467] hover:bg-[#F4F6F8]'

  const tabBtn = (active: boolean) =>
    `flex-1 rounded-[8px] py-2 text-[13px] font-semibold transition-colors ${
      active ? 'bg-white text-[#046C4E] shadow-[0_1px_2px_rgba(16,24,40,0.08)]' : 'text-[#667085]'
    }`

  return (
    <>
      {/* 모바일 탭: 원본/영문 전환 (lg 이상은 2단 병렬이므로 숨김) */}
      <div className="mx-auto max-w-[1320px] px-4 pt-4 sm:px-7 lg:hidden">
        <div className="flex gap-1 rounded-[10px] bg-[#E7EBEE] p-1">
          <button type="button" onClick={() => setMobilePane('ko')} className={tabBtn(mobilePane === 'ko')}>
            한국어 원본
          </button>
          <button type="button" onClick={() => setMobilePane('en')} className={tabBtn(mobilePane === 'en')}>
            영문 이력서
          </button>
        </div>
      </div>

      {/* AI 수정 직후 사실 확인 — 저장 전까지는 제안 상태이며, 되돌리기로 거절할 수 있다 */}
      {undoSnapshot && (
        <div className="mx-auto mt-3 max-w-[1320px] px-4 sm:px-7">
          <div className="rounded-[10px] border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-800">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-semibold">
                ✨ AI가 이력서를 수정했어요 — 제출 전 사실이 맞는지 확인해주세요. 저장을 눌러야 반영됩니다.
              </span>
              <button
                type="button"
                onClick={handleUndoAi}
                disabled={busy !== null}
                className="shrink-0 rounded-[8px] border border-amber-300 bg-white px-3 py-1 font-semibold text-amber-800 hover:bg-amber-100 disabled:opacity-50"
              >
                ↺ 수정 전으로 되돌리기
              </button>
            </div>
            {factWarnings.length > 0 && (
              <ul className="mt-2 list-disc space-y-0.5 pl-5 text-[12.5px]">
                {factWarnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* 마스터 이력서(/profile)가 이 공고 초안보다 나중에 수정됨 — 자동 덮어쓰기 없이 안내만 */}
      {masterChanged && (
        <div className="mx-auto mt-3 max-w-[1320px] px-4 sm:px-7">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-[10px] border border-amber-200 bg-amber-50 px-4 py-2.5 text-[13px] text-amber-800">
            <span>마스터 이력서(내 이력서)가 이 공고 초안을 만든 뒤 수정됐어요. 이 초안은 자동으로 바뀌지 않아요.</span>
            <button
              type="button"
              onClick={handleResyncFromMaster}
              disabled={busy !== null}
              className="shrink-0 rounded-[8px] border border-amber-300 bg-white px-3 py-1 font-semibold text-amber-800 hover:bg-amber-100 disabled:opacity-50"
            >
              {busy === 'resync' ? '갱신 중...' : '최신 마스터로 갱신'}
            </button>
          </div>
        </div>
      )}

      <div className="mx-auto grid max-w-[1320px] grid-cols-1 gap-[22px] px-4 pb-32 pt-4 sm:px-7 lg:grid-cols-2 lg:pb-6 lg:pt-6">
        {/* 좌: 한국어 원본 (편집 가능) */}
        <div className={mobilePane === 'ko' ? '' : 'hidden lg:block'}>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 rounded-lg border border-[#E2E6EA] bg-white px-3 py-[6px]">
              <span className="h-[7px] w-[7px] rounded-full bg-[#98A2B3]" />
              <span className="text-[13px] font-semibold text-[#475467]">{labels.original}</span>
              <span className="ml-1 text-[11px] text-[#98A2B3]">· 클릭해서 수정</span>
            </div>
            <div className="flex items-center gap-1.5">
              {savedAt && <span className="text-[11px] text-green-600">✓ 저장됨</span>}
              {dirty && !savedAt && <span className="text-[11px] text-amber-600">저장 안 됨</span>}
              <button type="button" onClick={handleTailorToJob} disabled={busy !== null}
                className="flex items-center gap-[6px] rounded-[9px] border border-[#CEEBDC] bg-[#ECFDF3] px-3 py-[7px] text-[13px] font-semibold text-[#046C4E] hover:bg-[#DCF5E8] disabled:opacity-60">
                <Sparkle size={14} strokeWidth={1.8} />
                {busy === 'tailor' ? labels.optimizing : labels.optimizeButton}
              </button>
              <button type="button" onClick={handleSave} disabled={busy !== null}
                className="rounded-[8px] bg-[#046C4E] px-3 py-[6px] text-[12px] font-semibold text-white hover:bg-[#035A40] disabled:opacity-50">
                {busy === 'save' ? '저장 중...' : '저장'}
              </button>
              <button type="button" onClick={() => downloadResumePdf(renderResumeHtml(koRender()), `${fileBase}_ko`)} className={dlBtn}>
                <FileText size={13} /> PDF
              </button>
              <button type="button" onClick={() => downloadResumeDocx(koRender(), `${fileBase}_ko`)} className={dlBtn}>DOCX</button>
            </div>
          </div>

          <EditableKoDoc ko={ko} contact={contact} font={font} accent={accent}
            modern={design?.template === 'modern'} lineHeight={design?.lineHeight ?? 1.75}
            editKey={editKey} commit={commit} mutate={mutate} />
        </div>

        {/* 우: 영문 (공고 맞춤) */}
        <div className={mobilePane === 'en' ? '' : 'hidden lg:block'}>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <button type="button" onClick={handleTranslate} disabled={busy !== null}
              className="flex items-center gap-2 rounded-lg bg-[#046C4E] px-3 py-[6px] text-[13px] font-semibold text-white hover:bg-[#035A40] disabled:opacity-50">
              <Sparkle size={14} strokeWidth={1.8} />
              {busy === 'translate' ? labels.translating : labels.translated}
            </button>
            <div className="flex items-center gap-1.5">
              <button type="button" onClick={() => downloadResumePdf(renderResumeHtml(enRender()), `${fileBaseEn}_en`)} className={dlBtn}>
                <FileText size={13} /> PDF
              </button>
              <button type="button" onClick={() => downloadResumeDocx(enRender(), `${fileBaseEn}_en`)} className={dlBtn}>DOCX</button>
            </div>
          </div>
          <ResumeDocument doc={enDoc} labels={labels.sectionsEn} variant="translated" note={note} design={design} />
        </div>
      </div>

      {/* AI 어시스턴트 채팅 — 모바일: 하단 고정 시트(헤더 탭으로 열고 닫기), lg 이상: 본문 하단 카드 */}
      <div className="fixed inset-x-0 bottom-0 z-30 lg:static lg:z-auto lg:mx-auto lg:max-w-[1320px] lg:px-7 lg:pb-20">
        <div className="rounded-t-[16px] border border-[#E7EBEE] bg-white shadow-[0_-6px_24px_rgba(16,24,40,0.10)] lg:rounded-[16px] lg:shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
          <button
            type="button"
            onClick={() => setChatOpen(o => !o)}
            aria-expanded={chatOpen}
            className="flex w-full items-center gap-2 border-b border-[#F0F2F4] px-5 py-3 text-left lg:pointer-events-none"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#ECFDF3]">
              <Sparkle size={15} strokeWidth={1.8} className="text-[#046C4E]" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[14px] font-bold text-[#101828]">이력서 AI 어시스턴트</div>
              <div className="truncate text-[11px] text-[#98A2B3]">
                <span className="lg:hidden">대화로 수정하면 위 이력서가 함께 갱신됩니다</span>
                <span className="hidden lg:inline">대화로 이력서를 수정하면 좌·우 패널이 함께 갱신됩니다</span>
              </div>
            </div>
            <span className={`text-[#98A2B3] transition-transform lg:hidden ${chatOpen ? 'rotate-180' : ''}`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m18 15-6-6-6 6" /></svg>
            </span>
          </button>

          <div className={chatOpen ? 'block' : 'hidden lg:block'}>
          <div ref={chatRef} className="max-h-[36dvh] space-y-3 overflow-y-auto px-5 py-4 lg:max-h-[280px]">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-[13.5px] leading-relaxed ${
                  m.role === 'user' ? 'rounded-br-sm bg-[#046C4E] text-white' : 'rounded-bl-sm bg-[#F4F6F8] text-[#344054]'
                }`}>{m.text}</div>
              </div>
            ))}
            {busy === 'chat' && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-sm bg-[#F4F6F8] px-4 py-2.5 text-[13.5px] text-[#98A2B3]">
                  이력서를 수정하는 중<span className="animate-pulse">...</span>
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-[#F0F2F4] p-3">
            {error && <p className="px-2 pb-2 text-xs text-red-500">{error}</p>}
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleChatSend() } }}
                disabled={busy === 'chat'}
                rows={1}
                placeholder="예: 이 공고에 맞게 경력 요약을 다시 써줘"
                className="max-h-32 flex-1 resize-none rounded-xl border border-[#E2E6EA] px-4 py-2.5 text-sm outline-none focus:border-[#046C4E] focus:ring-2 focus:ring-[#046C4E]/10 disabled:bg-[#F4F6F8]"
              />
              <button type="button" onClick={handleChatSend} disabled={busy === 'chat' || !input.trim()}
                className="whitespace-nowrap rounded-xl bg-[#046C4E] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#035A40] disabled:opacity-40">
                보내기
              </button>
            </div>
          </div>
          </div>
        </div>
      </div>
    </>
  )
}

// 편집 가능한 텍스트 조각 (uncontrolled contentEditable, blur 시 커밋)
// editKey가 바뀌면 remount되어 AI 수정 결과가 반영된다.
// ph: 값이 비어있을 때 흐리게 표시되는 안내 문구 (클릭해서 입력 유도)
function EditableText({
  v, cls, onCommit, editKey, ph,
}: {
  v: string
  cls: string
  onCommit: (val: string) => void
  editKey: number
  ph?: string
}) {
  return (
    <span
      key={editKey}
      contentEditable
      suppressContentEditableWarning
      data-ph={ph}
      onBlur={e => onCommit(e.currentTarget.textContent ?? '')}
      className={`${cls} rounded outline-none focus:bg-[#ECFDF3] focus:ring-1 focus:ring-[#CEEBDC] ${
        ph ? 'empty:before:text-[#C5CBD3] empty:before:content-[attr(data-ph)]' : ''
      }`}
    >{v}</span>
  )
}

// ── 편집 가능한 한국어 이력서 문서 ──────────────────────────────
function EditableKoDoc({
  ko, contact, font, accent, modern, lineHeight, editKey, commit, mutate,
}: {
  ko: StudioResume
  contact: string
  font: string
  accent: string
  modern: boolean
  lineHeight: number
  editKey: number
  commit: (mut: (d: StudioResume) => StudioResume, value: string, prev: string) => void
  mutate: (mut: (d: StudioResume) => StudioResume) => void
}) {
  const exps = ko.experience.filter(e => !e.hidden)
  const edu = ko.education.filter(e => !e.hidden)
  const skills = ko.skills.filter(s => !ko.hidden_skills.includes(s))

  const label = (text: string) => (
    <div className="mb-3 mt-6 border-b border-[#EEF0F2] pb-1.5 text-[11px] font-semibold uppercase tracking-[0.09em]"
      style={modern ? { color: accent } : { color: '#9AA3AD' }}>{text}</div>
  )

  return (
    <div className="overflow-hidden rounded-[14px] border border-[#ECEEF0] bg-white shadow-[0_2px_14px_rgba(16,24,40,0.04)]"
      style={{ fontFamily: font, lineHeight }}>
      {modern && <div className="h-[6px] w-full" style={{ background: accent }} />}
      <div className="px-6 py-8 sm:px-12 sm:py-11">
        <div className={modern ? 'text-center' : ''}>
          <EditableText editKey={editKey} v={ko.name} cls="text-[23px] font-bold tracking-[-0.01em] text-[#101828]"
            onCommit={val => commit(d => ({ ...d, name: val }), val, ko.name)} />
          <div className="mt-[3px] text-[15px] font-semibold" style={{ color: accent }}>
            <EditableText editKey={editKey} v={ko.title} cls="" onCommit={val => commit(d => ({ ...d, title: val }), val, ko.title)} />
          </div>
          {/* 연락처 줄: 이메일(고정) · 전화번호(편집) · 링크(편집) — 저장 시 한/영 문서·다운로드에 반영 */}
          <div className="mt-[6px] font-[family-name:var(--font-plex-mono)] text-[13px] text-[#98A2B3]">
            {contact}
            <span className="mx-1.5 text-[#D0D5DD]">·</span>
            <EditableText editKey={editKey} v={ko.phone} ph="전화번호" cls=""
              onCommit={val => commit(d => ({ ...d, phone: val }), val, ko.phone)} />
            <span className="mx-1.5 text-[#D0D5DD]">·</span>
            <EditableText editKey={editKey} v={ko.links} ph="포트폴리오·GitHub 링크" cls=""
              onCommit={val => commit(d => ({ ...d, links: val }), val, ko.links)} />
          </div>
        </div>

        {(ko.summary || true) && (
          <>
            {label('경력 요약')}
            <p className="whitespace-pre-wrap text-[13.5px] text-[#475467]">
              <EditableText editKey={editKey} v={ko.summary} cls="block min-h-[1.4em]"
                onCommit={val => commit(d => ({ ...d, summary: val }), val, ko.summary)} />
            </p>
          </>
        )}

        {exps.length > 0 && (
          <>
            {label('경력')}
            {exps.map((exp, i) => {
              // ko.experience 내 실제 인덱스 (숨김 항목 고려)
              const realIdx = ko.experience.indexOf(exp)
              // 편집 중 빈 항목이 사라지지 않도록 filter 없이 유지 (내보내기 단계에서 빈 줄 제거됨)
              const bullets = exp.description ? exp.description.split('\n').map(l => l.replace(/^[-•\s]+/, '').trim()) : []
              // 항목 추가/삭제(구조 변경) — 필드 remount 필요
              const setBullets = (next: string[]) => mutate(d => patchExp(d, realIdx, { description: next.join('\n') }))
              return (
                <div key={realIdx} className={`group/exp ${i > 0 ? 'mt-4' : ''}`}>
                  <div className="flex items-baseline justify-between gap-2">
                    <div className="text-[14px] font-semibold text-[#1F2A37]">
                      <EditableText editKey={editKey} v={exp.company} cls="" onCommit={val => commit(d => patchExp(d, realIdx, { company: val }), val, exp.company)} />
                      {' — '}
                      <EditableText editKey={editKey} v={exp.position} cls="" onCommit={val => commit(d => patchExp(d, realIdx, { position: val }), val, exp.position)} />
                    </div>
                    <div className="flex shrink-0 items-baseline gap-1.5 text-[11.5px] text-[#98A2B3]">
                      <EditableText editKey={editKey} v={exp.period} cls="" onCommit={val => commit(d => patchExp(d, realIdx, { period: val }), val, exp.period)} />
                      <button type="button" title="이 경력 삭제"
                        onClick={() => mutate(d => ({ ...d, experience: d.experience.filter((_, j) => j !== realIdx) }))}
                        className="opacity-0 transition-opacity hover:text-red-500 group-hover/exp:opacity-100">✕</button>
                    </div>
                  </div>
                  <ul className="mt-1.5 list-disc pl-[18px] text-[13px] text-[#475467]">
                    {bullets.map((b, bi) => (
                      <li key={bi} className="group/li">
                        <span className="flex items-start gap-1">
                          <EditableText editKey={editKey} v={b} cls="block flex-1"
                            onCommit={val => {
                              const next = [...bullets]; next[bi] = val
                              const desc = next.join('\n')
                              commit(d => patchExp(d, realIdx, { description: desc }), desc, exp.description)
                            }} />
                          <button type="button" title="항목 삭제"
                            onClick={() => setBullets(bullets.filter((_, j) => j !== bi))}
                            className="mt-[2px] shrink-0 text-[11px] leading-none text-[#C4CAD2] opacity-0 transition-opacity hover:text-red-500 group-hover/li:opacity-100">✕</button>
                        </span>
                      </li>
                    ))}
                  </ul>
                  <button type="button"
                    onClick={() => setBullets([...bullets, ''])}
                    className="mt-1 ml-[18px] text-[12px] font-medium text-[#98A2B3] hover:text-[#046C4E]">+ 항목 추가</button>
                </div>
              )
            })}
            <button type="button"
              onClick={() => mutate(d => ({ ...d, experience: [...d.experience, { company: '', position: '', period: '', description: '' }] }))}
              className="mt-4 rounded-[8px] border border-dashed border-[#D0D5DB] px-3 py-1.5 text-[12px] font-medium text-[#667085] hover:border-[#046C4E] hover:text-[#046C4E]">+ 경력 추가</button>
          </>
        )}

        {skills.length > 0 && (
          <>
            {label('스킬')}
            <div className="flex flex-wrap gap-1.5">
              {skills.map(s => (
                <span key={s} className="rounded-[7px] border px-2.5 py-1 text-[12px]"
                  style={{ background: `${accent}0D`, borderColor: `${accent}30`, color: accent }}>{s}</span>
              ))}
            </div>
          </>
        )}

        {edu.length > 0 && (
          <>
            {label('학력')}
            {edu.map((e, ei) => (
              <div key={ei} className={`flex items-baseline justify-between gap-2 text-[13px] font-semibold text-[#1F2A37]${ei > 0 ? ' mt-1.5' : ''}`}>
                <span>{[e.school, e.major, e.degree].filter(Boolean).join(' · ')}</span>
                <span className="shrink-0 text-[11.5px] font-normal text-[#98A2B3]">{e.period}</span>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}

function patchExp(d: StudioResume, idx: number, patch: Partial<StudioResume['experience'][number]>): StudioResume {
  return { ...d, experience: d.experience.map((e, i) => (i === idx ? { ...e, ...patch } : e)) }
}
