import { Suspense } from 'react'
import LoginForm from './LoginForm'

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-zinc-900">MatchDa</h1>
          <p className="text-sm text-zinc-500 mt-1">AI 기반 잡 매칭 & 커버레터 자동화</p>
        </div>
        {/* useSearchParams(?mode=signup) 사용 → Suspense 경계 필요 */}
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  )
}
