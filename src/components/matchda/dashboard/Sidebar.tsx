import Link from 'next/link'
import { GlobeMark, LayoutDashboard, FileText, Bookmark, TrendingUp, Target, ChevronDown } from '../ui/icons'
import { Avatar } from '../ui/primitives'
import type { Dictionary } from '@/lib/matchda/i18n'

/** 좌측 고정 사이드바 (248px) */
export default function Sidebar({ t }: { t: Dictionary }) {
  const navItems = [
    { key: 'dashboard', label: t.dashboard.nav.dashboard, Icon: LayoutDashboard, active: true, href: '/matchda/dashboard' },
    { key: 'myResume', label: t.dashboard.nav.myResume, Icon: FileText, active: false, href: '/matchda/workspace' },
    { key: 'savedJobs', label: t.dashboard.nav.savedJobs, Icon: Bookmark, active: false, href: '/matchda/dashboard' },
    { key: 'applications', label: t.dashboard.nav.applications, Icon: TrendingUp, active: false, href: '/matchda/dashboard' },
    { key: 'recommended', label: t.dashboard.nav.recommended, Icon: Target, active: false, href: '/matchda/dashboard' },
  ]

  return (
    <aside className="sticky top-0 flex min-h-screen w-[248px] flex-shrink-0 flex-col self-start border-r border-[#ECEEF0] bg-white px-[14px] py-5">
      <Link href="/matchda" className="flex cursor-pointer items-center gap-[9px] px-2 pb-[18px] pt-[6px]">
        <div className="flex h-[30px] w-[30px] items-center justify-center rounded-lg bg-[#046C4E]">
          <GlobeMark size={17} className="text-white" />
        </div>
        <span className="text-[18px] font-bold tracking-[-0.02em] text-[#0C1A14]">MatchDa</span>
      </Link>

      <nav className="flex flex-col gap-[3px]">
        {navItems.map(({ key, label, Icon, active, href }) => (
          <Link
            key={key}
            href={href}
            className={`flex items-center gap-[11px] rounded-[10px] px-3 py-[10px] text-[14px] ${
              active
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

      <div className="mb-3 rounded-[14px] bg-[linear-gradient(160deg,#046C4E,#035A40)] p-4">
        <div className="text-[14px] font-bold text-white">{t.dashboard.premium.title}</div>
        <div className="my-[6px] mb-3 text-[12px] leading-[1.5] text-[#A7D8C4]">
          {t.dashboard.premium.desc}
        </div>
        <button
          type="button"
          className="w-full rounded-[9px] bg-white py-[9px] text-[13px] font-semibold text-[#046C4E]"
        >
          {t.dashboard.premium.button}
        </button>
      </div>

      <div className="flex items-center gap-[10px] border-t border-[#F0F2F4] p-2 pt-[14px]">
        <Avatar initial="지" size={34} fontSize={13} />
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-semibold text-[#1F2A37]">김지민</div>
          <div className="text-[12px] text-[#98A2B3]">{t.dashboard.plan}</div>
        </div>
        <ChevronDown size={16} className="text-[#98A2B3]" />
      </div>
    </aside>
  )
}
