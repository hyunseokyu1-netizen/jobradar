import SearchBar from './SearchBar'
import type { Dictionary } from '@/lib/matchda/i18n'

const BG_DOTS = [
  [120, 120], [300, 80], [980, 110], [1100, 240],
  [160, 300], [1050, 420], [220, 480], [900, 500],
]

/** 랜딩 B 중앙 정렬 히어로 (그린 워시 + 흐린 연결선 SVG 배경) */
export default function CenteredHero({ t }: { t: Dictionary }) {
  return (
    <section className="relative overflow-hidden bg-[radial-gradient(120%_90%_at_50%_0%,#E9F7F1_0%,#F5FBF8_42%,#FFFFFF_80%)] px-4 pb-14 pt-16 sm:px-8 sm:pb-[76px] sm:pt-[92px]">
      {/* 배경 연결선 (장식) */}
      <svg
        viewBox="0 0 1200 600"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-0 h-full w-full opacity-50"
      >
        <g fill="#CDE6DA">
          {BG_DOTS.map(([cx, cy], i) => (
            <circle key={i} cx={cx} cy={cy} r="2" />
          ))}
        </g>
        <g
          stroke="#9CCFB9"
          strokeWidth="1.2"
          fill="none"
          strokeDasharray="3 8"
          className="md-dashflow"
        >
          <path d="M120 120 Q400 60 600 200" />
          <path d="M600 200 Q820 90 980 110" />
          <path d="M600 200 Q300 360 220 480" />
          <path d="M600 200 Q920 380 1050 420" />
        </g>
      </svg>

      <div className="relative mx-auto max-w-[760px] text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#CEEBDC] bg-white px-[13px] py-[6px] text-[13px] font-semibold text-[#046C4E] shadow-[0_2px_8px_rgba(4,108,78,0.06)]">
          <span className="h-[7px] w-[7px] rounded-full bg-[#046C4E]" />
          {t.hero.eyebrow}
        </div>
        <h1 className="mt-6 text-[34px] font-bold leading-[1.12] tracking-[-0.04em] text-[#0B1A12] sm:text-[48px] sm:leading-[1.1] lg:text-[62px]">
          {t.hero.titleLine1}
          <br />
          {t.hero.titleLine2}
        </h1>
        <p className="mx-auto mt-6 max-w-[540px] text-[16px] leading-[1.6] text-[#475467] sm:text-[19px]">
          {t.heroB.subheadLine1}
          <br />
          {t.heroB.subheadLine2}
        </p>

        <div className="mt-[38px]">
          <SearchBar
            size="lg"
            country={t.hero.searchCountry}
            placeholder={t.hero.searchPlaceholder}
            buttonLabel={t.hero.searchButton}
          />
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-[10px] text-[14px] text-[#667085]">
          <span className="text-[#98A2B3]">{t.heroB.popularLabel}</span>
          {t.heroB.popularChips.map((chip) => (
            <span
              key={chip}
              className="cursor-pointer rounded-full border border-[#E4EEE9] bg-white px-3 py-[5px] font-medium text-[#3F5249]"
            >
              {chip}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
