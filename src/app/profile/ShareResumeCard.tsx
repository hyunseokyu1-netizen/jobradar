'use client'

import { useState } from 'react'
import { setPublicResume, type PublicResumeState } from './share-actions'

export default function ShareResumeCard({ initial }: { initial: PublicResumeState }) {
  const [enabled, setEnabled] = useState(initial.enabled)
  const [slug, setSlug] = useState<string | null>(initial.slug)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const shareUrl =
    slug && typeof window !== 'undefined' ? `${window.location.origin}/r/${slug}` : slug ? `/r/${slug}` : ''

  async function toggle(next: boolean) {
    setLoading(true)
    setError(null)
    const res = await setPublicResume(next)
    setLoading(false)
    if (res.error) {
      setError(res.error)
      return
    }
    setEnabled(!!res.enabled)
    if (res.slug) setSlug(res.slug)
  }

  async function copy() {
    if (!shareUrl) return
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      setError('링크 복사에 실패했어요. 직접 선택해 복사해주세요.')
    }
  }

  return (
    <section className="mt-12 max-w-2xl">
      <h2 className="mb-1 text-base font-semibold">공개 이력서 링크</h2>
      <p className="mb-4 text-xs text-[#98A2B3]">
        영문 이력서를 공개 링크로 공유할 수 있어요. 연락처(이메일·전화번호)는 공개되지 않습니다.
      </p>

      <div className="rounded-[12px] border border-[#ECEEF0] bg-white p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-sm font-medium text-[#1F2A37]">
              {enabled ? '공개 중' : '비공개'}
            </div>
            <div className="mt-0.5 text-xs text-[#98A2B3]">
              {enabled ? '링크가 있는 누구나 이 이력서를 볼 수 있어요.' : '링크를 켜면 공유할 수 있어요.'}
            </div>
          </div>
          <button
            type="button"
            onClick={() => toggle(!enabled)}
            disabled={loading}
            aria-pressed={enabled}
            className={`relative h-6 w-11 flex-shrink-0 rounded-full transition ${
              enabled ? 'bg-[#046C4E]' : 'bg-[#D0D5DD]'
            } ${loading ? 'opacity-60' : ''}`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                enabled ? 'left-[22px]' : 'left-0.5'
              }`}
            />
          </button>
        </div>

        {enabled && slug && (
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <input
              readOnly
              value={shareUrl}
              onFocus={(e) => e.currentTarget.select()}
              className="flex-1 rounded-[9px] border border-[#ECEEF0] bg-[#F9FAFB] px-3 py-2 text-[13px] text-[#475467]"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={copy}
                className="rounded-[9px] bg-[#101828] px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-[#1F2A37]"
              >
                {copied ? '복사됨 ✓' : '링크 복사'}
              </button>
              <a
                href={shareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-[9px] border border-[#ECEEF0] px-4 py-2 text-[13px] font-semibold text-[#475467] transition hover:bg-[#F4F6F8]"
              >
                미리보기
              </a>
            </div>
          </div>
        )}

        {error && <div className="mt-3 text-xs text-[#D92D20]">{error}</div>}
      </div>
    </section>
  )
}
