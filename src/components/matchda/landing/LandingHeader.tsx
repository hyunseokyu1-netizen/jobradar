import Link from 'next/link'
import { Logo, Avatar } from '../ui/primitives'
import type { Dictionary } from '@/lib/matchda/i18n'

/**
 * 랜딩 sticky 헤더 (72px, 반투명 + blur).
 * tinted: 랜딩 B 의 연그린 배경 변형.
 * userEmail 이 있으면 우측을 아바타 + 대시보드 버튼으로 교체한다.
 */
export default function LandingHeader({
  t,
  tinted = false,
  logoHref = '/',
  loginHref = '/login',
  signupHref = loginHref,
  userName,
  userEmail,
}: {
  t: Dictionary
  tinted?: boolean
  /** @deprecated userEmail 로 대체 — 전달해도 무시된다 */
  authed?: boolean
  logoHref?: string
  /** 로그인 버튼 목적지 (공개 랜딩은 /login) */
  loginHref?: string
  /** 무료로 시작하기 버튼 목적지 (공개 랜딩은 /login?mode=signup) */
  signupHref?: string
  /** 로그인 유저 이름 (없으면 이메일 앞부분으로 대체) */
  userName?: string | null
  /** 로그인 유저 이메일 — 있으면 로그인·가입 버튼 대신 유저 정보 표시 */
  userEmail?: string | null
}) {
  const displayName = userName || userEmail?.split('@')[0] || ''
  return (
    <header
      className={`sticky top-0 z-50 border-b backdrop-blur-[12px] ${
        tinted ? 'border-[#E4EEE9] bg-[#F7FBF9]/[0.86]' : 'border-[#ECEEF0] bg-white/[0.86]'
      }`}
    >
      <div className="mx-auto flex h-[72px] max-w-[1200px] items-center justify-between px-4 sm:px-8">
        <div className="flex items-center gap-4 lg:gap-11">
          <Logo href={logoHref} sub={t.brand.sub} />
          <nav className="hidden gap-[30px] lg:flex">
            <Link
              href="/about"
              className="cursor-pointer text-[15px] font-medium text-[#475467] hover:text-[#046C4E]"
            >
              {t.nav.about}
            </Link>
            <Link
              href="/discover"
              className="cursor-pointer text-[15px] font-medium text-[#475467] hover:text-[#046C4E]"
            >
              {t.nav.jobs}
            </Link>
            <Link
              href="/profile"
              className="cursor-pointer text-[15px] font-medium text-[#475467] hover:text-[#046C4E]"
            >
              {t.nav.resume}
            </Link>
            <Link
              href="/pricing"
              className="cursor-pointer text-[15px] font-medium text-[#475467] hover:text-[#046C4E]"
            >
              {t.nav.pricing}
            </Link>
          </nav>
        </div>
        {userEmail ? (
          <div className="flex items-center gap-[10px]">
            <Link
              href="/dashboard"
              className="rounded-lg bg-[#046C4E] px-[18px] py-[10px] text-[14px] font-semibold text-white shadow-[0_1px_2px_rgba(4,108,78,0.25)] hover:bg-[#035A40]"
            >
              {t.dashboard.nav.dashboard}
            </Link>
            <Link
              href="/settings"
              title={userEmail}
              className="flex items-center gap-[9px] rounded-lg p-[5px] pr-3 hover:bg-[#F4F6F8]"
            >
              <Avatar initial={displayName.slice(0, 1).toUpperCase()} size={32} />
              <span className="hidden max-w-[140px] truncate text-[14px] font-semibold text-[#1F2A37] sm:block">
                {displayName}
              </span>
            </Link>
          </div>
        ) : (
          <div className="flex items-center gap-[6px]">
            <Link
              href={loginHref}
              className="hidden rounded-lg px-4 py-[9px] text-[14px] font-semibold text-[#344054] hover:bg-[#F4F6F8] sm:inline-block"
            >
              {t.nav.login}
            </Link>
            <Link
              href={signupHref}
              className="rounded-lg bg-[#046C4E] px-[18px] py-[10px] text-[14px] font-semibold text-white shadow-[0_1px_2px_rgba(4,108,78,0.25)] hover:bg-[#035A40]"
            >
              {t.nav.signup}
            </Link>
          </div>
        )}
      </div>
    </header>
  )
}
