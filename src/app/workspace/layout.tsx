import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '이력서 워크스페이스 · MatchDa',
  description: '공고에 맞춰 이력서를 편집하고 영어로 번역·최적화하세요.',
}

/**
 * 워크스페이스 셸. IBM Plex Sans KR 폰트를 적용하고 풀블리드 렌더한다.
 * (전역 헤더는 AppChrome 에서 /workspace 경로일 때 숨긴다.)
 */
export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="font-[family-name:var(--font-plex-kr)] antialiased text-[#111827]"
      style={{ width: '100%' }}
    >
      {children}
    </div>
  )
}
