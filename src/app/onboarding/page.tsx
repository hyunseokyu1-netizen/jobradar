import { redirect } from 'next/navigation'
import { getAuthUserEmail, getOrCreateProfile } from '@/lib/auth-helpers'
import OnboardingChat from './OnboardingChat'

export const dynamic = 'force-dynamic'

export default async function OnboardingPage() {
  const email = await getAuthUserEmail()
  if (!email) redirect('/login')

  const profile = await getOrCreateProfile(email)
  if (profile?.onboarding_completed) redirect('/profile')

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-5">
        <h1 className="text-2xl font-bold">프로필 작성</h1>
        <p className="text-sm text-zinc-400 mt-0.5">
          채팅으로 답하면 영어 프로필로 정리해 드려요. 한국어로 편하게 답해주세요.
        </p>
      </div>
      <OnboardingChat />
    </div>
  )
}
