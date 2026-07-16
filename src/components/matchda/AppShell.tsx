import Sidebar from './dashboard/Sidebar'
import MobileNav from './MobileNav'
import { Logo } from './ui/primitives'
import { getMatchdaDict } from '@/lib/matchda/i18n'

/**
 * MatchDa 앱 셸 — 사이드바 + 콘텐츠 영역.
 * /discover·/profile 등 로그인 앱 페이지를 MatchDa 사이드바로 감싸 크롬을 통일한다.
 * (내부 콘텐츠 스타일은 각 페이지 그대로 — 여기선 셸/크롬만 통일)
 */
export default function AppShell({
  activeKey,
  userName,
  userEmail,
  children,
}: {
  activeKey: 'dashboard' | 'applications' | 'discover' | 'profile' | 'settings'
  userName?: string
  userEmail?: string | null
  children: React.ReactNode
}) {
  const t = getMatchdaDict('ko')

  return (
    <div className="flex min-h-screen bg-[#F7F8FA] font-[family-name:var(--font-plex-kr)] text-[#111827] antialiased">
      <Sidebar t={t} userName={userName} userEmail={userEmail} activeKey={activeKey} />

      <main className="min-w-0 flex-1">
        {/* 모바일: 사이드바가 숨겨지므로 로고 + 햄버거 메뉴 노출 */}
        <header className="sticky top-0 z-20 flex h-[60px] items-center justify-between border-b border-[#ECEEF0] bg-white px-4 sm:px-6 lg:hidden">
          <Logo href="/" />
          <MobileNav activeKey={activeKey} />
        </header>

        <div className="mx-auto max-w-[1040px] px-4 py-8 sm:px-6 lg:px-9">{children}</div>
      </main>
    </div>
  )
}
