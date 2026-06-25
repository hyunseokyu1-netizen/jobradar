import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'MatchDa · 매치다 — 글로벌 커리어 플랫폼',
  description:
    '한국어 이력서를 전문가 수준의 영어로 번역하고, 전 세계 채용 공고에 맞춰 자동 최적화하세요.',
}

/**
 * MatchDa 화면 공통 셸. IBM Plex Sans KR 폰트를 적용하고 풀블리드 렌더한다.
 * 전역 헤더는 AppChrome 에서 /matchda 경로일 때 숨긴다.
 */
export default function MatchdaLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="font-[family-name:var(--font-plex-kr)] antialiased text-[#111827]"
      style={{ width: '100%' }}
    >
      {children}
    </div>
  )
}
