import SearchBar from './SearchBar'
import GlobalConnectGraphic from './GlobalConnectGraphic'
import { Check } from '../ui/icons'
import type { Dictionary } from '@/lib/matchda/i18n'

const TRUST_AVATARS = [
  { initial: '지', bg: '#A7D8C4', fg: '#0B5238' },
  { initial: 'M', bg: '#BBD4F2', fg: '#1E4B8F' },
  { initial: '현', bg: '#F2D9B8', fg: '#8A5A1E' },
  { initial: '+', bg: '#E2C7E8', fg: '#6B3A78' },
]

/** 분할 히어로 (좌 카피·검색바, 우 글로벌 연결 그래픽) */
export default function SplitHero({ t, searchHref }: { t: Dictionary; searchHref?: string }) {
  return (
    <section className="mx-auto grid max-w-[1200px] grid-cols-1 items-center gap-10 px-4 pb-12 pt-12 sm:px-8 sm:pt-[84px] lg:grid-cols-[1.04fr_0.96fr] lg:gap-[60px]">
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-[#CEEBDC] bg-[#ECFDF3] px-[13px] py-[6px] text-[13px] font-semibold text-[#046C4E]">
          <span className="h-[7px] w-[7px] rounded-full bg-[#046C4E]" />
          {t.hero.eyebrow}
        </div>
        <h1 className="mt-[22px] text-[34px] font-bold leading-[1.15] tracking-[-0.035em] text-[#0B1A12] sm:text-[44px] sm:leading-[1.12] lg:text-[53px]">
          {t.hero.titleLine1}
          <br />
          {t.hero.titleLine2}
        </h1>
        <p className="mt-[22px] max-w-[452px] text-[16px] leading-[1.62] text-[#4B5563] sm:text-[18px]">
          {t.hero.subhead}
        </p>

        <div className="mt-[34px]">
          <SearchBar
            country={t.hero.searchCountry}
            placeholder={t.hero.searchPlaceholder}
            buttonLabel={t.hero.searchButton}
            submitHref={searchHref}
          />
        </div>

        <div className="mt-3 flex items-center gap-1.5 text-[13px] font-medium text-[#046C4E]">
          <Check size={14} strokeWidth={2.4} />
          {t.hero.freeNote}
        </div>

        <div className="mt-3 flex items-center gap-3">
          <div className="flex">
            {TRUST_AVATARS.map((a, i) => (
              <span
                key={i}
                className={`flex h-8 w-8 items-center justify-center rounded-full border-2 border-white text-[12px] font-semibold ${
                  i === 0 ? '' : '-ml-[9px]'
                }`}
                style={{ background: a.bg, color: a.fg }}
              >
                {a.initial}
              </span>
            ))}
          </div>
          <span className="text-[14px] text-[#667085]">
            {t.hero.trustPrefix}
            <b className="text-[#1F2A37]">{t.hero.trustCount}</b>
            {t.hero.trustSuffix}
          </span>
        </div>
      </div>

      <GlobalConnectGraphic t={t} />
    </section>
  )
}
