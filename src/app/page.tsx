import { getAuthUserEmail, getOrCreateProfile } from '@/lib/auth-helpers'
import { getPublicTestimonials } from '@/lib/matchda/data'
import MatchdaLanding from '@/components/matchda/landing/MatchdaLanding'

export const dynamic = 'force-dynamic'

/**
 * 공개 랜딩(설명) 페이지. 로그인 여부와 무관하게 항상 랜딩을 보여준다.
 * 로그인 상태면 헤더에 유저 아바타 + 대시보드 버튼을 표시한다.
 */
export default async function HomePage() {
  const [email, testimonials] = await Promise.all([
    getAuthUserEmail(),
    getPublicTestimonials(),
  ])
  const profile = email ? await getOrCreateProfile(email) : null
  const authed = !!email

  return (
    <MatchdaLanding
      authed={authed}
      loginHref="/login"
      signupHref="/login?mode=signup"
      searchHref={authed ? '/discover' : '/login?mode=signup'}
      userName={profile?.name || null}
      userEmail={email}
      testimonials={testimonials}
    />
  )
}
