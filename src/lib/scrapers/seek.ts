import { chromium } from 'playwright-extra'
import stealth from 'puppeteer-extra-plugin-stealth'
import { supabase } from '@/lib/supabase'

chromium.use(stealth())

const DAYS_AGO = 7

interface JobData {
  source: string
  title: string
  company: string
  location: string
  salary: string | null
  description: string | null
  url: string
  posted_at: string | null
}

interface ScrapeTarget {
  keyword: string
  location: string
}

/** 모든 유저 프로파일에서 Seek 스크래핑 대상 조합 수집 (중복 제거) */
async function collectScrapeTargets(): Promise<ScrapeTarget[]> {
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('desired_positions, desired_locations, desired_sources')
    .not('desired_positions', 'is', null)
    .contains('desired_sources', ['seek'])

  if (error || !profiles?.length) return []

  const seen = new Set<string>()
  const targets: ScrapeTarget[] = []

  for (const profile of profiles) {
    const positions: string[] = profile.desired_positions ?? []
    const locations: string[] = profile.desired_locations ?? ['Sydney NSW']

    for (const keyword of positions) {
      for (const location of locations) {
        const key = `${keyword}|${location}`
        if (!seen.has(key)) {
          seen.add(key)
          targets.push({ keyword, location })
        }
      }
    }
  }

  return targets
}

/** "React Native developer" → "react-native-developer" (Seek URL 형식) */
function toSeekSlug(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

/** "Sydney NSW" → "Sydney-NSW" */
function toSeekLocation(location: string): string {
  return location.replace(/\s+/g, '-')
}

function buildSearchUrl(keyword: string, location: string, page = 1): string {
  const slug = toSeekSlug(keyword)
  const loc = toSeekLocation(location)
  const pageParam = page > 1 ? `&page=${page}` : ''
  return `https://www.seek.com.au/${slug}-jobs/in-${loc}?daterange=${DAYS_AGO}${pageParam}`
}

/** "18h ago" | "3d ago" | "30m ago" → ISO 날짜 */
function parseRelativeDate(text: string): string | null {
  const now = new Date()
  const hourMatch = text.match(/(\d+)h/)
  const dayMatch = text.match(/(\d+)d/)
  const minMatch = text.match(/(\d+)m/)
  if (dayMatch) {
    now.setDate(now.getDate() - parseInt(dayMatch[1]))
    return now.toISOString()
  }
  if (hourMatch) {
    now.setHours(now.getHours() - parseInt(hourMatch[1]))
    return now.toISOString()
  }
  if (minMatch) return now.toISOString()
  return null
}

interface ListingRaw {
  source: string
  title: string
  company: string
  location: string
  salary: string | null
  dateText: string | null
  url: string
}

async function scrapeJobsFromListPage(page: import('playwright').Page): Promise<ListingRaw[]> {
  return page.evaluate(() => {
    const cards = document.querySelectorAll('article[data-testid="job-card"]')
    return Array.from(cards).map(card => {
      const titleEl = card.querySelector('[data-automation="jobTitle"]') as HTMLAnchorElement | null
      const href = titleEl?.getAttribute('href') ?? ''
      const jobId = href.match(/\/job\/(\d+)/)?.[1]
      return {
        source: 'seek',
        title: titleEl?.textContent?.trim() ?? '',
        company: (card.querySelector('[data-automation="jobCompany"]') as HTMLElement | null)?.textContent?.trim() ?? '',
        location: (card.querySelector('[data-automation="jobLocation"]') as HTMLElement | null)?.textContent?.trim() ?? '',
        salary: (card.querySelector('[data-automation="jobSalary"]') as HTMLElement | null)?.textContent?.trim() || null,
        dateText: (card.querySelector('[data-automation="jobListingDate"]') as HTMLElement | null)?.textContent?.trim() || null,
        url: jobId ? `https://www.seek.com.au/job/${jobId}` : '',
      }
    }).filter(j => j.title && j.company && j.url)
  })
}

async function fetchJobDescription(page: import('playwright').Page, url: string): Promise<string | null> {
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 })
    await page.waitForTimeout(1500)
    return await page.$eval(
      '[data-automation="jobAdDetails"]',
      el => el.textContent?.trim() ?? null
    ).catch(() => null)
  } catch {
    return null
  }
}

async function getNextPageNumber(page: import('playwright').Page): Promise<number | null> {
  const href = await page.$eval(
    '[data-automation="page-next"] a, [aria-label="Next"]',
    el => el.getAttribute('href')
  ).catch(() => null)
  if (!href) return null
  const match = href.match(/[?&]page=(\d+)/)
  return match ? parseInt(match[1]) : null
}

export async function scrapeSeek(): Promise<{ inserted: number; duplicates: number; errors: number; targets: number }> {
  const targets = await collectScrapeTargets()
  if (targets.length === 0) return { inserted: 0, duplicates: 0, errors: 0, targets: 0 }

  const browser = await chromium.launch({ headless: true })
  let inserted = 0
  let duplicates = 0
  let errors = 0

  try {
    const listPage = await browser.newPage()
    const detailPage = await browser.newPage()

    for (const { keyword, location } of targets) {
      let pageNum = 1

      while (true) {
        const url = buildSearchUrl(keyword, location, pageNum)
        await listPage.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })
        await listPage.waitForTimeout(2000)

        const title = await listPage.title()
        if (title.toLowerCase().includes('blocked') || title.toLowerCase().includes('moment')) break

        const listings = await scrapeJobsFromListPage(listPage)
        if (listings.length === 0) break

        for (const listing of listings) {
          const description = await fetchJobDescription(detailPage, listing.url)
          const posted_at = listing.dateText ? parseRelativeDate(listing.dateText) : null

          const job: JobData = {
            source: listing.source,
            title: listing.title,
            company: listing.company,
            location: listing.location,
            salary: listing.salary,
            description,
            url: listing.url,
            posted_at,
          }

          const { error } = await supabase.from('jobs').upsert(job, { onConflict: 'url', ignoreDuplicates: true })
          if (error) {
            if (error.code === '23505') duplicates++
            else errors++
          } else {
            inserted++
          }
        }

        const nextPage = await getNextPageNumber(listPage)
        if (!nextPage) break
        pageNum = nextPage
        await listPage.waitForTimeout(2000)
      }
    }
  } finally {
    await browser.close()
  }

  return { inserted, duplicates, errors, targets: targets.length }
}
