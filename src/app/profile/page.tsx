import Link from 'next/link'
import ProfileForm from './ProfileForm'
import ResumeEditor from './ResumeEditor'
import { getAuthUserEmail, getOrCreateProfile } from '@/lib/auth-helpers'
import { redirect } from 'next/navigation'
import AppShell from '@/components/matchda/AppShell'

export default async function ProfilePage() {
  const email = await getAuthUserEmail()
  if (!email) redirect('/login')

  const profile = await getOrCreateProfile(email)

  // 한/영 구조화 프로필에서 이력서 에디터 초기값 구성
  const ko = (profile?.onboarding_ko ?? {}) as Record<string, unknown>
  const en = (profile?.onboarding_en ?? {}) as Record<string, unknown>
  const asArr = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : [])

  return (
    <AppShell activeKey="profile" userName={(profile?.name as string) ?? undefined} userEmail={email}>
      <div className="max-w-2xl">
      <div className="flex items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold">내 프로파일</h1>
        <Link
          href="/onboarding?redo=1"
          className="text-sm font-medium bg-[#046C4E] text-white px-4 py-2 rounded-lg hover:bg-[#035A40] transition-colors whitespace-nowrap"
        >
          ✨ AI로 다시 작성
        </Link>
      </div>

      <section className="mb-8">
        <h2 className="text-base font-semibold mb-1">이력서 (한글 작성 → 번역)</h2>
        <p className="text-xs text-[#98A2B3] mb-3">
          섹션별로 한국어로 작성하고 ‘번역해서 저장’을 누르면 영어로 저장돼 매칭·커버레터에 사용됩니다.
        </p>
        <ResumeEditor
          email={email}
          name={(profile?.name as string) ?? ''}
          phone={(profile?.phone as string) ?? ''}
          summaryKo={(ko.summary as string) ?? ''}
          summaryEn={(en.summary as string) ?? (profile?.career_summary as string) ?? ''}
          skillsKo={asArr<string>(ko.skills)}
          skillsEn={asArr<string>(en.skills).length ? asArr<string>(en.skills) : asArr<string>(profile?.skills)}
          experienceKo={asArr(ko.experience)}
          experienceEn={asArr(en.experience)}
          educationKo={asArr(ko.education)}
          educationEn={asArr(en.education)}
        />
      </section>

      <ProfileForm initialData={profile} />
      </div>
    </AppShell>
  )
}
