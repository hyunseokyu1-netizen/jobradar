'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import CoverLetterModal from '@/components/CoverLetterModal'
import TailoredResumeModal from '@/components/TailoredResumeModal'
import JdInputModal from '@/components/JdInputModal'
import AppliedResumeModal from '@/components/AppliedResumeModal'
import MemoModal from './MemoModal'
import JobInfoModal from './JobInfoModal'
import { matchSingleJob, deleteJob, updateMatchStatus } from '@/app/actions'
import { STATUS_OPTIONS, type Status } from '@/components/StatusButton'
import type { AppliedDocument } from '@/lib/applied-documents'
import { FileText, Sparkle } from '../ui/icons'

type ModalKind = 'cover' | 'tailored' | 'jd' | 'applied' | 'memo' | 'info' | null

/**
 * 워크스페이스 per-job 액션 진입점 (로그인 실데이터에서만).
 * 옛 JobList의 모달·액션(커버레터·맞춤이력서·JD입력·지원이력서·메모·재매칭·삭제)을 재사용해 이식.
 */
export default function WorkspaceActions({
  jobId,
  jobTitle,
  company,
  description,
  memo,
  appliedResumeFilename,
  appliedResumeText,
  appliedDocuments,
  location,
  appliedAt,
  status,
}: {
  jobId: string
  jobTitle: string
  company: string
  description: string | null
  memo: string | null
  appliedResumeFilename: string | null
  appliedResumeText: string | null
  appliedDocuments?: AppliedDocument[]
  location: string | null
  appliedAt: string | null
  status?: string | null
}) {
  const router = useRouter()
  const [modal, setModal] = useState<ModalKind>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  // 메뉴 뷰: 기본 항목 목록 ↔ 지원 상태 선택 목록
  const [menuView, setMenuView] = useState<'main' | 'status'>('main')
  const [curStatus, setCurStatus] = useState<Status>((status as Status) ?? 'new')
  const [busy, setBusy] = useState<'match' | 'delete' | 'status' | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
        setMenuView('main')
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  async function changeStatus(next: Status) {
    setMenuOpen(false)
    setMenuView('main')
    if (next === curStatus) return
    setBusy('status')
    const res = await updateMatchStatus(jobId, next)
    setBusy(null)
    if (res.error) { alert(res.error); return }
    setCurStatus(next)
    router.refresh()
  }

  async function rematch() {
    setMenuOpen(false)
    setBusy('match')
    await matchSingleJob(jobId)
    setBusy(null)
    router.refresh()
  }

  async function remove() {
    setMenuOpen(false)
    if (!confirm('이 공고를 삭제할까요? 되돌릴 수 없습니다.')) return
    setBusy('delete')
    const res = await deleteJob(jobId)
    if (res.error) {
      setBusy(null)
      alert(res.error)
      return
    }
    router.push('/dashboard')
  }

  const btn =
    'flex items-center gap-[6px] rounded-[9px] border border-[#E2E6EA] bg-white px-3 py-[8px] text-[13px] font-semibold text-[#475467] hover:bg-[#F4F6F8] disabled:opacity-50'
  const menuItem = 'block w-full px-4 py-[8px] text-left text-[13px] text-[#344054] hover:bg-[#F4F6F8]'

  return (
    <>
      <button type="button" onClick={() => setModal('cover')} className={btn}>
        <FileText size={15} className="text-[#046C4E]" />
        <span className="hidden sm:inline">커버레터</span>
      </button>
      <button type="button" onClick={() => setModal('tailored')} className={btn}>
        <Sparkle size={15} strokeWidth={1.8} className="text-[#046C4E]" />
        <span className="hidden sm:inline">맞춤 이력서</span>
      </button>

      {/* 오버플로 메뉴 */}
      <div ref={menuRef} className="relative">
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          disabled={busy !== null}
          className={`${btn} px-[10px]`}
          aria-label="더보기"
        >
          {busy === 'match' ? '매칭…' : busy === 'delete' ? '삭제…' : busy === 'status' ? '변경…' : '⋯'}
        </button>
        {menuOpen && (
          <div className="absolute right-0 z-30 mt-1 w-[196px] overflow-hidden rounded-[10px] border border-[#ECEEF0] bg-white py-1 shadow-[0_8px_24px_rgba(16,24,40,0.12)]">
            {menuView === 'status' ? (
              <>
                <button
                  type="button"
                  className={`${menuItem} border-b border-[#F0F2F4] text-[#98A2B3]`}
                  onClick={() => setMenuView('main')}
                >
                  ← 뒤로
                </button>
                {STATUS_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    className={`${menuItem} ${opt.menu} flex items-center justify-between`}
                    onClick={() => changeStatus(opt.value)}
                  >
                    <span>{opt.label}</span>
                    {opt.value === curStatus && <span className="text-[#046C4E]">✓</span>}
                  </button>
                ))}
              </>
            ) : (
              <>
                <button
                  type="button"
                  className={`${menuItem} flex items-center justify-between gap-2`}
                  onClick={() => setMenuView('status')}
                >
                  <span>지원 상태 변경</span>
                  <span className="shrink-0 text-[11px] text-[#98A2B3]">
                    {STATUS_OPTIONS.find(o => o.value === curStatus)?.label ?? '미분류'}
                  </span>
                </button>
                <div className="my-1 border-t border-[#F0F2F4]" />
                <button type="button" className={menuItem} onClick={() => { setMenuOpen(false); setModal('jd') }}>
                  JD 직접 입력
                </button>
                <button type="button" className={menuItem} onClick={() => { setMenuOpen(false); setModal('applied') }}>
                  제출 서류
                </button>
                <button type="button" className={menuItem} onClick={() => { setMenuOpen(false); setModal('memo') }}>
                  메모
                </button>
                <button type="button" className={menuItem} onClick={() => { setMenuOpen(false); setModal('info') }}>
                  공고 정보 편집
                </button>
                <button type="button" className={menuItem} onClick={rematch}>
                  AI 재매칭
                </button>
                <div className="my-1 border-t border-[#F0F2F4]" />
                <button type="button" className={`${menuItem} text-red-500 hover:bg-red-50`} onClick={remove}>
                  공고 삭제
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* 모달들 */}
      {modal === 'cover' && (
        <CoverLetterModal jobId={jobId} jobTitle={jobTitle} company={company} onClose={() => setModal(null)} />
      )}
      {modal === 'tailored' && (
        <TailoredResumeModal jobId={jobId} jobTitle={jobTitle} company={company} onClose={() => setModal(null)} />
      )}
      {modal === 'jd' && (
        <JdInputModal
          jobId={jobId}
          jobTitle={jobTitle}
          company={company}
          initialDescription={description}
          onClose={() => setModal(null)}
          onMatched={() => router.refresh()}
        />
      )}
      {modal === 'applied' && (
        <AppliedResumeModal
          jobId={jobId}
          jobTitle={jobTitle}
          company={company}
          initialFilename={appliedResumeFilename}
          initialText={appliedResumeText}
          initialDocuments={appliedDocuments}
          onClose={() => setModal(null)}
          onUploaded={() => router.refresh()}
        />
      )}
      {modal === 'memo' && (
        <MemoModal jobId={jobId} jobTitle={jobTitle} company={company} initialMemo={memo} onClose={() => setModal(null)} />
      )}
      {modal === 'info' && (
        <JobInfoModal
          jobId={jobId}
          initialTitle={jobTitle}
          initialCompany={company}
          initialLocation={location ?? ''}
          initialAppliedAt={appliedAt}
          onClose={() => setModal(null)}
        />
      )}
    </>
  )
}
