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
  // 검색 키워드가 필요한 소스(Apple 등) — 클릭 시 수집 대신 안내 카드로 펼침
  const [guideOpen, setGuideOpen] = useState<string | null>(null)

  async function handleCollect(name: string, url: string, needsSearchUrl?: boolean) {
    if (needsSearchUrl) {
      setGuideOpen(prev => (prev === name ? null : name))
      return
    }
    setGuideOpen(null)
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
      [name]: `✓ ${scrape.found ?? 0}건 발견 · ${scrape.added ?? 0}건 추가${scrape.fromCache ? ' · 빠른 수집' : ''}`,
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
        {PRESET_COMPANIES.map(({ name, url, needsSearchUrl }) => {
          const msg = result[name]
          const isBusy = busy === name
          return (
            <button
              key={name}
              type="button"
              disabled={isBusy}
              onClick={() => handleCollect(name, url, needsSearchUrl)}
              title={needsSearchUrl ? `${name} · 검색 링크 등록 안내 보기` : msg || url}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors disabled:opacity-60 ${
                guideOpen === name
                  ? 'border-[#046C4E] bg-[#ECFDF3] text-[#046C4E]'
                  : msg?.startsWith('✓')
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
                <span>+ {name}{needsSearchUrl ? ' ℹ️' : ''}</span>
              )}
            </button>
          )
        })}
      </div>

      {guideOpen && (
        <div className="mt-3 rounded-xl border border-[#CEEBDC] bg-[#F6FEF9] p-4 text-[13px] leading-relaxed text-[#054F38]">
          <p className="font-semibold">{guideOpen}은 검색 링크가 필요해요</p>
          <p className="mt-1 text-[#345C4B]">
            이 회사는 채용페이지 전체를 한 번에 수집할 수 없어서, 원하는 포지션을 직접 검색한 뒤
            그 검색 결과 링크를 등록해주셔야 해요.
          </p>
          <ol className="mt-2 list-decimal space-y-1 pl-4 text-[#345C4B]">
            <li>
              <a
                href={PRESET_COMPANIES.find(c => c.name === guideOpen)?.url}
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-[#046C4E] underline underline-offset-2"
              >
                {guideOpen} 채용 사이트 열기 →
              </a>
            </li>
            <li>원하는 직무·키워드로 검색</li>
            <li>검색 결과 페이지의 URL을 복사</li>
            <li>위 &quot;채용 페이지 URL&quot; 칸에 붙여넣고 &quot;페이지 등록&quot;</li>
          </ol>
        </div>
      )}
      {busy && (
        <p className="mt-2 text-xs text-[#667085]">
          <span className="animate-pulse">⟳</span> 페이지 접속 → 공고 추출 → AI 채점 순서로 진행됩니다.
          페이지에 따라 2~3분 걸릴 수 있어요. 이 화면을 유지해주세요.
        </p>
      )}
      {Object.values(result).some(m => m.includes('업그레이드')) && (
        <p className="mt-2 text-xs">
          <a href="/pricing" className="font-semibold text-[#046C4E] hover:underline">요금제 보기 →</a>
        </p>
      )}
    </section>
  )
}
