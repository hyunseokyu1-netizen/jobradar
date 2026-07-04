import { getAuthUserEmail } from '@/lib/auth-helpers'
import { getMatchdaDict } from '@/lib/matchda/i18n'
import LandingHeader from './LandingHeader'
import SiteFooter from './SiteFooter'

/** 약관·정책·고객센터 등 정적 공개 페이지 공용 셸 (랜딩 크롬) */
export default async function StaticPageShell({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  const authed = !!(await getAuthUserEmail())
  const t = getMatchdaDict('ko')

  return (
    <div className="min-h-screen bg-white font-[family-name:var(--font-plex-kr)] text-[#111827] antialiased">
      <LandingHeader t={t} authed={authed} />
      <main className="mx-auto max-w-[760px] px-4 pb-24 pt-14 sm:px-8">
        <h1 className="text-[30px] font-bold tracking-[-0.03em] text-[#0B1A12]">{title}</h1>
        {subtitle && <p className="mt-2 text-[14px] text-[#98A2B3]">{subtitle}</p>}
        <div className="mt-10">{children}</div>
      </main>
      <SiteFooter t={t} />
    </div>
  )
}

/** 정책 문서용 섹션 (번호 제목 + 본문) */
export function PolicySection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="mb-3 text-[17px] font-bold text-[#1F2A37]">{title}</h2>
      <div className="space-y-2 text-[14px] leading-[1.75] text-[#475467]">{children}</div>
    </section>
  )
}
