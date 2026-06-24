// 헤드리스 브라우저로 HTML을 가져오는 폴백 fetcher.
// Cloudflare 봇 매니지먼트 등 JS 챌린지 기반 차단은 헤더 스푸핑으로는 뚫을 수 없어,
// 실제 브라우저(Playwright + Chromium)로 페이지를 렌더링해 최종 HTML을 얻는다.
// 비용·콜드스타트가 크므로 일반 fetch가 403/429로 실패했을 때만 호출한다.
//
// bare playwright는 Canva 등 강한 Cloudflare에서 "Attention Required"로 막히므로,
// playwright-extra + stealth 플러그인으로 자동화 지문을 숨겨 통과율을 높인다.

import { chromium } from 'playwright-extra'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'
import chromiumBin from '@sparticuz/chromium'
import type { Browser } from 'playwright-core'

chromium.use(StealthPlugin())

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'

export async function fetchHtmlWithBrowser(url: string): Promise<string> {
  const isVercel = !!process.env.VERCEL
  const browser: Browser = await chromium.launch({
    args: [
      ...(isVercel ? chromiumBin.args : []),
      '--disable-blink-features=AutomationControlled',
    ],
    executablePath: isVercel ? await chromiumBin.executablePath() : undefined,
    headless: true,
  })

  try {
    const page = await browser.newPage()
    await page.setExtraHTTPHeaders({ 'User-Agent': UA, 'Accept-Language': 'en-US,en;q=0.9' })

    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })
    // Cloudflare 등 JS 챌린지가 통과되며 본문이 렌더링될 시간을 준다.
    await page.waitForTimeout(4000)

    return await page.content()
  } finally {
    await browser.close()
  }
}
