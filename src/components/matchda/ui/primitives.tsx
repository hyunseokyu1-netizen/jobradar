import Link from 'next/link'
import Image from 'next/image'
import type { CompanyBrand } from '@/lib/matchda/types'

/** 로고: 그린 마크 + "MatchDa 매치다" */
export function Logo({
  size = 'md',
  href = '/matchda',
  sub,
}: {
  size?: 'sm' | 'md'
  href?: string
  sub?: string
}) {
  const mark = size === 'sm' ? 30 : 32
  return (
    <Link href={href} className="flex items-center gap-[9px]">
      <Image src="/matchda-mark.png" alt="MatchDa" width={mark} height={mark} className="rounded-[9px]" />
      <span className="text-[20px] font-bold tracking-[-0.02em] text-[#0C1A14]">MatchDa</span>
      {sub && <span className="mt-[3px] text-[13px] font-medium text-[#9AA3AD]">{sub}</span>}
    </Link>
  )
}

/** 회사 머리글자 칩 placeholder (실 로고로 교체 예정) */
export function MonogramChip({
  brand,
  size = 34,
  radius = 9,
  fontSize = 15,
}: {
  brand: CompanyBrand
  size?: number
  radius?: number
  fontSize?: number
}) {
  return (
    <span
      className="flex flex-shrink-0 items-center justify-center font-bold text-white"
      style={{ width: size, height: size, borderRadius: radius, background: brand.color, fontSize }}
    >
      {brand.initial}
    </span>
  )
}

/** 사용자 아바타 (머리글자) */
export function Avatar({
  initial,
  size = 34,
  bg = '#A7D8C4',
  fg = '#0B5238',
  fontSize = 13,
}: {
  initial: string
  size?: number
  bg?: string
  fg?: string
  fontSize?: number
}) {
  return (
    <span
      className="flex flex-shrink-0 items-center justify-center rounded-full font-bold"
      style={{ width: size, height: size, background: bg, color: fg, fontSize }}
    >
      {initial}
    </span>
  )
}

/** 매칭률 그린 배지 */
export function MatchBadge({ label }: { label: string }) {
  return (
    <span className="rounded-md bg-[#ECFDF3] px-2 py-[3px] text-[12px] font-bold text-[#046C4E]">
      {label}
    </span>
  )
}
