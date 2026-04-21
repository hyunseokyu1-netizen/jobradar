import { chromium } from 'playwright-core'
import chromiumBin from '@sparticuz/chromium'
import { supabaseAdmin as supabase } from '@/lib/supabase-admin'

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

/** 모든 유저 프로파일에서 스크래핑 대상 조합을 수집 (중복 제거) */
async function collectScrapeTargets(): Promise<ScrapeTarget[]> {
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('desired_positions, desired_locations, desired_sources')
    .not('desired_positions', 'is', null)
    .contains('desired_sources', ['indeed'])

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

  const limit = parseInt(process.env.SCRAPE_TARGET_LIMIT ?? '2')
  return targets.slice(0, limit)
}

function buildSearchUrl(keyword: string, location: string): string {
  const q = encodeURIComponent(keyword)
  const l = encodeURIComponent(location)
  return `https://au.indeed.com/jobs?q=${q}&l=${l}&fromage=${DAYS_AGO}&sort=date`
}

async function scrapeJobsFromPage(page: import('playwright-core').Page): Promise<JobData[]> {
  const jobs: JobData[] = []

  const cards = await page.$$('div.job_seen_beacon')
  if (cards.length === 0) return jobs

  for (const card of cards) {
    try {
      const jobKey = await card.$eval('h2.jobTitle a[data-jk]', el => el.getAttribute('data-jk')).catch(() => null)
      if (!jobKey) continue

      const title = await card.$eval('h2.jobTitle a span', el => el.textContent?.trim() ?? '').catch(() => '')
      const company = await card.$eval('[data-testid="company-name"]', el => el.textContent?.trim() ?? '').catch(() => '')
      const location = await card.$eval('[data-testid="text-location"]', el => el.textContent?.trim() ?? '').catch(() => '')

      if (!title || !company) continue

      // 카드 클릭 → 오른쪽 패널에서 JD 추출
      const link = await card.$('h2.jobTitle a[data-jk]')
      if (link) {
        await link.click()
        await page.waitForTimeout(1500)
      }

      const description = await page.$eval('#jobDescriptionText', el => el.textContent?.trim() ?? null).catch(() => null)
      const salary = await page.$eval('[data-testid="attribute_snippet_testid"]', el => el.textContent?.trim() ?? null).catch(() => null)
      const dateText = await page.$eval('[data-testid="job-age"], .date', el => el.textContent?.trim() ?? null).catch(() => null)

      let posted_at: string | null = null
      if (dateText) {
        const match = dateText.match(/(\d+)\s*day/)
        if (match) {
          const d = new Date()
          d.setDate(d.getDate() - parseInt(match[1]))
          posted_at = d.toISOString()
        } else if (/today|just posted/i.test(dateText)) {
          posted_at = new Date().toISOString()
        }
      }

      jobs.push({
        source: 'indeed',
        title,
        company,
        location,
        salary,
        description,
        url: `https://au.indeed.com/viewjob?jk=${jobKey}`,
        posted_at,
      })

      await page.waitForTimeout(500)
    } catch {
      continue
    }
  }

  return jobs
}

async function getNextPageUrl(page: import('playwright-core').Page): Promise<string | null> {
  return page.$eval('a[data-testid="pagination-page-next"]', el => (el as HTMLAnchorElement).href).catch(() => null)
}

export async function scrapeIndeed(): Promise<{ inserted: number; duplicates: number; errors: number; targets: number }> {
  const targets = await collectScrapeTargets()

  if (targets.length === 0) {
    return { inserted: 0, duplicates: 0, errors: 0, targets: 0 }
  }

  const isVercel = !!process.env.VERCEL
  const browser = await chromium.launch({
    args: [
      ...(isVercel ? chromiumBin.args : []),
      '--disable-blink-features=AutomationControlled',
    ],
    executablePath: isVercel ? await chromiumBin.executablePath() : undefined,
    headless: true,
  })
  let inserted = 0
  let duplicates = 0
  let errors = 0

  const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

  try {
    const page = await browser.newPage()
    await page.setExtraHTTPHeaders({ 'User-Agent': UA })
    await page.addInitScript(() => { Object.defineProperty(navigator, 'webdriver', { get: () => false }) })

    for (const { keyword, location } of targets) {
      let url: string | null = buildSearchUrl(keyword, location)

      while (url) {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })
        await page.waitForTimeout(2000)

        const title = await page.title()
        if (title.toLowerCase().includes('blocked')) break

        const jobs = await scrapeJobsFromPage(page)

        for (const job of jobs) {
          const { error } = await supabase.from('jobs').upsert(job, { onConflict: 'url', ignoreDuplicates: true })
          if (error) {
            if (error.code === '23505') duplicates++
            else errors++
          } else {
            inserted++
          }
        }

        url = await getNextPageUrl(page)
        if (url) await page.waitForTimeout(2000)
      }
    }
  } finally {
    await browser.close()
  }

  return { inserted, duplicates, errors, targets: targets.length }
}
