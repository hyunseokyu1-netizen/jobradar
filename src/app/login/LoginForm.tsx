'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import PasswordInput from '@/components/ui/PasswordInput'

type Mode = 'login' | 'signup'

export default function LoginForm() {
  // 공개 랜딩의 "무료로 시작하기"/검색 CTA가 ?mode=signup 으로 진입 → 회원가입 탭 자동 선택
  const searchParams = useSearchParams()
  const initialMode: Mode = searchParams.get('mode') === 'signup' ? 'signup' : 'login'
  const [mode, setMode] = useState<Mode>(initialMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const router = useRouter()
  const supabase = createSupabaseBrowserClient()

  async function handleGoogleLogin() {
    setGoogleLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) {
      setError(error.message)
      setGoogleLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    if (mode === 'login') {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        const messageMap: Record<string, string> = {
          'Invalid login credentials': '이메일 또는 비밀번호가 올바르지 않습니다.',
          'Email not confirmed': '이메일 인증이 필요합니다. 받은편지함을 확인해주세요.',
        }
        setError(messageMap[error.message] ?? error.message)
      } else if (!data.session) {
        setError('이메일 인증이 필요합니다. 받은편지함(스팸함 포함)에서 인증 메일을 확인해주세요.')
      } else {
        // 온보딩 미완료 유저는 이력서 작성부터 (완료 유저는 잡 탐색으로)
        const { postLoginPath } = await import('@/app/auth-actions')
        router.push(await postLoginPath())
        router.refresh()
      }
    } else {
      // 1차: 서버에서 기가입 여부 확인 (Supabase signUp은 기가입이어도 성공처럼 응답하므로)
      const { emailExists } = await import('@/app/auth-actions')
      if (await emailExists(email)) {
        setError('이미 가입된 이메일입니다. 로그인하거나 비밀번호 찾기를 이용해주세요.')
        setLoading(false)
        return
      }

      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) {
        setError(
          error.message.includes('already registered')
            ? '이미 가입된 이메일입니다. 로그인하거나 비밀번호 찾기를 이용해주세요.'
            : error.message
        )
      } else if (data.user && (data.user.identities?.length ?? 0) === 0) {
        // 2차 방어: 기가입 이메일이면 Supabase가 identities를 비워 보낸다
        setError('이미 가입된 이메일입니다. 로그인하거나 비밀번호 찾기를 이용해주세요.')
      } else {
        setMessage('확인 메일을 보냈어요. 메일함(스팸함 포함)에서 인증을 완료해주세요.')
      }
    }

    setLoading(false)
  }

  return (
    <div className="bg-white rounded-2xl border border-[#ECEEF0] p-8 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
      <div className="flex gap-1 mb-6 bg-[#EEF1F3] rounded-[9px] p-[3px]">
        <button
          onClick={() => { setMode('login'); setError(''); setMessage('') }}
          className={`flex-1 text-[13px] py-1.5 rounded-[7px] transition-colors font-semibold ${
            mode === 'login'
              ? 'bg-white text-[#1F2A37] shadow-[0_1px_2px_rgba(16,24,40,0.06)]'
              : 'text-[#667085] hover:text-[#344054]'
          }`}
        >
          로그인
        </button>
        <button
          onClick={() => { setMode('signup'); setError(''); setMessage('') }}
          className={`flex-1 text-[13px] py-1.5 rounded-[7px] transition-colors font-semibold ${
            mode === 'signup'
              ? 'bg-white text-[#1F2A37] shadow-[0_1px_2px_rgba(16,24,40,0.06)]'
              : 'text-[#667085] hover:text-[#344054]'
          }`}
        >
          회원가입
        </button>
      </div>

      {/* Google 로그인 */}
      <button
        onClick={handleGoogleLogin}
        disabled={googleLoading || loading}
        className="w-full flex items-center justify-center gap-2.5 border border-[#E2E6EA] rounded-[9px] py-2.5 text-sm font-medium text-[#344054] hover:bg-[#F4F6F8] disabled:opacity-50 transition-colors mb-5"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        {googleLoading ? '리다이렉트 중...' : 'Google로 계속하기'}
      </button>

      <div className="flex items-center gap-3 mb-5">
        <hr className="flex-1 border-[#ECEEF0]" />
        <span className="text-xs text-[#98A2B3]">또는 이메일로</span>
        <hr className="flex-1 border-[#ECEEF0]" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[#344054] mb-1.5">이메일</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            placeholder="you@example.com"
            className="w-full border border-[#E2E6EA] rounded-[9px] px-3 py-2.5 text-sm outline-none focus:border-[#046C4E] transition-colors"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#344054] mb-1.5">비밀번호</label>
          <PasswordInput
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            placeholder={mode === 'signup' ? '8자 이상' : '••••••••'}
            minLength={mode === 'signup' ? 8 : undefined}
            className="w-full border border-[#E2E6EA] rounded-[9px] px-3 py-2.5 text-sm outline-none focus:border-[#046C4E] transition-colors"
          />
          {mode === 'login' && (
            <div className="mt-1.5 text-right">
              <Link href="/forgot-password" className="text-xs text-[#98A2B3] hover:text-[#046C4E] hover:underline">
                비밀번호를 잊으셨나요?
              </Link>
            </div>
          )}
        </div>

        {error && (
          <div className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">
            {error}
            {error.includes('이미 가입된') && (
              <span className="mt-1 flex gap-3">
                <button
                  type="button"
                  onClick={() => { setMode('login'); setError(''); setMessage('') }}
                  className="font-semibold text-[#046C4E] hover:underline"
                >
                  로그인하기
                </button>
                <Link href="/forgot-password" className="font-semibold text-[#046C4E] hover:underline">
                  비밀번호 찾기
                </Link>
              </span>
            )}
          </div>
        )}
        {message && (
          <p className="text-xs text-green-600 bg-green-50 rounded-lg px-3 py-2">{message}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#046C4E] text-white py-2.5 rounded-[9px] text-sm font-semibold hover:bg-[#035A40] disabled:opacity-50 transition-colors"
        >
          {loading ? '처리 중...' : mode === 'login' ? '로그인' : '회원가입'}
        </button>

        {mode === 'signup' && (
          <p className="text-center text-xs text-[#046C4E]">
            가입하면 맞춤 이력서 2개를 무료로 만들어볼 수 있어요 · 카드 등록 불필요
          </p>
        )}
      </form>
    </div>
  )
}
