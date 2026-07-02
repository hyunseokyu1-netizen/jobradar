import { Suspense } from 'react'
import { Logo } from '@/components/matchda/ui/primitives'
import LoginForm from './LoginForm'

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-2">
          <Logo href="/" />
          <p className="text-sm text-[#667085]">AI 잡 매칭으로 글로벌 커리어를 시작하세요</p>
        </div>
        {/* useSearchParams(?mode=signup) 사용 → Suspense 경계 필요 */}
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  )
}
