'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'

/** 비밀번호 찾기 — 이메일로 재설정 링크 발송 */
export default function ForgotPasswordPage() {
  const supabase = createSupabaseBrowserClient()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (loading) return
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    })
    setLoading(false)

    if (error) {
      setError('메일 발송에 실패했어요. 잠시 후 다시 시도해주세요.')
      return
    }
    setSent(true)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F4F6F8] px-4 font-[family-name:var(--font-plex-kr)]">
      <div className="w-full max-w-md rounded-2xl border border-[#ECEEF0] bg-white p-8 shadow-[0_2px_14px_rgba(16,24,40,0.04)]">
        <h1 className="text-xl font-bold text-[#101828]">비밀번호 찾기</h1>

        {sent ? (
          <div className="mt-5">
            <div className="rounded-lg border border-[#CEEBDC] bg-[#ECFDF3] px-4 py-3 text-sm text-[#046C4E]">
              ✉️ <b>{email}</b> 로 재설정 링크를 보냈어요.
              <br />
              메일함(스팸함 포함)을 확인해주세요.
            </div>
            <p className="mt-4 text-xs leading-relaxed text-[#98A2B3]">
              메일이 오지 않으면 가입한 이메일이 맞는지 확인 후 다시 시도해주세요.
              소셜 로그인(Google)으로 가입한 계정은 비밀번호가 없어 메일이 발송되지 않습니다.
            </p>
          </div>
        ) : (
          <>
            <p className="mt-1.5 text-sm text-[#667085]">
              가입한 이메일을 입력하면 비밀번호 재설정 링크를 보내드려요.
            </p>
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#344054]">이메일</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  autoFocus
                  className="w-full rounded-[9px] border border-[#E2E6EA] px-3 py-2.5 text-sm outline-none transition-colors focus:border-[#046C4E]"
                />
              </div>
              {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-500">{error}</p>}
              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="w-full rounded-[9px] bg-[#046C4E] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#035A40] disabled:opacity-50"
              >
                {loading ? '발송 중...' : '재설정 링크 보내기'}
              </button>
            </form>
          </>
        )}

        <p className="mt-6 text-center text-sm text-[#667085]">
          <Link href="/login" className="font-medium text-[#046C4E] hover:underline">
            ← 로그인으로 돌아가기
          </Link>
        </p>
      </div>
    </div>
  )
}
