import Image from 'next/image'
import Link from 'next/link'
import type { Dictionary } from '@/lib/matchda/i18n'

/** 푸터 (저작권 + 링크) */
export default function SiteFooter({ t }: { t: Dictionary }) {
  return (
    <footer className="mx-auto flex max-w-[1200px] flex-col items-start justify-between gap-4 px-4 pb-16 pt-12 sm:flex-row sm:items-center sm:px-8 sm:pb-[110px]">
      <div className="flex items-center gap-2">
        <Image src="/matchda-mark.png" alt="MatchDa" width={26} height={26} className="rounded-[7px]" />
        <span className="text-[14px] text-[#667085]">{t.footer.copyright}</span>
      </div>
      <div className="flex gap-6 text-[14px] text-[#98A2B3]">
        <Link href="/terms" className="hover:text-[#475467]">{t.footer.terms}</Link>
        <Link href="/privacy" className="hover:text-[#475467]">{t.footer.privacy}</Link>
        <Link href="/refund" className="hover:text-[#475467]">{t.footer.refund}</Link>
        <Link href="/support" className="hover:text-[#475467]">{t.footer.support}</Link>
      </div>
    </footer>
  )
}
