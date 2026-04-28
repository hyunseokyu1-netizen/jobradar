'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'

type Mode = 'login' | 'signup'

export default function LoginForm() {
  const [mode, setMode] = useState<Mode>('login')
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
      console.log('[Login] signInWithPassword 시도:', email)
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      console.log('[Login] 결과 - error:', error, '| session:', data.session ? '있음' : '없음', '| user:', data.user?.email)
      if (error) {
        setError(error.message === 'Invalid login credentials'
          ? '이메일 또는 비밀번호가 올바르지 않습니다.'
          : error.message)
      } else if (!data.session) {
        setError('이메일 인증이 필요합니다. 받은편지함을 확인하거나 Supabase에서 이메일 인증을 비활성화해주세요.')
      } else {
        console.log('[Login] 성공 → / 로 이동')
        router.push('/')
        router.refresh()
      }
    } else {
      console.log('[Signup] signUp 시도:', email)
      const { data, error } = await supabase.auth.signUp({ email, password })
      console.log('[Signup] 결과 - error:', error, '| user:', data.user?.email, '| confirmed:', data.user?.email_confirmed_at)
      if (error) {
        setError(error.message)
      } else {
        setMessage('가입이 완료됐습니다. 로그인해주세요.')
      }
    }

    setLoading(false)
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-8">
      <div className="flex gap-1 mb-6 bg-zinc-100 rounded-lg p-1">
        <button
          onClick={() => { setMode('login'); setError(''); setMessage('') }}
          className={`flex-1 text-sm py-1.5 rounded-md transition-colors font-medium ${
            mode === 'login' ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-500 hover:text-zinc-700'
          }`}
        >
          로그인
        </button>
        <button
          onClick={() => { setMode('signup'); setError(''); setMessage('') }}
          className={`flex-1 text-sm py-1.5 rounded-md transition-colors font-medium ${
            mode === 'signup' ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-500 hover:text-zinc-700'
          }`}
        >
          회원가입
        </button>
      </div>

      {/* Google 로그인 */}
      <button
        onClick={handleGoogleLogin}
        disabled={googleLoading || loading}
        className="w-full flex items-center justify-center gap-2.5 border border-zinc-200 rounded-lg py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 transition-colors mb-5"
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
        <hr className="flex-1 border-zinc-200" />
        <span className="text-xs text-zinc-400">또는 이메일로</span>
        <hr className="flex-1 border-zinc-200" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1.5">이메일</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            placeholder="you@example.com"
            className="w-full border border-zinc-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-zinc-400 transition-colors"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1.5">비밀번호</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            placeholder={mode === 'signup' ? '8자 이상' : '••••••••'}
            minLength={mode === 'signup' ? 8 : undefined}
            className="w-full border border-zinc-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-zinc-400 transition-colors"
          />
        </div>

        {error && (
          <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>
        )}
        {message && (
          <p className="text-xs text-green-600 bg-green-50 rounded-lg px-3 py-2">{message}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-zinc-900 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-zinc-700 disabled:opacity-50 transition-colors"
        >
          {loading ? '처리 중...' : mode === 'login' ? '로그인' : '회원가입'}
        </button>
      </form>
    </div>
  )
}
