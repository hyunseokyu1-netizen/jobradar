import Link from 'next/link'

/**
 * 랜딩 제품 데모 쇼케이스 — 워크스페이스(이력서 번역·맞춤화) 목업 재현.
 * 방문자가 첫 화면에서 "한국어 이력서 → 공고 맞춤 영어 이력서" 가치를 바로 체감하게 한다.
 * (디자인 핸드오프 MatchDa.dc.html의 isWorkspace 화면 기반, 정적 데모 데이터)
 */

function Hl({ children }: { children: React.ReactNode }) {
  // 최적화된 문구 하이라이트 (핸드오프 토큰: #DCF5E8 + 브랜드 밑줄)
  return (
    <span className="rounded-[3px] bg-[#DCF5E8] px-[3px] [box-shadow:inset_0_-2px_0_rgba(4,108,78,0.45)]">
      {children}
    </span>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-3 mt-6 border-b border-[#EEF0F2] pb-[6px] text-[10px] font-semibold uppercase tracking-[0.09em] text-[#9AA3AD]">
      {children}
    </div>
  )
}

function SkillChip({ accent, children }: { accent?: boolean; children: React.ReactNode }) {
  return (
    <span
      className={`rounded-[7px] border px-[9px] py-[4px] text-[11.5px] ${
        accent
          ? 'border-[#CEEBDC] bg-[#ECFDF3] text-[#046C4E]'
          : 'border-[#ECEEF0] bg-[#F4F6F8] text-[#475467]'
      }`}
    >
      {children}
    </span>
  )
}

const SKILLS = ['Java', 'Spring', 'Kotlin', 'MySQL', 'Kafka', 'AWS']

export default function WorkspaceShowcase({
  ctaHref = '/login?mode=signup',
}: {
  ctaHref?: string
}) {
  return (
    <section className="border-y border-[#EEF1F0] bg-[#F4F6F8]">
      <div className="mx-auto max-w-[1200px] px-4 py-16 sm:px-8 sm:py-[88px]">
        {/* 섹션 헤딩 */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#CEEBDC] bg-[#ECFDF3] px-[13px] py-[6px] text-[13px] font-semibold text-[#046C4E]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.6 4.6L18 9l-4.4 1.4L12 15l-1.6-4.6L6 9l4.4-1.4z" /></svg>
            화면 미리보기 · 예시 데이터
          </div>
          <h2 className="mt-4 text-[30px] font-bold leading-[1.2] tracking-[-0.03em] text-[#0B1A12] sm:text-[38px]">
            한국어로 쓰면,<br className="sm:hidden" /> 공고에 맞춘 영어 이력서가 됩니다
          </h2>
          <p className="mx-auto mt-3 max-w-[520px] text-[15px] leading-[1.6] text-[#4B5563]">
            원본은 그대로, 오른쪽에는 지원할 공고의 요구사항에 맞춰 AI가 번역하고
            강조점을 조정한 영어 이력서가 실시간으로 만들어집니다.
          </p>
        </div>

        {/* 워크스페이스 목업 */}
        <div className="overflow-hidden rounded-[20px] border border-[#E6EEEA] bg-white shadow-[0_24px_60px_-28px_rgba(4,108,78,0.28)]">
          {/* 최적화 배너 */}
          <div className="flex flex-col gap-2 border-b border-[#CEEBDC] bg-[#ECFDF3] px-5 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-7">
            <div className="flex items-center gap-2.5 text-[13px] font-medium text-[#046C4E]">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.4" /></svg>
              <span>이 이력서는 <b className="font-bold">Spotify 백엔드 엔지니어</b> 공고에 맞춰 최적화되었습니다 · 최적화 항목 5개</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-medium text-[#046C4E]">직무 매칭률</span>
              <span className="rounded-[7px] bg-[#046C4E] px-[11px] py-[3px] text-[14px] font-bold text-white">82%</span>
            </div>
          </div>

          {/* 좌: 원본 / 우: AI 번역 */}
          <div className="grid grid-cols-1 gap-5 bg-[#F4F6F8] p-4 sm:p-6 lg:grid-cols-2">
            {/* 원본 (한국어) */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2 rounded-lg border border-[#E2E6EA] bg-white px-3 py-[6px]">
                  <span className="h-[7px] w-[7px] rounded-full bg-[#98A2B3]" />
                  <span className="text-[13px] font-semibold text-[#475467]">원본 (한국어)</span>
                </div>
                <span className="text-[12px] text-[#98A2B3]">수정 없음 · 312 단어</span>
              </div>
              <div className="rounded-[14px] border border-[#ECEEF0] bg-white p-6 shadow-[0_2px_14px_rgba(16,24,40,0.04)] sm:p-8">
                <div className="text-[20px] font-bold tracking-[-0.01em] text-[#101828]">김지민</div>
                <div className="mt-[3px] text-[14px] font-semibold text-[#046C4E]">시니어 백엔드 엔지니어</div>
                <div className="mt-[6px] font-mono text-[12px] text-[#98A2B3]">서울, 대한민국 · jimin.kim@email.com</div>

                <SectionLabel>경력</SectionLabel>
                <div className="flex items-baseline justify-between">
                  <div className="text-[14px] font-semibold text-[#1F2A37]">네이버 — 백엔드 엔지니어</div>
                  <div className="text-[11px] text-[#98A2B3]">2021.03 – 현재</div>
                </div>
                <ul className="mt-2 list-disc space-y-1 pl-[18px] text-[13px] leading-[1.7] text-[#475467]">
                  <li>대규모 트래픽 결제 시스템 설계 및 운영 (일 500만 건 처리)</li>
                  <li>응답 지연 40% 개선 및 마이크로서비스 전환 주도</li>
                  <li>신규 결제 모듈 출시로 매출 12% 증대</li>
                </ul>

                <SectionLabel>기술</SectionLabel>
                <div className="flex flex-wrap gap-2">
                  {SKILLS.map(s => <SkillChip key={s}>{s}</SkillChip>)}
                </div>
              </div>
            </div>

            {/* AI 번역 · 맞춤화 (영어) */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2 rounded-lg border border-[#CEEBDC] bg-[#ECFDF3] px-3 py-[6px]">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#046C4E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.6 4.6L18 9l-4.4 1.4L12 15l-1.6-4.6L6 9l4.4-1.4z" /></svg>
                  <span className="text-[13px] font-semibold text-[#046C4E]">AI 번역 · 맞춤화 (영어)</span>
                </div>
                <span className="text-[12px] text-[#98A2B3]">방금 업데이트됨 · 298 words</span>
              </div>
              <div className="rounded-[14px] border border-[#ECEEF0] bg-white p-6 shadow-[0_2px_14px_rgba(16,24,40,0.04)] sm:p-8">
                <div className="text-[20px] font-bold tracking-[-0.01em] text-[#101828]">Jimin Kim</div>
                <div className="mt-[3px] text-[14px] font-semibold text-[#046C4E]">Senior Backend Engineer</div>
                <div className="mt-[6px] font-mono text-[12px] text-[#98A2B3]">Seoul, South Korea · jimin.kim@email.com</div>

                <SectionLabel>Experience</SectionLabel>
                <div className="flex items-baseline justify-between">
                  <div className="text-[14px] font-semibold text-[#1F2A37]">NAVER — Backend Engineer</div>
                  <div className="text-[11px] text-[#98A2B3]">Mar 2021 – Present</div>
                </div>
                <ul className="mt-2 list-disc space-y-1 pl-[18px] text-[13px] leading-[1.7] text-[#475467]">
                  <li>Designed and operated a <Hl>high-throughput, distributed payments system</Hl> handling 5M daily transactions</li>
                  <li>Reduced response latency by 40% and led the migration to a <Hl>microservices architecture</Hl></li>
                  <li>Launched a new payment module that drove a 12% revenue increase</li>
                </ul>

                {/* AI 조정 사유 노트 */}
                <div className="mt-4 flex gap-2.5 rounded-[10px] border border-[#D9EEE4] bg-[#F6FBF8] px-[14px] py-3">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#046C4E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="mt-[1px] shrink-0"><path d="M12 3l1.6 4.6L18 9l-4.4 1.4L12 15l-1.6-4.6L6 9l4.4-1.4z" /></svg>
                  <div className="text-[12px] leading-[1.55] text-[#3F5249]">
                    Spotify 공고의 <b className="text-[#046C4E]">&lsquo;distributed systems&rsquo;</b> 요구사항에 맞춰 &lsquo;대규모 트래픽 결제 시스템&rsquo; 경험을 강조하도록 표현을 조정했습니다.
                  </div>
                </div>

                <SectionLabel>Skills</SectionLabel>
                <div className="flex flex-wrap gap-2">
                  {SKILLS.map(s => <SkillChip key={s} accent>{s}</SkillChip>)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-9 text-center">
          <Link
            href={ctaHref}
            className="inline-flex items-center gap-2 rounded-[10px] bg-[#046C4E] px-7 py-[13px] text-[15px] font-semibold text-white shadow-[0_1px_2px_rgba(4,108,78,0.25)] transition-colors hover:bg-[#035A40]"
          >
            내 이력서로 직접 해보기
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></svg>
          </Link>
          <p className="mt-3 text-[13px] text-[#98A2B3]">가입 후 이력서 파일만 올리면 1분 안에 확인할 수 있어요.</p>
        </div>
      </div>
    </section>
  )
}
