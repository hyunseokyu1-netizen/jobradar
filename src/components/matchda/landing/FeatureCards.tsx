import Link from 'next/link'
import { Languages, BarColumns, Target, ArrowRight } from '../ui/icons'
import type { Dictionary } from '@/lib/matchda/i18n'

const ICONS = [Languages, BarColumns, Target]
// 각 기능 카드의 "자세히 보기" 라우팅 (README 네비게이션 흐름)
const HREFS = ['/matchda/workspace', '/matchda/dashboard', '/matchda/workspace']

/**
 * 기능 3카드 (아이콘 박스 + 제목 + 설명 + 선택적 "자세히 보기").
 * variant='b': 랜딩 B — 카드 그림자 + 링크 생략, 섹션 패딩 축소.
 */
export default function FeatureCards({
  t,
  variant = 'a',
}: {
  t: Dictionary
  variant?: 'a' | 'b'
}) {
  const isB = variant === 'b'
  return (
    <section className={`mx-auto max-w-[1200px] px-8 ${isB ? 'pb-6 pt-2' : 'pb-6 pt-10'}`}>
      <div className="grid grid-cols-3 gap-6">
        {t.features.map((f, i) => {
          const Icon = ICONS[i]
          return (
            <div
              key={f.title}
              className={`rounded-[16px] border border-[#EAECEF] bg-white p-7 ${
                isB ? 'shadow-[0_2px_10px_rgba(16,24,40,0.03)]' : ''
              }`}
            >
              <div className="flex h-[46px] w-[46px] items-center justify-center rounded-[12px] bg-[#ECFDF3] text-[#046C4E]">
                <Icon size={22} strokeWidth={1.7} />
              </div>
              <h3 className="mb-2 mt-[18px] text-[18px] font-bold tracking-[-0.01em] text-[#101828]">
                {f.title}
              </h3>
              <p className="m-0 text-[15px] leading-[1.62] text-[#667085]">{f.desc}</p>
              {!isB && (
                <Link
                  href={HREFS[i]}
                  className="mt-[18px] inline-flex items-center gap-[5px] text-[14px] font-semibold text-[#046C4E]"
                >
                  {t.featureMore}
                  <ArrowRight size={15} />
                </Link>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
