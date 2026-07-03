import Link from 'next/link'
import ProfileForm from './ProfileForm'
import ResumeStudio from './ResumeStudio'
import type { StudioResume, StudioExp, StudioEdu, StudioDesign } from './actions'
import { getAuthUserEmail, getOrCreateProfile } from '@/lib/auth-helpers'
import { redirect } from 'next/navigation'
import AppShell from '@/components/matchda/AppShell'

// onboarding_ko/en(JSONB)을 스튜디오 초기값으로 정규화
function toStudio(raw: unknown, fallbackName = '', fallbackPhone = ''): StudioResume {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  const s = (v: unknown) => (typeof v === 'string' ? v : '')
  const arr = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : [])
  return {
    name: s(r.name) || fallbackName,
    phone: s(r.phone) || fallbackPhone,
    title: s(r.title),
    summary: s(r.summary),
    skills: arr<string>(r.skills).filter(v => typeof v === 'string'),
    hidden_skills: arr<string>(r.hidden_skills).filter(v => typeof v === 'string'),
    experience: arr<StudioExp>(r.experience).map(e => ({
      company: s(e?.company), position: s(e?.position), period: s(e?.period),
      description: s(e?.description), hidden: !!e?.hidden,
    })),
    education: arr<StudioEdu>(r.education).map(e => ({
      school: s(e?.school), major: s(e?.major), degree: s(e?.degree), period: s(e?.period),
      hidden: !!e?.hidden,
    })),
    design: (r.design as StudioDesign | undefined) ?? undefined,
  }
}

function hasContent(r: StudioResume): boolean {
  return !!(r.summary || r.skills.length || r.experience.length || r.education.length)
}

export default async function ProfilePage() {
  const email = await getAuthUserEmail()
  if (!email) redirect('/login')

  const profile = await getOrCreateProfile(email)

  const ko = toStudio(profile?.onboarding_ko, (profile?.name as string) ?? '', (profile?.phone as string) ?? '')
  const en = toStudio(profile?.onboarding_en)

  return (
    <AppShell activeKey="profile" userName={(profile?.name as string) ?? undefined} userEmail={email}>
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">이력서 스튜디오</h1>
          <p className="mt-0.5 text-sm text-[#98A2B3]">
            한국어로 편집하면 실시간으로 미리보고, 영어로 동기화해 매칭·커버레터에 사용합니다.
          </p>
        </div>
        <Link
          href="/onboarding?redo=1"
          className="whitespace-nowrap rounded-lg bg-[#046C4E] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#035A40]"
        >
          ✨ AI로 다시 작성
        </Link>
      </div>

      <ResumeStudio initialKo={ko} initialEn={hasContent(en) ? en : null} email={email} />

      <section className="mt-12 max-w-2xl">
        <h2 className="mb-1 text-base font-semibold">매칭 설정</h2>
        <p className="mb-4 text-xs text-[#98A2B3]">
          희망 포지션·지역·연봉과 이력서 파일은 AI 매칭과 잡 탐색 채점에 사용됩니다.
        </p>
        <ProfileForm initialData={profile} />
      </section>
    </AppShell>
  )
}
