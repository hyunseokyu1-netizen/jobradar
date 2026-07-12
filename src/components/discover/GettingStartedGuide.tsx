import Link from 'next/link'

/**
 * 잡 탐색 콜드 스타트 가이드 — 등록된 채용페이지가 없는 신규 유저에게
 * "무엇부터 하면 되는지" 3단계 체크리스트를 보여준다. (서버 컴포넌트)
 */
export default function GettingStartedGuide({
  profileDone,
}: {
  /** 온보딩(이력서 프로필) 완료 여부 — 1단계 체크 표시 */
  profileDone: boolean
}) {
  const steps = [
    {
      done: profileDone,
      title: '이력서 완성하기',
      desc: '매칭 점수는 내 이력서를 기준으로 계산돼요.',
      action: profileDone ? null : { label: '이력서 작성 →', href: '/onboarding' },
    },
    {
      done: false,
      title: '관심 회사 채용페이지 등록',
      desc: '아래에서 URL을 붙여넣거나, 추천 기업을 클릭 한 번으로 등록하세요.',
      action: null,
    },
    {
      done: false,
      title: '첫 매칭 확인',
      desc: '수집이 끝나면 공고마다 나와의 매칭 점수와 이유가 표시됩니다.',
      action: null,
    },
  ]

  return (
    <section className="mb-8 rounded-2xl border border-[#CEEBDC] bg-[#F6FEF9] p-5 sm:p-6">
      <h2 className="text-base font-bold text-[#054F38]">시작하기 — 3단계면 충분해요</h2>
      <ol className="mt-4 space-y-3">
        {steps.map((s, i) => (
          <li key={s.title} className="flex items-start gap-3">
            <span
              className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[12px] font-bold ${
                s.done ? 'bg-[#046C4E] text-white' : 'border border-[#A7D8C4] bg-white text-[#046C4E]'
              }`}
            >
              {s.done ? '✓' : i + 1}
            </span>
            <div className="min-w-0">
              <p className={`text-sm font-semibold ${s.done ? 'text-[#98A2B3] line-through' : 'text-[#1F2A37]'}`}>
                {s.title}
                {s.action && (
                  <Link href={s.action.href} className="ml-2 text-[13px] font-semibold text-[#046C4E] hover:underline">
                    {s.action.label}
                  </Link>
                )}
              </p>
              <p className="mt-0.5 text-xs text-[#667085]">{s.desc}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}
