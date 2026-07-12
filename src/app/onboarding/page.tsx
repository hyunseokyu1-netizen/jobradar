import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getAuthUserEmail, getOrCreateProfile } from '@/lib/auth-helpers'
import { Logo } from '@/components/matchda/ui/primitives'
import OnboardingChat from './OnboardingChat'
import ResumeUploadOption from './ResumeUploadOption'
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
  if (profile?.onboarding_completed && !redo) redirect('/discover')

  // 다시 작성: 저장된 한국어 프로필을 채팅 답변으로 역변환해 미리 채운다
  const initialAnswers =
    redo && profile?.onboarding_completed
      ? answersFromOnboardingKo(profile.onboarding_ko)
      : undefined

  return (
    <div className="min-h-screen bg-[#F7F8FA]">
      <header className="border-b border-[#ECEEF0] bg-white">
        <div className="mx-auto flex h-[60px] max-w-2xl items-center justify-between px-4">
          <Logo href="/" />
          <Link
            href="/discover"
            className="text-[13px] text-[#98A2B3] transition-colors hover:text-[#667085]"
          >
            나중에 하기 →
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-5">
          <h1 className="text-2xl font-bold tracking-[-0.02em] text-[#101828]">
            {redo ? '프로필 다시 작성' : '프로필 작성'}
          </h1>
          <p className="text-sm text-[#667085] mt-0.5">
            채팅으로 답하면 영어 프로필로 정리해 드려요. 한국어로 편하게 답해주세요.
          </p>
        </div>
        {!redo && <ResumeUploadOption />}
        <OnboardingChat initialAnswers={initialAnswers} />
      </div>
    </div>
  )
}
