// Lucide 스타일 인라인 stroke 아이콘 (stroke-width 1.7–2, currentColor).
// 의존성 추가 없이 디자인 레퍼런스의 도형을 재현한다.
import type { SVGProps } from 'react'

// strokeWidth 를 number 로 좁혀 재정의 (SVGProps 기본은 string | number)
type IconProps = Omit<SVGProps<SVGSVGElement>, 'strokeWidth'> & {
  size?: number
  strokeWidth?: number
}

function base({ size = 18, strokeWidth = 1.8, ...props }: IconProps) {
  return {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    ...props,
  }
}

/** 로고 마크 (globe) */
export function GlobeMark({ size = 18, strokeWidth = 2, ...p }: IconProps) {
  return (
    <svg {...base({ size, strokeWidth, ...p })}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" />
    </svg>
  )
}

export function ChevronDown({ size = 14, strokeWidth = 2, ...p }: IconProps) {
  return (
    <svg {...base({ size, strokeWidth, ...p })}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}

export function Search({ size = 16, strokeWidth = 2, ...p }: IconProps) {
  return (
    <svg {...base({ size, strokeWidth, ...p })}>
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  )
}

export function ArrowRight({ size = 15, strokeWidth = 2, ...p }: IconProps) {
  return (
    <svg {...base({ size, strokeWidth, ...p })}>
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  )
}

export function ArrowLeft({ size = 15, strokeWidth = 2, ...p }: IconProps) {
  return (
    <svg {...base({ size, strokeWidth, ...p })}>
      <path d="M19 12H5" />
      <path d="m12 19-7-7 7-7" />
    </svg>
  )
}

export function Plus({ size = 16, strokeWidth = 2, ...p }: IconProps) {
  return (
    <svg {...base({ size, strokeWidth, ...p })}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

export function Check({ size = 16, strokeWidth = 2, ...p }: IconProps) {
  return (
    <svg {...base({ size, strokeWidth, ...p })}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}

export function MapPin({ size = 13, ...p }: IconProps) {
  return (
    <svg {...base({ size, ...p })}>
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  )
}

export function Clock({ size = 13, strokeWidth = 2, ...p }: IconProps) {
  return (
    <svg {...base({ size, strokeWidth, ...p })}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  )
}

/** 번역 (languages) */
export function Languages({ size = 22, strokeWidth = 1.7, ...p }: IconProps) {
  return (
    <svg {...base({ size, strokeWidth, ...p })}>
      <path d="m5 8 6 6" />
      <path d="m4 14 6-6 2-3" />
      <path d="M2 5h12" />
      <path d="M7 2h1" />
      <path d="m22 22-5-10-5 10" />
      <path d="M14 18h6" />
    </svg>
  )
}

/** 추적 (bar-columns) */
export function BarColumns({ size = 22, strokeWidth = 1.7, ...p }: IconProps) {
  return (
    <svg {...base({ size, strokeWidth, ...p })}>
      <rect x="3" y="4" width="5" height="16" rx="1.2" />
      <rect x="10" y="4" width="5" height="11" rx="1.2" />
      <rect x="17" y="4" width="5" height="14" rx="1.2" />
    </svg>
  )
}

/** 매칭 (target) */
export function Target({ size = 22, strokeWidth = 1.7, ...p }: IconProps) {
  return (
    <svg {...base({ size, strokeWidth, ...p })}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.4" />
    </svg>
  )
}

export function LayoutDashboard({ size = 18, ...p }: IconProps) {
  return (
    <svg {...base({ size, ...p })}>
      <rect x="3" y="3" width="7" height="9" rx="1.4" />
      <rect x="14" y="3" width="7" height="5" rx="1.4" />
      <rect x="14" y="12" width="7" height="9" rx="1.4" />
      <rect x="3" y="16" width="7" height="5" rx="1.4" />
    </svg>
  )
}

export function FileText({ size = 18, ...p }: IconProps) {
  return (
    <svg {...base({ size, ...p })}>
      <path d="M14 3v5h5" />
      <path d="M14 3H6v18h12V8z" />
      <path d="M9 13h6M9 17h6" />
    </svg>
  )
}

export function FileShort({ size = 16, ...p }: IconProps) {
  return (
    <svg {...base({ size, ...p })}>
      <path d="M14 3v5h5" />
      <path d="M14 3H6v18h12V8z" />
    </svg>
  )
}

export function Bookmark({ size = 18, ...p }: IconProps) {
  return (
    <svg {...base({ size, ...p })}>
      <path d="M6 3h12v18l-6-4-6 4z" />
    </svg>
  )
}

export function TrendingUp({ size = 18, ...p }: IconProps) {
  return (
    <svg {...base({ size, ...p })}>
      <path d="M3 3v18h18" />
      <path d="m7 14 4-4 3 3 5-6" />
    </svg>
  )
}

export function Briefcase({ size = 16, ...p }: IconProps) {
  return (
    <svg {...base({ size, ...p })}>
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
    </svg>
  )
}

export function Bell({ size = 20, ...p }: IconProps) {
  return (
    <svg {...base({ size, ...p })}>
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  )
}

export function Share({ size = 17, ...p }: IconProps) {
  return (
    <svg {...base({ size, ...p })}>
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" />
    </svg>
  )
}

/** 최적화 (sparkle) */
export function Sparkle({ size = 16, strokeWidth = 1.8, ...p }: IconProps) {
  return (
    <svg {...base({ size, strokeWidth, ...p })}>
      <path d="M12 3l1.6 4.6L18 9l-4.4 1.4L12 15l-1.6-4.6L6 9l4.4-1.4z" />
    </svg>
  )
}
