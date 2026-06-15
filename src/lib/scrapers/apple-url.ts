import type { ScrapedJob } from './seek-url'

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

// jobs.apple.com/{locale}/details/{jobNumber}/{slug} → jobNumber
// 일반 공고는 "200658551-2114", 파이프라인 공고는 "PIPE-200313970" 형식
export function extractAppleJobNumber(url: string): string | null {
  const m = url.match(/\/details\/([^/?#]+)/)
  return m ? m[1] : null
}

interface AppleLocation {
  name?: string
  city?: string
  stateProvince?: string
  countryName?: string
}

// HTML 조각(<p>, <ul> 등)을 평문으로 정리
function htmlToText(html: string | undefined): string {
  if (!html) return ''
  return html
    .replace(/<\/(p|div|li|h[1-6]|ul|ol)>/gi, '\n')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;|&rsquo;|&apos;/g, "'")
    .replace(/&quot;|&ldquo;|&rdquo;/g, '"')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

// Apple 공개 jobDetails API로 단일 공고 상세 수집 (JS 렌더링 우회)
export async function scrapeAppleUrl(url: string): Promise<ScrapedJob> {
  const jobNumber = extractAppleJobNumber(url)
  if (!jobNumber) throw new Error('Apple: URL에서 공고 번호를 찾을 수 없습니다.')

  const res = await fetch(`https://jobs.apple.com/api/v1/jobDetails/${jobNumber}?locale=en-us`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`Apple jobDetails fetch failed: ${res.status}`)

  const json = await res.json()
  const r = json.res
  if (!r?.postingTitle) throw new Error('Apple: 공고 정보를 찾을 수 없습니다.')

  const loc = (r.locations as AppleLocation[] | undefined)?.[0]
  const location = loc
    ? [loc.city ?? loc.name, loc.stateProvince, loc.countryName].filter(Boolean).join(', ')
    : ''

  const description = [
    htmlToText(r.jobSummary),
    htmlToText(r.description),
    r.responsibilities ? `Responsibilities:\n${htmlToText(r.responsibilities)}` : '',
    r.minimumQualifications ? `Minimum Qualifications:\n${htmlToText(r.minimumQualifications)}` : '',
    r.preferredQualifications ? `Preferred Qualifications:\n${htmlToText(r.preferredQualifications)}` : '',
  ]
    .filter(Boolean)
    .join('\n\n')

  return {
    title: r.postingTitle,
    company: 'Apple',
    location,
    salary: null,
    description,
    posted_at: r.postingDate ?? r.postDateInGMT ?? null,
  }
}
