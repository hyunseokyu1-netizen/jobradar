import * as cheerio from 'cheerio'
import type { ScrapedJob } from './seek-url'
import { fetchHtml } from './fetch-html'

export async function scrapeGenericUrl(url: string): Promise<ScrapedJob> {
  const html = await fetchHtml(url)
  const $ = cheerio.load(html)

  // JSON-LD JobPosting
  let ldJob: ScrapedJob | null = null
  $('script[type="application/ld+json"]').each((_, el) => {
    if (ldJob) return
    try {
      const data = JSON.parse($(el).text())
      const posting = Array.isArray(data)
        ? data.find(d => d['@type'] === 'JobPosting')
        : data['@type'] === 'JobPosting' ? data : null
      if (posting) {
        ldJob = {
          title: posting.title ?? '',
          company: posting.hiringOrganization?.name ?? '',
          location: posting.jobLocation?.address?.addressLocality ?? '',
          salary: posting.baseSalary?.value?.value?.toString() ?? null,
          description: posting.description ?? '',
          posted_at: posting.datePosted ?? null,
        }
      }
    } catch { /* continue */ }
  })
  if (ldJob) return ldJob

  // Open Graph + meta fallback
  const ogTitle = $('meta[property="og:title"]').attr('content') ?? ''
  const ogDesc = $('meta[property="og:description"]').attr('content')
    ?? $('meta[name="description"]').attr('content') ?? ''
  const title = ogTitle || $('h1').first().text()

  if (!title.trim()) throw new Error('공고 정보를 찾을 수 없습니다.')

  // 본문에서 가장 긴 텍스트 블록을 description으로 사용
  let description = ogDesc
  if (!description) {
    let maxLen = 0
    $('div, article, section').each((_, el) => {
      const text = $(el).text().trim()
      if (text.length > maxLen) { maxLen = text.length; description = text }
    })
  }

  return {
    title: title.trim(),
    company: $('meta[property="og:site_name"]').attr('content')?.trim() ?? '',
    location: '',
    salary: null,
    description: description.slice(0, 5000),
    posted_at: null,
  }
}
