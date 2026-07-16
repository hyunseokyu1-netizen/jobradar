import Link from 'next/link'
import Image from 'next/image'
import { LayoutDashboard, FileText, Target, Briefcase } from '../ui/icons'
import { Avatar } from '../ui/primitives'
import { signOut } from '@/app/auth-actions'
import FeedbackButton from '@/components/FeedbackButton'
import { isAdminEmail } from '@/lib/admin'
import type { Dictionary } from '@/lib/matchda/i18n'

/**
 * 좌측 고정 사이드바 (248px).
 * userEmail 이 있으면 실제 유저(로그아웃 포함), 없으면 목업 데모 placeholder.
 */
export default function Sidebar({
  t,
  userName,
  userEmail,
  activeKey = 'dashboard',
}: {
  t: Dictionary
  userName?: string
  userEmail?: string | null
  activeKey?: 'dashboard' | 'applications' | 'discover' | 'profile' | 'settings'
}) {
  const navItems = [
    { key: 'dashboard', label: t.dashboard.nav.dashboard, Icon: LayoutDashboard, href: '/dashboard' },
    { key: 'discover', label: t.dashboard.nav.discover, Icon: Target, href: '/discover' },
    { key: 'applications', label: t.dashboard.nav.applications, Icon: Briefcase, href: '/applications' },
    { key: 'profile', label: t.dashboard.nav.myResume, Icon: FileText, href: '/profile' },
  ] as const

  // 이름 미설정 유저는 이메일 앞부분으로 표시 (목업 이름은 비로그인 데모 전용)
  const displayName = userName || userEmail?.split('@')[0] || '회원'

  return (
    <aside className="sticky top-0 hidden min-h-screen w-[248px] flex-shrink-0 flex-col self-start border-r border-[#ECEEF0] bg-white px-[14px] py-5 lg:flex">
      <Link href="/" className="flex cursor-pointer items-center gap-[9px] px-2 pb-[18px] pt-[6px]">
        <Image src="/matchda-mark.png" alt="MatchDa" width={30} height={30} className="rounded-lg" />
        <span className="text-[18px] font-bold tracking-[-0.02em] text-[#0C1A14]">MatchDa</span>
      </Link>

      <nav className="flex flex-col gap-[3px]">
        {navItems.map(({ key, label, Icon, href }) => (
          <Link
            key={key}
            href={href}
            className={`flex items-center gap-[11px] rounded-[10px] px-3 py-[10px] text-[14px] ${
              key === activeKey
                ? 'bg-[#ECFDF3] font-semibold text-[#046C4E]'
                : 'font-medium text-[#475467] hover:bg-[#F4F6F8]'
            }`}
          >
            <Icon size={18} />
            {label}
          </Link>
        ))}
      </nav>

      <div className="flex-1" />

      {/* 무료 공개 기간: 후기 수집이 곧 반응 지표 */}
      {userEmail && (
        <div className="mb-2">
          <FeedbackButton />
          {/* 관리자 전용 (ADMIN_EMAILS) — 일반 유저에게는 렌더되지 않음 */}
          {isAdminEmail(userEmail) && (
            <Link
              href="/admin/feedback"
              className="flex items-center gap-[11px] rounded-[10px] px-3 py-[10px] text-[14px] font-medium text-[#475467] hover:bg-[#F4F6F8]"
            >
              🛠 후기 관리
            </Link>
          )}
        </div>
      )}

      <div className="mb-3 rounded-[14px] bg-[linear-gradient(160deg,#046C4E,#035A40)] p-4">
        <div className="text-[14px] font-bold text-white">{t.dashboard.premium.title}</div>
        <div className="my-[6px] mb-3 text-[12px] leading-[1.5] text-[#A7D8C4]">
          {t.dashboard.premium.desc}
        </div>
        <Link
          href="/pricing"
          className="block w-full rounded-[9px] bg-white py-[9px] text-center text-[13px] font-semibold text-[#046C4E] transition-colors hover:bg-[#F4F6F8]"
        >
          {t.dashboard.premium.button}
        </Link>
      </div>

      <div className="border-t border-[#F0F2F4] pt-[10px]">
        <Link
          href="/settings"
          title="설정"
          className={`flex items-center gap-[10px] rounded-[9px] p-2 transition-colors hover:bg-[#F4F6F8] ${
            activeKey === 'settings' ? 'bg-[#ECFDF3]' : ''
          }`}
        >
          <Avatar initial={displayName.slice(0, 1)} size={34} fontSize={13} />
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-semibold text-[#1F2A37]">{displayName}</div>
            <div className="truncate text-[12px] text-[#98A2B3]">{userEmail || t.dashboard.plan}</div>
          </div>
        </Link>
        {userEmail && (
          <form action={signOut}>
            <button
              type="submit"
              className="mt-1 w-full rounded-[9px] px-3 py-[7px] text-left text-[12px] font-medium text-[#98A2B3] hover:bg-[#F4F6F8] hover:text-[#475467]"
            >
              {t.dashboard.logout}
            </button>
          </form>
        )}
      </div>
    </aside>
  )
}
