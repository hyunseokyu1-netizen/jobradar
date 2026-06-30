import type { Dictionary } from '@/lib/matchda/i18n'

/** 그린 스탯 밴드 (4지표) */
export default function StatsBand({ t }: { t: Dictionary }) {
  return (
    <section className="mx-auto mt-9 max-w-[1200px] px-4 sm:px-8">
      <div className="grid grid-cols-2 gap-6 rounded-[20px] bg-[#046C4E] px-6 py-8 sm:px-11 sm:py-[38px] md:grid-cols-4">
        {t.stats.map((s) => (
          <div key={s.label}>
            <div className="text-[28px] font-bold tracking-[-0.02em] text-white sm:text-[34px]">{s.value}</div>
            <div className="mt-1 text-[14px] text-[#A7D8C4]">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  )
}
