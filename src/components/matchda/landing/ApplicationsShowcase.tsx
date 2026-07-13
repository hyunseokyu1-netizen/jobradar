/**
 * 랜딩 데모 쇼케이스 3 — 지원 현황(칸반 추적) 목업.
 * 디자인 핸드오프(MatchDa.dc.html isDashboard)의 칸반 보드를 정적 데모로 재현.
 */

interface DemoCard {
  initial: string
  chipBg: string
  role: string
  company: string
  location: string
  salary: string
  match: number
  note?: { text: string; tone: 'interview' | 'offer' }
  emphasized?: boolean
}

interface DemoColumn {
  label: string
  dot: string
  cards: DemoCard[]
}

const COLUMNS: DemoColumn[] = [
  {
    label: '준비 중',
    dot: '#98A2B3',
    cards: [
      { initial: 'A', chipBg: '#0052CC', role: '백엔드 엔지니어', company: 'Atlassian', location: '시드니, 호주', salary: 'A$130K–160K', match: 82 },
      { initial: 'C', chipBg: '#8B3DFF', role: '데이터 분석가', company: 'Canva', location: '시드니, 호주 · 원격', salary: 'A$110K–135K', match: 75 },
    ],
  },
  {
    label: '지원 완료',
    dot: '#1A56DB',
    cards: [
      { initial: 'X', chipBg: '#13B5EA', role: '프론트엔드 개발자', company: 'Xero', location: '오클랜드, 뉴질랜드', salary: 'NZ$105K–130K', match: 88 },
    ],
  },
  {
    label: '면접 진행',
    dot: '#B45309',
    cards: [
      { initial: 'C', chipBg: '#E14F62', role: '프로덕트 매니저', company: 'Culture Amp', location: '멜번, 호주', salary: 'A$140K–170K', match: 91, note: { text: '2차 면접 · 6월 30일', tone: 'interview' } },
    ],
  },
  {
    label: '오퍼',
    dot: '#046C4E',
    cards: [
      { initial: 'S', chipBg: '#6559FF', role: '풀스택 개발자', company: 'SafetyCulture', location: '시드니, 호주', salary: 'A$125K–150K', match: 79, note: { text: '오퍼 수신 · 검토 중', tone: 'offer' }, emphasized: true },
    ],
  },
]

function Card({ c }: { c: DemoCard }) {
  return (
    <div
      className={`rounded-[12px] border bg-white p-[14px] ${
        c.emphasized
          ? 'border-[#CEEBDC] shadow-[0_1px_2px_rgba(4,108,78,0.06)]'
          : 'border-[#E7EBEE] shadow-[0_1px_2px_rgba(16,24,40,0.04)]'
      }`}
    >
      <div className="mb-[11px] flex items-center gap-[10px]">
        <div
          className="flex h-[34px] w-[34px] items-center justify-center rounded-[9px] text-[15px] font-bold text-white"
          style={{ backgroundColor: c.chipBg }}
        >
          {c.initial}
        </div>
        <div className="min-w-0">
          <div className="text-[14px] font-semibold text-[#1F2A37]">{c.role}</div>
          <div className="text-[12px] text-[#98A2B3]">{c.company}</div>
        </div>
      </div>
      <div className="mb-[10px] flex items-center gap-[5px] text-[12px] text-[#667085]">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#98A2B3" strokeWidth="1.8"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0" /><circle cx="12" cy="10" r="3" /></svg>
        {c.location}
      </div>
      {c.note && (
        <div
          className={`mb-[10px] flex items-center gap-[6px] rounded-[7px] px-[9px] py-[6px] text-[12px] ${
            c.note.tone === 'offer'
              ? 'bg-[#ECFDF3] font-semibold text-[#046C4E]'
              : 'bg-[#FEF3E2] text-[#B45309]'
          }`}
        >
          {c.note.tone === 'offer' ? (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
          ) : (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
          )}
          {c.note.text}
        </div>
      )}
      <div className="flex items-center justify-between border-t border-[#F0F2F4] pt-[10px]">
        <span className="text-[13px] font-semibold text-[#1F2A37]">{c.salary}</span>
        <span className="rounded-[6px] bg-[#ECFDF3] px-2 py-[3px] text-[12px] font-bold text-[#046C4E]">매칭 {c.match}%</span>
      </div>
    </div>
  )
}

export default function ApplicationsShowcase() {
  return (
    <section className="border-t border-[#EEF1F0] bg-[#F7F8FA]">
      <div className="mx-auto max-w-[1200px] px-4 py-16 sm:px-8 sm:py-[88px]">
        {/* 섹션 헤딩 */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#CEEBDC] bg-[#ECFDF3] px-[13px] py-[6px] text-[13px] font-semibold text-[#046C4E]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18" /><path d="m7 14 4-4 3 3 5-6" /></svg>
            지원 현황
          </div>
          <h2 className="mt-4 text-[30px] font-bold leading-[1.2] tracking-[-0.03em] text-[#0B1A12] sm:text-[38px]">
            준비부터 오퍼까지, 한눈에 추적하세요
          </h2>
          <p className="mx-auto mt-3 max-w-[520px] text-[15px] leading-[1.6] text-[#4B5563]">
            지원한 공고를 칸반 보드로 관리하고, 면접 일정과 오퍼 진행 상황을
            매칭률과 함께 놓치지 않고 챙길 수 있습니다.
          </p>
        </div>

        {/* 칸반 목업 */}
        <div className="overflow-hidden rounded-[20px] border border-[#E6EEEA] bg-white p-4 shadow-[0_24px_60px_-28px_rgba(4,108,78,0.28)] sm:p-6">
          <div className="grid grid-cols-1 items-start gap-[14px] sm:grid-cols-2 lg:grid-cols-4">
            {COLUMNS.map(col => (
              <div key={col.label} className="rounded-[14px] border border-[#EDF0F2] bg-[#F4F6F8] p-3">
                <div className="flex items-center gap-2 px-[6px] pb-3 pt-1">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: col.dot }} />
                  <span className="text-[13px] font-semibold text-[#344054]">{col.label}</span>
                  <span className="rounded-[20px] bg-[#E7EBEE] px-2 py-[1px] text-[12px] font-semibold text-[#98A2B3]">
                    {col.cards.length}
                  </span>
                </div>
                <div className="flex flex-col gap-[10px]">
                  {col.cards.map(c => <Card key={c.company} c={c} />)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
