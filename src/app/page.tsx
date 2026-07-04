import { getAuthUserEmail } from '@/lib/auth-helpers'
import MatchdaLanding from '@/components/matchda/landing/MatchdaLanding'

export const dynamic = 'force-dynamic'

/**
 * 공개 랜딩(설명) 페이지. 로그인 여부와 무관하게 항상 랜딩을 보여준다.
 * 로그인 상태면 헤더의 "로그인" 버튼을 숨기고 CTA를 대시보드로 연결한다.
 * 실제 대시보드는 /dashboard 에서 렌더한다.
 */
export default async function HomePage() {
  const authed = !!(await getAuthUserEmail())

  return (
    <MatchdaLanding
      authed={authed}
      loginHref="/login"
      signupHref={authed ? '/dashboard' : '/login?mode=signup'}
      searchHref={authed ? '/discover' : '/login?mode=signup'}
    />
  )
}
