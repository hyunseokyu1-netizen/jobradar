'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  { key: 'dashboard', label: '대시보드', href: '/dashboard' },
  { key: 'applications', label: '지원 현황', href: '/applications' },
  { key: 'discover', label: '잡 탐색', href: '/discover' },
  { key: 'profile', label: '내 이력서', href: '/profile' },
  { key: 'settings', label: '설정', href: '/settings' },
  { key: 'pricing', label: '요금제', href: '/pricing' },
  { key: 'support', label: '고객센터', href: '/support' },
] as const

/**
 * 모바일 전용 햄버거 메뉴 (AppShell 헤더 우측).
 * 사이드바가 lg 미만에서 숨겨지므로, 모바일에서 페이지 이동을 담당한다.
 */
export default function MobileNav({ activeKey }: { activeKey?: string }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-label="메뉴 열기"
        onClick={() => setOpen(o => !o)}
        className="flex h-10 w-10 items-center justify-center rounded-[9px] text-[#344054] hover:bg-[#F4F6F8]"
      >
        {open ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 6h18M3 12h18M3 18h18" /></svg>
        )}
      </button>

      {open && (
        <>
          {/* 배경 클릭 시 닫힘 */}
          <div className="fixed inset-0 z-40 bg-black/25" onClick={() => setOpen(false)} />
          <nav className="fixed left-0 right-0 top-[60px] z-50 border-b border-[#ECEEF0] bg-white shadow-[0_12px_32px_rgba(16,24,40,0.12)]">
            {NAV_ITEMS.map(({ key, label, href }) => {
              const active = key === activeKey || pathname === href
              return (
                <Link
                  key={key}
                  href={href}
                  onClick={() => setOpen(false)}
                  className={`block border-b border-[#F4F6F8] px-5 py-3.5 text-[15px] font-medium last:border-b-0 ${
                    active ? 'bg-[#ECFDF3] text-[#046C4E]' : 'text-[#344054] hover:bg-[#F7F8FA]'
                  }`}
                >
                  {label}
                </Link>
              )
            })}
          </nav>
        </>
      )}
    </div>
  )
}
