import { getAuthUserEmail } from '@/lib/auth-helpers'
import MatchdaLanding from '@/components/matchda/landing/MatchdaLanding'

export const dynamic = 'force-dynamic'

/**
 * 공개 랜딩(설명) 페이지. 로그인 여부와 무관하게 항상 랜딩을 보여준다.
 * 헤더는 항상 방문자 관점(로그인·가입 버튼) — 로그인 유저가 눌러도 미들웨어가 앱으로 보낸다.
 */
export default async function HomePage() {
  const authed = !!(await getAuthUserEmail())

  return (
    <MatchdaLanding
      authed={authed}
      loginHref="/login"
      signupHref="/login?mode=signup"
      searchHref={authed ? '/discover' : '/login?mode=signup'}
    />
  )
}
