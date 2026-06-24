import type { NextConfig } from "next";

// 헤드리스 브라우저 스크래핑에 필요한 네이티브/동적 require 패키지들.
// 번들하지 않고(serverExternalPackages) 런타임에 node_modules에서 require 한다.
// stealth 플러그인은 evasions/* 를 동적 require 하므로 파일 트레이싱에 포함해야 한다.
const BROWSER_PACKAGES = [
  '@sparticuz/chromium',
  'playwright-core',
  'playwright-extra',
  'puppeteer-extra-plugin-stealth',
]

const BROWSER_TRACE_GLOBS = [
  './node_modules/@sparticuz/chromium/**',
  './node_modules/playwright-core/**',
  './node_modules/playwright-extra/**',
  './node_modules/puppeteer-extra-plugin*/**', // stealth + 의존 플러그인 일괄 포함
]

const nextConfig: NextConfig = {
  serverExternalPackages: BROWSER_PACKAGES,
  outputFileTracingIncludes: {
    '/api/scrape': BROWSER_TRACE_GLOBS,
    // 잡 탐색 수집 서버 액션(scrapeSourceAction)이 도는 라우트 — 브라우저 폴백용
    '/discover': BROWSER_TRACE_GLOBS,
  },
};

export default nextConfig;
