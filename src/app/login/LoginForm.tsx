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
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const router = useRouter()
  const supabase = createSupabaseBrowserClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError(error.message === 'Invalid login credentials'
          ? '이메일 또는 비밀번호가 올바르지 않습니다.'
          : error.message)
      } else {
        router.push('/')
        router.refresh()
      }
    } else {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) {
        setError(error.message)
      } else {
        setMessage('인증 이메일을 발송했습니다. 이메일을 확인해주세요.')
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
