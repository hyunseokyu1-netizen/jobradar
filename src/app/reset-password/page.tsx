'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'

/** 재설정 메일 링크로 진입해 새 비밀번호를 설정하는 페이지 (recovery 세션 필요) */
export default function ResetPasswordPage() {
  const supabase = createSupabaseBrowserClient()
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (loading) return
    if (password.length < 8) {
      setError('비밀번호는 8자 이상이어야 합니다.')
      return
    }
    if (password !== confirm) {
      setError('비밀번호가 서로 일치하지 않습니다.')
      return
    }
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (error) {
      setError(
        error.message.includes('different from the old')
          ? '이전과 다른 비밀번호를 사용해주세요.'
          : '변경에 실패했어요. 재설정 링크가 만료됐을 수 있으니 다시 요청해주세요.'
      )
      return
    }
    setDone(true)
    setTimeout(() => router.push('/dashboard'), 1500)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F4F6F8] px-4 font-[family-name:var(--font-plex-kr)]">
      <div className="w-full max-w-md rounded-2xl border border-[#ECEEF0] bg-white p-8 shadow-[0_2px_14px_rgba(16,24,40,0.04)]">
        <h1 className="text-xl font-bold text-[#101828]">새 비밀번호 설정</h1>

        {done ? (
          <div className="mt-5 rounded-lg border border-[#CEEBDC] bg-[#ECFDF3] px-4 py-3 text-sm text-[#046C4E]">
            ✓ 비밀번호가 변경됐어요. 대시보드로 이동합니다…
          </div>
        ) : (
          <>
            <p className="mt-1.5 text-sm text-[#667085]">사용할 새 비밀번호를 입력해주세요.</p>
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#344054]">새 비밀번호</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={8}
                  placeholder="8자 이상"
                  autoFocus
                  autoComplete="new-password"
                  className="w-full rounded-[9px] border border-[#E2E6EA] px-3 py-2.5 text-sm outline-none transition-colors focus:border-[#046C4E]"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#344054]">새 비밀번호 확인</label>
                <input
                  type="password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className="w-full rounded-[9px] border border-[#E2E6EA] px-3 py-2.5 text-sm outline-none transition-colors focus:border-[#046C4E]"
                />
              </div>
              {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-500">{error}</p>}
              <button
                type="submit"
                disabled={loading || !password || !confirm}
                className="w-full rounded-[9px] bg-[#046C4E] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#035A40] disabled:opacity-50"
              >
                {loading ? '변경 중...' : '비밀번호 변경'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
