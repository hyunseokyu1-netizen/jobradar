import Link from 'next/link'

const FEATURES = [
  {
    icon: '🔭',
    title: '잡 탐색',
    desc: '관심 회사의 채용 페이지를 등록하면 새 공고를 자동으로 수집합니다. Greenhouse·Lever·Apple 등 글로벌 채용 시스템을 지원합니다.',
  },
  {
    icon: '🎯',
    title: 'AI 매칭',
    desc: '당신의 이력서와 경력을 분석해 공고와의 적합도를 점수로 보여줍니다. 가능성 높은 곳에 집중하세요.',
  },
  {
    icon: '✍️',
    title: '맞춤 이력서 & 커버레터',
    desc: '공고(JD)에 맞춰 이력서를 재구성하고 커버레터를 작성합니다. 원본 양식을 유지한 DOCX·PDF로 바로 다운로드.',
  },
]

const REGIONS = ['🇦🇺 호주', '🇳🇿 뉴질랜드', '🇬🇧 영국', '🇪🇺 유럽', '🇺🇸 북미', '🌏 그 외']

export default function Landing() {
  return (
    <div className="py-10">
      {/* 히어로 */}
      <section className="text-center max-w-2xl mx-auto">
        <p className="text-sm font-semibold text-blue-600 mb-3">AI 기반 글로벌 채용 도우미</p>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-tight text-zinc-900">
          해외로 취업하세요.
          <br />
          당신의 역량은 <span className="text-blue-600">세계로</span> 나아갈 수 있습니다.
        </h1>
        <p className="text-base text-zinc-500 mt-5 leading-relaxed">
          채용공고 탐색부터 AI 매칭, 맞춤 이력서·커버레터까지.
          <br className="hidden sm:block" />
          Matchda가 해외 취업의 모든 과정을 함께합니다.
        </p>

        <div className="flex items-center justify-center gap-3 mt-8">
          <Link
            href="/login"
            className="bg-zinc-900 text-white text-sm font-medium px-6 py-3 rounded-xl hover:bg-zinc-700 transition-colors"
          >
            무료로 시작하기 →
          </Link>
          <Link
            href="/login"
            className="text-sm font-medium text-zinc-600 px-6 py-3 rounded-xl border border-zinc-200 hover:bg-zinc-50 transition-colors"
          >
            로그인
          </Link>
        </div>

        {/* 대상 지역 */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-8">
          {REGIONS.map(r => (
            <span key={r} className="text-xs text-zinc-500 bg-white border border-zinc-200 rounded-full px-3 py-1.5">
              {r}
            </span>
          ))}
        </div>
      </section>

      {/* 기능 소개 */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-16 max-w-4xl mx-auto">
        {FEATURES.map(f => (
          <div key={f.title} className="bg-white border border-zinc-200 rounded-2xl p-6">
            <div className="text-3xl mb-3">{f.icon}</div>
            <h3 className="font-bold text-zinc-900">{f.title}</h3>
            <p className="text-sm text-zinc-500 mt-2 leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </section>

      {/* 작동 방식 */}
      <section className="mt-16 max-w-3xl mx-auto">
        <h2 className="text-center text-xl font-bold text-zinc-900 mb-8">3단계로 끝</h2>
        <div className="space-y-4">
          {[
            ['1', '채용 페이지 등록 또는 공고 URL 붙여넣기', '관심 회사의 채용 페이지를 등록하거나, 마음에 든 공고 URL을 그대로 붙여넣으세요.'],
            ['2', 'AI가 매칭 점수와 근거 제시', '당신의 프로필 기준으로 적합도를 분석합니다. 어디에 지원할지 더 이상 고민하지 마세요.'],
            ['3', '맞춤 이력서·커버레터 생성', '공고에 맞춘 이력서와 커버레터를 만들어 바로 다운로드하고 지원하세요.'],
          ].map(([n, title, desc]) => (
            <div key={n} className="flex gap-4 items-start bg-white border border-zinc-200 rounded-2xl p-5">
              <div className="shrink-0 w-8 h-8 rounded-full bg-zinc-900 text-white text-sm font-bold flex items-center justify-center">
                {n}
              </div>
              <div>
                <h3 className="font-semibold text-zinc-900">{title}</h3>
                <p className="text-sm text-zinc-500 mt-1 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 하단 CTA */}
      <section className="text-center mt-16">
        <h2 className="text-2xl font-bold text-zinc-900">지금, 세계로 나아갈 준비를 시작하세요.</h2>
        <Link
          href="/login"
          className="inline-block mt-6 bg-blue-600 text-white text-sm font-medium px-7 py-3 rounded-xl hover:bg-blue-700 transition-colors"
        >
          무료로 시작하기 →
        </Link>
      </section>
    </div>
  )
}
