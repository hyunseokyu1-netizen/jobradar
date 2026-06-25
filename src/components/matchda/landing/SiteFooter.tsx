import { GlobeMark } from '../ui/icons'
import type { Dictionary } from '@/lib/matchda/i18n'

/** 푸터 (저작권 + 링크) */
export default function SiteFooter({ t }: { t: Dictionary }) {
  return (
    <footer className="mx-auto flex max-w-[1200px] items-center justify-between px-8 pb-[110px] pt-12">
      <div className="flex items-center gap-2">
        <div className="flex h-[26px] w-[26px] items-center justify-center rounded-[7px] bg-[#046C4E]">
          <GlobeMark size={14} className="text-white" />
        </div>
        <span className="text-[14px] text-[#667085]">{t.footer.copyright}</span>
      </div>
      <div className="flex gap-6 text-[14px] text-[#98A2B3]">
        <span className="cursor-pointer">{t.footer.terms}</span>
        <span className="cursor-pointer">{t.footer.privacy}</span>
        <span className="cursor-pointer">{t.footer.support}</span>
      </div>
    </footer>
  )
}
