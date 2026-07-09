import Link from 'next/link'
import type { Metadata } from 'next'
import { getAuthUserEmail } from '@/lib/auth-helpers'
import { getMatchdaDict } from '@/lib/matchda/i18n'
import LandingHeader from '@/components/matchda/landing/LandingHeader'
import SiteFooter from '@/components/matchda/landing/SiteFooter'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: '서비스 소개',
  description:
    '해외 취업의 가장 큰 벽인 영어 이력서를 AI가 해결합니다. 이력서 업로드부터 영문 번역, 공고 매칭, 맞춤 이력서·커버레터 생성까지 MatchDa 사용법을 확인하세요.',
}

/** 서비스 소개 — MatchDa가 무엇이고 어떻게 쓰는지 (공개 페이지) */

const STEPS = [
  {
    n: '1',
    title: '이력서 올리기',
    desc: '한국어 이력서 파일(PDF·DOCX)을 올리면 AI가 자동 분석해 기본 정보를 채워줍니다. 직접 입력해도 됩니다.',
  },
  {
    n: '2',
    title: '영어로 번역·다듬기',
    desc: '버튼 한 번으로 전문가 수준의 영문 이력서가 만들어집니다. 원본과 나란히 비교하며 자유롭게 수정하세요.',
  },
  {
    n: '3',
    title: '공고 수집과 AI 매칭',
    desc: '관심 기업 채용페이지를 등록하면 새 공고를 자동 수집하고, 내 이력서와의 적합도를 0~100점으로 채점합니다.',
  },
  {
    n: '4',
    title: '맞춤 이력서로 지원',
    desc: '지원할 공고를 고르면 JD 요구사항에 맞춰 이력서를 재구성하고 커버레터까지 생성합니다. 지원 현황은 칸반 보드로 추적하세요.',
  },
]

const FEATURES = [
  { title: '한국어 → 영어 이력서 번역', desc: '전문 번역가 수준의 AI가 경력의 뉘앙스까지 살려 번역합니다.' },
  { title: '공고 자동 수집·채점', desc: 'Apple·Spotify·Stripe 등 대기업 채용페이지를 원클릭 등록, 새 공고를 AI가 채점해 정렬합니다.' },
  { title: '직무 맞춤형 자동 최적화', desc: '각 채용 공고의 요구사항에 맞춰 이력서를 자동 조정하고 매칭률을 확인하세요.' },
  { title: '커버레터 자동 생성', desc: '공고와 내 경력을 바탕으로 맞춤 커버레터를 생성합니다.' },
  { title: '지원 현황 칸반 추적', desc: '준비 중 → 지원 완료 → 면접 → 오퍼, 전 과정을 한눈에 관리합니다.' },
  { title: 'PDF·DOCX 다운로드', desc: '완성된 이력서를 한/영 각각 서식 그대로 내려받을 수 있습니다.' },
]

export default async function AboutPage() {
  const authed = !!(await getAuthUserEmail())
  const t = getMatchdaDict('ko')
  const ctaHref = authed ? '/dashboard' : '/login?mode=signup'

  return (
    <div className="min-h-screen bg-white font-[family-name:var(--font-plex-kr)] text-[#111827] antialiased">
      <LandingHeader t={t} authed={authed} />

      {/* 인트로 */}
      <section className="mx-auto max-w-[840px] px-4 pb-14 pt-16 text-center sm:px-8 sm:pt-24">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#CEEBDC] bg-[#ECFDF3] px-[13px] py-[6px] text-[13px] font-semibold text-[#046C4E]">
          <span className="h-[7px] w-[7px] rounded-full bg-[#046C4E]" />
          서비스 소개
        </div>
        <h1 className="mt-5 text-[34px] font-bold leading-[1.16] tracking-[-0.035em] text-[#0B1A12] sm:text-[46px]">
          해외 취업의 가장 큰 벽,<br />영어 이력서를 AI가 해결합니다
        </h1>
        <p className="mx-auto mt-5 max-w-[560px] text-[16px] leading-[1.65] text-[#4B5563]">
          MatchDa(매치다)는 해외 취업을 준비하는 한국 전문가를 위한 글로벌 커리어 플랫폼입니다.
          한국어 이력서를 전문가 수준의 영어로 번역하고, 전 세계 채용 공고를 자동으로 수집·채점하고,
          각 공고에 맞춰 이력서를 최적화합니다.
        </p>
      </section>

      {/* 사용 흐름 4단계 */}
      <section className="border-y border-[#EEF1F0] bg-[#F7F8FA]">
        <div className="mx-auto max-w-[1000px] px-4 py-14 sm:px-8 sm:py-20">
          <h2 className="mb-8 text-center text-[24px] font-bold tracking-[-0.02em] text-[#101828]">
            이렇게 사용해요
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {STEPS.map(s => (
              <div key={s.n} className="rounded-[14px] border border-[#ECEEF0] bg-white p-6">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#ECFDF3] text-[15px] font-bold text-[#046C4E]">
                  {s.n}
                </div>
                <div className="mt-3 text-[16px] font-bold text-[#1F2A37]">{s.title}</div>
                <p className="mt-1.5 text-[14px] leading-[1.6] text-[#667085]">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 기능 */}
      <section className="mx-auto max-w-[1000px] px-4 py-14 sm:px-8 sm:py-20">
        <h2 className="mb-8 text-center text-[24px] font-bold tracking-[-0.02em] text-[#101828]">
          주요 기능
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(f => (
            <div key={f.title} className="rounded-[14px] border border-[#ECEEF0] bg-white p-6">
              <div className="text-[15px] font-bold text-[#1F2A37]">{f.title}</div>
              <p className="mt-1.5 text-[13.5px] leading-[1.6] text-[#667085]">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-[1200px] px-4 pb-20 sm:px-8">
        <div className="rounded-[20px] bg-[#046C4E] px-8 py-12 text-center">
          <h2 className="text-[26px] font-bold tracking-[-0.02em] text-white">
            지금 무료로 시작해보세요
          </h2>
          <p className="mt-2 text-[15px] text-[#A7D8C4]">
            가입 후 이력서 파일만 올리면 1분 안에 영어 이력서를 확인할 수 있어요.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href={ctaHref}
              className="rounded-[10px] bg-white px-7 py-[13px] text-[15px] font-semibold text-[#046C4E] transition-colors hover:bg-[#ECFDF3]"
            >
              {authed ? '대시보드로 가기' : '무료로 시작하기'}
            </Link>
            <Link
              href="/pricing"
              className="rounded-[10px] border border-white/30 px-7 py-[13px] text-[15px] font-semibold text-white transition-colors hover:bg-white/10"
            >
              요금제 보기
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter t={t} />
    </div>
  )
}
