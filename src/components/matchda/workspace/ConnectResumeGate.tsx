'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { structureResumeForWorkspace } from '@/app/profile/actions'
import { Sparkle } from '../ui/icons'

/**
 * 구조화 이력서(onboarding_en)가 없는 유저가 워크스페이스에 진입했을 때
 * 목업(가짜 이력서) 대신 보여주는 연결 안내 화면.
 * - 업로드된 이력서 원문이 있으면: AI 구조화로 즉시 연결
 * - 없으면: 온보딩 채팅으로 유도
 */
export default function ConnectResumeGate({ hasResumeText }: { hasResumeText: boolean }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function connect() {
    setBusy(true)
    setError('')
    const res = await structureResumeForWorkspace()
    setBusy(false)
    if (res.error) {
      setError(res.error)
      return
    }
    router.refresh()
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-[#ECEEF0] bg-white p-8 text-center shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#ECFDF3]">
          <Sparkle size={22} strokeWidth={1.8} className="text-[#046C4E]" />
        </div>
        <h2 className="text-lg font-bold text-[#101828]">이력서를 연결해주세요</h2>
        <p className="mt-2 text-sm leading-relaxed text-[#667085]">
          워크스페이스는 내 이력서와 공고를 나란히 놓고
          <br />
          AI로 맞춤화하는 공간이에요.
          {hasResumeText
            ? ' 업로드하신 이력서를 분석해 바로 연결할 수 있어요.'
            : ' 먼저 이력서를 작성하거나 업로드해주세요.'}
        </p>

        {error && <p className="mt-3 text-xs text-red-500">{error}</p>}

        <div className="mt-6 space-y-2">
          {hasResumeText && (
            <button
              type="button"
              onClick={connect}
              disabled={busy}
              className="w-full rounded-[10px] bg-[#046C4E] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#035A40] disabled:opacity-50"
            >
              {busy ? 'AI가 이력서를 분석하는 중... (최대 30초)' : '✦ 업로드한 이력서로 자동 연결'}
            </button>
          )}
          <a
            href="/onboarding?redo=1"
            className="block w-full rounded-[10px] border border-[#E2E6EA] py-2.5 text-sm font-semibold text-[#344054] transition-colors hover:bg-[#F4F6F8]"
          >
            채팅으로 이력서 작성하기
          </a>
          {!hasResumeText && (
            <a
              href="/profile"
              className="block w-full rounded-[10px] border border-[#E2E6EA] py-2.5 text-sm font-semibold text-[#344054] transition-colors hover:bg-[#F4F6F8]"
            >
              프로필에서 이력서 업로드
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
