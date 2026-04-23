import * as cheerio from 'cheerio'
import type { ScrapedJob } from './seek-url'

export async function scrapeIndeedUrl(url: string): Promise<ScrapedJob> {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-AU,en;q=0.9',
    },
  })

  if (!res.ok) throw new Error(`Indeed fetch failed: ${res.status}`)

  const html = await res.text()
  const $ = cheerio.load(html)

  // JSON-LD 구조화 데이터 시도
  let ldJob: ScrapedJob | null = null
  $('script[type="application/ld+json"]').each((_, el) => {
    if (ldJob) return
    try {
      const data = JSON.parse($(el).text())
      if (data['@type'] === 'JobPosting') {
        ldJob = {
          title: data.title ?? '',
          company: data.hiringOrganization?.name ?? '',
          location: data.jobLocation?.address?.addressLocality ?? '',
          salary: data.baseSalary?.value?.value?.toString() ?? null,
          description: data.description ?? '',
          posted_at: data.datePosted ?? null,
        }
      }
    } catch { /* continue */ }
  })
  if (ldJob) return ldJob

  // cheerio fallback
  const title = $('h1.jobsearch-JobInfoHeader-title').text()
    || $('[data-testid="jobsearch-JobInfoHeader-title"]').text()
    || $('h1').first().text()
  const company = $('[data-testid="inlineHeader-companyName"]').text()
    || $('.jobsearch-InlineCompanyRating-companyHeader').text()
  const location = $('[data-testid="job-location"]').text()
    || $('[data-testid="inlineHeader-companyLocation"]').text()
  const description = $('#jobDescriptionText').text()
    || $('[data-testid="jobsearch-jobDescriptionText"]').text()

  if (!title) throw new Error('Indeed: 공고 정보를 찾을 수 없습니다.')

  return {
    title: title.trim(),
    company: company.trim(),
    location: location.trim(),
    salary: null,
    description: description.trim(),
    posted_at: null,
  }
}
