import Link from 'next/link'
import { Languages, BarColumns, Target, ArrowRight } from '../ui/icons'
import type { Dictionary } from '@/lib/matchda/i18n'

const ICONS = [Languages, BarColumns, Target]
// "자세히 보기" 목적지 — 로그인 유저는 실제 기능 화면으로, 비로그인은 서비스 소개로.
// (목업 데모 화면으로 보내면 진짜 데이터로 착각하므로 데모 라우팅 금지)
const AUTHED_HREFS = ['/profile', '/applications', '/discover']

/**
 * 기능 3카드 (아이콘 박스 + 제목 + 설명 + 선택적 "자세히 보기").
 * variant='b': 랜딩 B — 카드 그림자 + 링크 생략, 섹션 패딩 축소.
 */
export default function FeatureCards({
  t,
  variant = 'a',
  authed = false,
}: {
  t: Dictionary
  variant?: 'a' | 'b'
  authed?: boolean
}) {
  const isB = variant === 'b'
  return (
    <section className={`mx-auto max-w-[1200px] px-4 sm:px-8 ${isB ? 'pb-6 pt-2' : 'pb-6 pt-10'}`}>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
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
                  href={authed ? AUTHED_HREFS[i] : '/about'}
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
