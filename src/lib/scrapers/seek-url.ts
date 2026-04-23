import * as cheerio from 'cheerio'

export interface ScrapedJob {
  title: string
  company: string
  location: string
  salary: string | null
  description: string
  posted_at: string | null
}

export async function scrapeSeekUrl(url: string): Promise<ScrapedJob> {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-AU,en;q=0.9',
    },
  })

  if (!res.ok) throw new Error(`Seek fetch failed: ${res.status}`)

  const html = await res.text()
  const $ = cheerio.load(html)

  // __NEXT_DATA__ JSON에서 추출 (가장 신뢰성 높음)
  const nextDataRaw = $('#__NEXT_DATA__').text()
  if (nextDataRaw) {
    try {
      const nextData = JSON.parse(nextDataRaw)
      const job = nextData?.props?.pageProps?.jobDetails?.job
        ?? nextData?.props?.pageProps?.job
        ?? nextData?.props?.pageProps?.jobViewDetails

      if (job) {
        return {
          title: job.title ?? job.header?.jobTitle ?? '',
          company: job.advertiser?.description ?? job.companyName ?? '',
          location: job.location ?? job.locationLabel ?? '',
          salary: job.salary ?? job.header?.salary ?? null,
          description: job.content ?? job.description ?? job.details?.description ?? '',
          posted_at: job.listingDate ?? job.header?.listingDate ?? null,
        }
      }
    } catch { /* fall through to cheerio */ }
  }

  // cheerio fallback
  const title = $('h1[data-automation="job-detail-title"]').text()
    || $('h1').first().text()
  const company = $('[data-automation="advertiser-name"]').text()
    || $('[data-automation="job-detail-company"]').text()
  const location = $('[data-automation="job-detail-location"]').text()
    || $('[data-automation="job-detail-work-type"]').text()
  const description = $('[data-automation="jobAdDetails"]').text()
    || $('#jobDescription').text()

  if (!title) throw new Error('Seek: 공고 정보를 찾을 수 없습니다.')

  return {
    title: title.trim(),
    company: company.trim(),
    location: location.trim(),
    salary: null,
    description: description.trim(),
    posted_at: null,
  }
}
