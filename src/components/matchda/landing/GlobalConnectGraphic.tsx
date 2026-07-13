import { Check } from '../ui/icons'
import type { Dictionary } from '@/lib/matchda/i18n'

const NODES = [
  { cx: 150, cy: 160, label: '시드니', tx: 166, ty: 164, anchor: 'start' as const },
  { cx: 440, cy: 135, label: '멜번', tx: 392, ty: 120, anchor: 'start' as const },
  { cx: 120, cy: 335, label: '브리즈번', tx: 136, ty: 339, anchor: 'start' as const },
  { cx: 450, cy: 345, label: '오클랜드', tx: 376, ty: 370, anchor: 'start' as const },
]

const DOTS = [
  [70, 80], [130, 60], [210, 70], [470, 90], [500, 200], [60, 240],
  [500, 300], [80, 400], [250, 430], [360, 60], [170, 420], [430, 430],
]

/**
 * 우측 "글로벌 연결" 추상 일러스트 (SVG 원시 도형).
 * 점선 곡선 dashflow 애니메이션은 globals.css 의 keyframe 사용 (장식, 생략 가능).
 * TODO: 실제 지도/사진 자산으로 교체 가능.
 */
export default function GlobalConnectGraphic({ t }: { t: Dictionary }) {
  return (
    <div className="relative rounded-[24px] border border-[#E6EEEA] bg-[linear-gradient(160deg,#F4FBF7_0%,#FFFFFF_70%)] p-[22px] shadow-[0_24px_60px_-28px_rgba(4,108,78,0.28)]">
      <svg viewBox="0 0 560 470" className="block h-auto w-full">
        <g fill="#D2E6DC">
          {DOTS.map(([cx, cy], i) => (
            <circle key={i} cx={cx} cy={cy} r="1.6" />
          ))}
        </g>
        <g
          stroke="#046C4E"
          strokeWidth="1.6"
          fill="none"
          opacity="0.5"
          strokeDasharray="3 7"
          className="md-dashflow"
        >
          <path d="M300 290 Q205 205 150 160" />
          <path d="M300 290 Q425 195 440 135" />
          <path d="M300 290 Q160 345 120 335" />
          <path d="M300 290 Q435 350 450 345" />
        </g>
        {NODES.map((n) => (
          <g key={n.label}>
            <circle cx={n.cx} cy={n.cy} r="11" fill="#046C4E" opacity="0.12" />
            <circle cx={n.cx} cy={n.cy} r="5" fill="#fff" stroke="#046C4E" strokeWidth="2" />
            <text
              x={n.tx}
              y={n.ty}
              fontFamily="var(--font-plex-kr)"
              fontSize="13"
              fontWeight="600"
              fill="#475467"
            >
              {n.label}
            </text>
          </g>
        ))}
        <g>
          <circle
            cx="300"
            cy="290"
            r="20"
            fill="#046C4E"
            opacity="0.1"
            className="md-ringpulse"
            style={{ transformOrigin: '300px 290px' }}
          />
          <circle cx="300" cy="290" r="9" fill="#046C4E" />
          <circle cx="300" cy="290" r="3.4" fill="#fff" />
          <text
            x="300"
            y="324"
            textAnchor="middle"
            fontFamily="var(--font-plex-kr)"
            fontSize="14"
            fontWeight="700"
            fill="#046C4E"
          >
            서울
          </text>
        </g>
      </svg>

      {/* 떠있는 미니 카드 — 새 매칭 */}
      <div className="absolute right-[26px] top-[30px] flex items-center gap-[9px] rounded-[12px] border border-[#ECEEF0] bg-white px-[14px] py-[11px] shadow-[0_8px_24px_rgba(16,24,40,0.10)]">
        <span className="h-2 w-2 rounded-full bg-[#046C4E]" />
        <div>
          <div className="text-[11px] font-medium text-[#98A2B3]">{t.hero.floatRealtime}</div>
          <div className="text-[13px] font-semibold text-[#1F2A37]">{t.hero.floatNewMatches}</div>
        </div>
      </div>

      {/* 떠있는 미니 카드 — 번역 완료 */}
      <div className="absolute bottom-[30px] left-[26px] flex items-center gap-[10px] rounded-[12px] border border-[#ECEEF0] bg-white px-[14px] py-[11px] shadow-[0_8px_24px_rgba(16,24,40,0.10)]">
        <div className="flex h-[30px] w-[30px] items-center justify-center rounded-lg bg-[#ECFDF3] text-[#046C4E]">
          <Check size={16} />
        </div>
        <div>
          <div className="text-[13px] font-semibold text-[#1F2A37]">{t.hero.floatTranslated}</div>
          <div className="text-[11px] text-[#98A2B3]">{t.hero.floatTranslatedSub}</div>
        </div>
      </div>
    </div>
  )
}
