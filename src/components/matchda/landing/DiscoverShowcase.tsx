/**
 * 랜딩 데모 쇼케이스 2 — 잡 탐색(공고 자동 수집·AI 채점) 목업.
 * 실제 /discover UI(추천 기업 칩 + 점수 배지 공고 리스트)를 정적 데모로 재현.
 */

const PRESETS = ['Apple', 'Spotify', 'Stripe', 'Anthropic', 'Figma', 'Reddit']

const DEMO_JOBS = [
  {
    score: 82,
    title: 'Product Manager, AI Growth',
    meta: 'Figma · San Francisco, CA · United States',
    reason: 'AI 성장 제품 매니저는 제품 전략·AI 경험·데이터 기반 우선순위 결정과 완벽 일치',
  },
  {
    score: 80,
    title: 'Manager, Software Engineering - AI Product',
    meta: 'Figma · London, England',
    reason: 'AI 제품 소프트웨어 엔지니어링 매니저는 AI 경험·엔지니어링·제품 리더십이 부합',
  },
  {
    score: 74,
    title: 'Senior Backend Engineer, Payments',
    meta: 'Stripe · Remote · United States',
    reason: '결제 시스템 백엔드 경력이 핵심 요구사항과 일치, 원격 근무 가능',
  },
]

function ScoreBadge({ score }: { score: number }) {
  return (
    <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">
      {score}점
    </span>
  )
}

export default function DiscoverShowcase() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-[1200px] px-4 py-16 sm:px-8 sm:py-[88px]">
        {/* 섹션 헤딩 */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#CEEBDC] bg-[#ECFDF3] px-[13px] py-[6px] text-[13px] font-semibold text-[#046C4E]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.4" /></svg>
            잡 탐색
          </div>
          <h2 className="mt-4 text-[30px] font-bold leading-[1.2] tracking-[-0.03em] text-[#0B1A12] sm:text-[38px]">
            공고는 AI가 모아오고, 점수까지 매겨줍니다
          </h2>
          <p className="mx-auto mt-3 max-w-[520px] text-[15px] leading-[1.6] text-[#4B5563]">
            관심 기업 채용페이지를 등록하면 새 공고를 자동 수집하고,
            내 이력서와의 적합도를 0~100점으로 채점해 정렬해줍니다.
          </p>
        </div>

        {/* 목업 */}
        <div className="mx-auto max-w-[880px] overflow-hidden rounded-[20px] border border-[#E6EEEA] bg-white shadow-[0_24px_60px_-28px_rgba(4,108,78,0.28)]">
          <div className="border-b border-[#F0F2F4] bg-white px-5 py-4 sm:px-7">
            <div className="text-[13px] font-semibold text-[#1F2A37]">추천 기업 바로 수집</div>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {PRESETS.map(name => (
                <span
                  key={name}
                  className="inline-flex items-center rounded-full border border-[#ECEEF0] bg-white px-3.5 py-1.5 text-[13px] font-medium text-[#344054]"
                >
                  + {name}
                </span>
              ))}
              <span className="inline-flex items-center rounded-full border border-[#CEEBDC] bg-[#ECFDF3] px-3.5 py-1.5 text-[13px] font-medium text-[#046C4E]">
                Figma · ✓ 171건 발견
              </span>
            </div>
          </div>

          <div className="space-y-2.5 bg-[#F7F8FA] p-4 sm:p-6">
            {DEMO_JOBS.map(job => (
              <div key={job.title} className="rounded-xl border border-[#ECEEF0] bg-white px-5 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <ScoreBadge score={job.score} />
                      <span className="truncate text-sm font-semibold text-[#1F2A37]">{job.title}</span>
                    </div>
                    <p className="mt-1 text-xs text-[#98A2B3]">{job.meta}</p>
                    <p className="mt-1.5 text-xs text-[#667085]">{job.reason}</p>
                  </div>
                  <span className="shrink-0 whitespace-nowrap rounded-lg bg-[#046C4E] px-3 py-1.5 text-xs text-white">
                    + 지원 관리에 추가
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
