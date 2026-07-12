'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { addPresetSource, scrapeSourceAction } from '@/app/discover/actions'
import { PRESET_COMPANIES } from '@/lib/discover/presets'

/**
 * 추천 기업 프리셋 — 클릭 한 번으로 채용페이지 등록 + 즉시 수집.
 */
export default function PresetCompanies() {
  const router = useRouter()
  const [busy, setBusy] = useState<string | null>(null)
  const [result, setResult] = useState<Record<string, string>>({})

  async function handleCollect(name: string, url: string) {
    setBusy(name)
    setResult(prev => ({ ...prev, [name]: '' }))
    const add = await addPresetSource(name, url)
    if (add.error || !add.sourceId) {
      setBusy(null)
      setResult(prev => ({ ...prev, [name]: `⚠️ ${add.error ?? '등록 실패'}` }))
      return
    }
    const scrape = await scrapeSourceAction(add.sourceId)
    setBusy(null)
    if (scrape.error) {
      setResult(prev => ({ ...prev, [name]: `⚠️ ${scrape.error}` }))
      return
    }
    setResult(prev => ({
      ...prev,
      [name]: `✓ ${scrape.found ?? 0}건 발견 · ${scrape.added ?? 0}건 추가`,
    }))
    router.refresh()
  }

  return (
    <section className="mb-8">
      <h2 className="mb-1 text-base font-semibold text-[#1F2A37]">추천 기업 바로 수집</h2>
      <p className="mb-3 text-xs text-[#98A2B3]">
        큰 기업 채용페이지를 클릭 한 번으로 등록하고 공고를 수집합니다.
      </p>
      <div className="flex flex-wrap gap-2">
        {PRESET_COMPANIES.map(({ name, url }) => {
          const msg = result[name]
          const isBusy = busy === name
          return (
            <button
              key={name}
              type="button"
              disabled={isBusy}
              onClick={() => handleCollect(name, url)}
              title={msg || url}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors disabled:opacity-60 ${
                msg?.startsWith('✓')
                  ? 'border-[#CEEBDC] bg-[#ECFDF3] text-[#046C4E]'
                  : msg?.startsWith('⚠️')
                    ? 'border-amber-200 bg-amber-50 text-amber-700'
                    : 'border-[#ECEEF0] bg-white text-[#344054] hover:border-[#046C4E] hover:text-[#046C4E]'
              }`}
            >
              {isBusy ? (
                <span>{name} · 수집 중…</span>
              ) : msg ? (
                <span>{name} · {msg.replace(/^[✓⚠️]\s*/, '')}</span>
              ) : (
                <span>+ {name}</span>
              )}
            </button>
          )
        })}
      </div>
      {busy && (
        <p className="mt-2 text-xs text-[#667085]">
          <span className="animate-pulse">⟳</span> 페이지 접속 → 공고 추출 → AI 채점 순서로 진행됩니다.
          페이지에 따라 2~3분 걸릴 수 있어요. 이 화면을 유지해주세요.
        </p>
      )}
    </section>
  )
}
