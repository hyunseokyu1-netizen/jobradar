import { chromium } from 'playwright-extra'
import stealth from 'puppeteer-extra-plugin-stealth'
import { supabase } from '@/lib/supabase'

chromium.use(stealth())

const KEYWORDS = ['React Native', 'Fullstack developer', 'Node.js developer', 'TypeScript developer']
const LOCATIONS = ['Sydney NSW', 'Melbourne VIC', 'Auckland']
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

function buildSearchUrl(keyword: string, location: string): string {
  const q = encodeURIComponent(keyword)
  const l = encodeURIComponent(location)
  return `https://au.indeed.com/jobs?q=${q}&l=${l}&fromage=${DAYS_AGO}&sort=date`
}

async function scrapeJobsFromPage(page: import('playwright').Page): Promise<JobData[]> {
  const jobs: JobData[] = []

  const cards = await page.$$('div.job_seen_beacon')
  if (cards.length === 0) return jobs

  for (let i = 0; i < cards.length; i++) {
    try {
      // 카드 기본 정보 수집
      const card = cards[i]
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

      // "X days ago" → ISO 날짜 변환
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

async function getNextPageUrl(page: import('playwright').Page): Promise<string | null> {
  return page.$eval('a[data-testid="pagination-page-next"]', el => (el as HTMLAnchorElement).href).catch(() => null)
}

export async function scrapeIndeed(): Promise<{ inserted: number; duplicates: number; errors: number }> {
  const browser = await chromium.launch({ headless: true })
  let inserted = 0
  let duplicates = 0
  let errors = 0

  try {
    const page = await browser.newPage()

    for (const keyword of KEYWORDS) {
      for (const location of LOCATIONS) {
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
    }
  } finally {
    await browser.close()
  }

  return { inserted, duplicates, errors }
}
