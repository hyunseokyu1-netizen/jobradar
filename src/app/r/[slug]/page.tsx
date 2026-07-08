import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { toStudioResume, studioToDoc } from '@/lib/resume'
import ResumeDocument from '@/components/matchda/workspace/ResumeDocument'
import { normalizeResumeDesign } from '@/lib/matchda/resume-design'

export const dynamic = 'force-dynamic'

const EN_LABELS = { summary: 'Summary', experience: 'Experience', skills: 'Skills', education: 'Education' }

// 슬러그로 공개된 이력서 프로필을 조회 (공개 활성화된 것만)
async function getPublicProfile(slug: string) {
  const { data } = await supabaseAdmin
    .from('profiles')
    .select('onboarding_en, public_resume_enabled')
    .eq('public_slug', slug)
    .eq('public_resume_enabled', true)
    .maybeSingle()
  return data
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const profile = await getPublicProfile(slug)
  if (!profile) return { title: '이력서를 찾을 수 없습니다 — MatchDa' }

  // 연락처는 공개에서 제외(개인정보) — 이름/타이틀만 미리보기에 사용
  const resume = toStudioResume(profile.onboarding_en)
  const name = resume.name || '이력서'
  const title = resume.title || resume.experience.find(e => !e.hidden)?.position || ''
  const desc = title ? `${name} · ${title} — MatchDa로 만든 영문 이력서` : `${name} — MatchDa로 만든 영문 이력서`

  return {
    title: `${name}${title ? ` · ${title}` : ''} — MatchDa`,
    description: desc,
    openGraph: { title: `${name}${title ? ` · ${title}` : ''}`, description: desc, type: 'profile' },
    twitter: { card: 'summary', title: `${name}${title ? ` · ${title}` : ''}`, description: desc },
    robots: { index: false },  // 검색엔진 색인 제외(개인 이력서)
  }
}

export default async function PublicResumePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const profile = await getPublicProfile(slug)
  if (!profile) notFound()

  const resume = toStudioResume(profile.onboarding_en)

  // 공개 이력서에는 이메일·전화번호를 넣지 않는다 — 개인정보 최소화
  // (포트폴리오·GitHub 링크는 공개를 전제로 한 정보이므로 유지)
  const doc = studioToDoc({ ...resume, phone: '' }, '')

  // 스튜디오 디자인(폰트·색상·템플릿) 반영 (없으면 기본값)
  const resumeDesign = resume.design ? normalizeResumeDesign(resume.design) : undefined

  return (
    <div className="min-h-screen bg-[#F4F6F8] py-8 px-4 sm:py-14">
      <div className="mx-auto max-w-3xl">
        <ResumeDocument doc={doc} labels={EN_LABELS} variant="original" design={resumeDesign} />

        {/* 워터마크 + CTA (바이럴 루프) */}
        <div className="mt-6 flex flex-col items-center gap-3 text-center">
          <p className="text-[13px] text-[#98A2B3]">
            이 이력서는 <span className="font-semibold text-[#475467]">MatchDa</span>로 제작되었습니다.
          </p>
          <Link
            href="/"
            className="rounded-[10px] bg-[#046C4E] px-5 py-2.5 text-[14px] font-semibold text-white transition hover:bg-[#035C42]"
          >
            나도 영문 이력서 무료로 만들기
          </Link>
          <p className="max-w-md text-[12px] leading-[1.6] text-[#B0B7BF]">
            한국어로 쓰면 전문가 수준 영어 이력서로 바꿔주고, 채용 공고에 맞춰 자동 최적화해 드려요.
          </p>
        </div>
      </div>
    </div>
  )
}
