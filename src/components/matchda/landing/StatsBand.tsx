import type { Dictionary } from '@/lib/matchda/i18n'

/** 그린 스탯 밴드 (4지표) */
export default function StatsBand({ t }: { t: Dictionary }) {
  return (
    <section className="mx-auto mt-9 max-w-[1200px] px-8">
      <div className="grid grid-cols-4 gap-6 rounded-[20px] bg-[#046C4E] px-11 py-[38px]">
        {t.stats.map((s) => (
          <div key={s.label}>
            <div className="text-[34px] font-bold tracking-[-0.02em] text-white">{s.value}</div>
            <div className="mt-1 text-[14px] text-[#A7D8C4]">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  )
}
