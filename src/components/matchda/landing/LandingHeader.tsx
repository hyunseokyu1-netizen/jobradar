import Link from 'next/link'
import { Logo } from '../ui/primitives'
import type { Dictionary } from '@/lib/matchda/i18n'

/**
 * 랜딩 sticky 헤더 (72px, 반투명 + blur).
 * tinted: 랜딩 B 의 연그린 배경 변형.
 */
export default function LandingHeader({
  t,
  tinted = false,
  logoHref = '/matchda',
  loginHref = '/matchda/dashboard',
  signupHref = loginHref,
}: {
  t: Dictionary
  tinted?: boolean
  logoHref?: string
  /** 로그인 버튼 목적지 (공개 랜딩은 /login) */
  loginHref?: string
  /** 무료로 시작하기 버튼 목적지 (공개 랜딩은 /login?mode=signup) */
  signupHref?: string
}) {
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
            <span className="cursor-pointer text-[15px] font-medium text-[#475467]">
              {t.nav.about}
            </span>
            <Link
              href="/matchda/dashboard"
              className="cursor-pointer text-[15px] font-medium text-[#475467] hover:text-[#046C4E]"
            >
              {t.nav.jobs}
            </Link>
            <Link
              href="/matchda/workspace"
              className="cursor-pointer text-[15px] font-medium text-[#475467] hover:text-[#046C4E]"
            >
              {t.nav.resume}
            </Link>
            <span className="cursor-pointer text-[15px] font-medium text-[#475467]">
              {t.nav.pricing}
            </span>
          </nav>
        </div>
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
      </div>
    </header>
  )
}
