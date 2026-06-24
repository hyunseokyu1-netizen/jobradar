import type { NextConfig } from "next";

// 헤드리스 브라우저 스크래핑에 필요한 네이티브/동적 require 패키지들.
// 번들하지 않고(serverExternalPackages) 런타임에 node_modules에서 require 한다.
const BROWSER_PACKAGES = [
  '@sparticuz/chromium',
  'playwright-core',
  'playwright-extra',
  'puppeteer-extra-plugin-stealth',
]

// stealth 플러그인은 evasions/* 를 동적 require 하고, 전이 의존성(merge-deep →
// clone-deep → is-plain-object 등)도 hoisting 위치 탓에 NFT가 자동 추적하지 못한다.
// 그래서 stealth + playwright-extra 의존성 폐포 전체를 파일 트레이싱에 명시한다.
// (목록 갱신: `node` 스크립트로 두 패키지의 dependencies를 재귀 수집 후 @types 제외)
const STEALTH_DEP_TREE = [
  'playwright-extra',
  'puppeteer-extra-plugin',
  'puppeteer-extra-plugin-stealth',
  'puppeteer-extra-plugin-user-data-dir',
  'puppeteer-extra-plugin-user-preferences',
  'arr-union', 'balanced-match', 'brace-expansion', 'clone-deep', 'concat-map',
  'debug', 'deepmerge', 'for-in', 'for-own', 'fs-extra', 'fs.realpath', 'glob',
  'graceful-fs', 'inflight', 'inherits', 'is-buffer', 'is-extendable',
  'is-plain-object', 'isobject', 'jsonfile', 'kind-of', 'lazy-cache', 'merge-deep',
  'minimatch', 'mixin-object', 'ms', 'once', 'path-is-absolute', 'rimraf',
  'shallow-clone', 'universalify', 'wrappy',
]

const BROWSER_TRACE_GLOBS = [
  './node_modules/@sparticuz/chromium/**',
  './node_modules/playwright-core/**',
  ...STEALTH_DEP_TREE.map(p => `./node_modules/${p}/**`),
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
