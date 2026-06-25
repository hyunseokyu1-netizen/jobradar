import { redirect } from 'next/navigation'
import { getAuthUserEmail, getOrCreateProfile } from '@/lib/auth-helpers'
import OnboardingChat from './OnboardingChat'
import { answersFromOnboardingKo } from './questions'

export const dynamic = 'force-dynamic'

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ redo?: string }>
}) {
  const { redo } = await searchParams
  const email = await getAuthUserEmail()
  if (!email) redirect('/login')

  const profile = await getOrCreateProfile(email)
  // 이미 완료한 유저는 기본적으로 프로필로 보내되, 프로필에서 "다시 작성"으로 들어온 경우(redo)는 허용
  if (profile?.onboarding_completed && !redo) redirect('/profile')

  // 다시 작성: 저장된 한국어 프로필을 채팅 답변으로 역변환해 미리 채운다
  const initialAnswers =
    redo && profile?.onboarding_completed
      ? answersFromOnboardingKo(profile.onboarding_ko)
      : undefined

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-5">
        <h1 className="text-2xl font-bold">{redo ? '프로필 다시 작성' : '프로필 작성'}</h1>
        <p className="text-sm text-zinc-400 mt-0.5">
          채팅으로 답하면 영어 프로필로 정리해 드려요. 한국어로 편하게 답해주세요.
        </p>
      </div>
      <OnboardingChat initialAnswers={initialAnswers} />
    </div>
  )
}
