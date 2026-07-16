import Link from 'next/link'
import { Plus, Bell } from '../ui/icons'
import { Avatar, Logo } from '../ui/primitives'
import type { Dictionary } from '@/lib/matchda/i18n'

/** 대시보드 상단바 (68px) */
export default function Topbar({
  t,
  userName,
  userEmail,
}: {
  t: Dictionary
  userName?: string
  userEmail?: string | null
}) {
  // 로그인 유저 이니셜 (이름 → 이메일 순 폴백, 없으면 데모용 '지')
  const initial = (userName?.trim()?.[0] ?? userEmail?.trim()?.[0])?.toUpperCase() ?? '지'
  return (
    <header className="sticky top-0 z-20 flex h-[68px] items-center justify-between gap-3 border-b border-[#ECEEF0] bg-white px-4 sm:px-6 lg:px-9">
      {/* 모바일: 사이드바가 숨겨지므로 로고 노출 */}
      <div className="lg:hidden">
        <Logo href="/" />
      </div>
      <div className="flex-1" />
      <div className="flex items-center gap-[14px]">
        <Link
          href="/profile"
          className="flex items-center gap-[7px] rounded-[9px] bg-[#046C4E] px-[15px] py-[9px] text-[14px] font-semibold text-white hover:bg-[#035A40]"
        >
          <Plus size={16} className="text-white" />
          <span className="hidden sm:inline">{t.dashboard.newResume}</span>
        </Link>
        <button type="button" className="relative cursor-pointer text-[#475467]">
          <Bell size={20} />
          <span className="absolute -right-[2px] -top-[2px] h-2 w-2 rounded-full border-2 border-white bg-[#046C4E]" />
        </button>
        <Link href="/settings" title="설정" className="rounded-full transition-opacity hover:opacity-80">
          <Avatar initial={initial} size={36} fontSize={14} />
        </Link>
      </div>
    </header>
  )
}
