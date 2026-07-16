// 잡 탐색 추천 기업 프리셋 — 한 번 클릭으로 채용페이지 등록 + 수집.
// URL은 지원 ATS(greenhouse/lever/ashby/apple)의 보드 주소로, 공개 API로 안정 수집됨.
// (2026-07 공개 ATS API로 유효성·공고 수 확인한 슬러그만 등록. 새 후보는 반드시
//  boards-api.greenhouse.io / api.lever.co / api.ashbyhq.com 으로 검증 후 추가할 것)

export interface PresetCompany {
  name: string
  url: string
  /** 클릭 한 번으로 자동 수집이 안 되는 소스(예: Apple은 검색 키워드 필수) — 클릭 시 안내로 유도 */
  needsSearchUrl?: boolean
}

export const PRESET_COMPANIES: PresetCompany[] = [
  // ── 호주 · 뉴질랜드 ──────────────────────────────
  { name: 'Xero', url: 'https://jobs.ashbyhq.com/xero' },
  { name: 'Airwallex', url: 'https://jobs.ashbyhq.com/airwallex' },
  { name: 'Culture Amp', url: 'https://boards.greenhouse.io/cultureamp' },
  { name: 'Immutable', url: 'https://jobs.lever.co/immutable' },
  { name: 'Octopus Deploy', url: 'https://boards.greenhouse.io/octopusdeploy' },
  // ── 글로벌 ──────────────────────────────────────
  { name: 'OpenAI', url: 'https://jobs.ashbyhq.com/openai' },
  { name: 'Anthropic', url: 'https://boards.greenhouse.io/anthropic' },
  { name: 'Apple', url: 'https://jobs.apple.com/en-us/search', needsSearchUrl: true },
  { name: 'Stripe', url: 'https://boards.greenhouse.io/stripe' },
  { name: 'Airbnb', url: 'https://boards.greenhouse.io/airbnb' },
  { name: 'Notion', url: 'https://jobs.ashbyhq.com/notion' },
  { name: 'Figma', url: 'https://boards.greenhouse.io/figma' },
  { name: 'Spotify', url: 'https://jobs.lever.co/spotify' },
  { name: 'Databricks', url: 'https://boards.greenhouse.io/databricks' },
  { name: 'Datadog', url: 'https://boards.greenhouse.io/datadog' },
  { name: 'Vercel', url: 'https://boards.greenhouse.io/vercel' },
  { name: 'Supabase', url: 'https://jobs.ashbyhq.com/supabase' },
  { name: 'Linear', url: 'https://jobs.ashbyhq.com/linear' },
  { name: 'Ramp', url: 'https://jobs.ashbyhq.com/ramp' },
  { name: 'Brex', url: 'https://boards.greenhouse.io/brex' },
  { name: 'Roblox', url: 'https://boards.greenhouse.io/roblox' },
  { name: 'Robinhood', url: 'https://boards.greenhouse.io/robinhood' },
  { name: 'Coinbase', url: 'https://boards.greenhouse.io/coinbase' },
  { name: 'Cloudflare', url: 'https://boards.greenhouse.io/cloudflare' },
  { name: 'Samsara', url: 'https://boards.greenhouse.io/samsara' },
  { name: 'Instacart', url: 'https://boards.greenhouse.io/instacart' },
  { name: 'DoorDash', url: 'https://boards.greenhouse.io/doordashusa' },
  { name: 'Duolingo', url: 'https://boards.greenhouse.io/duolingo' },
  { name: 'Dropbox', url: 'https://boards.greenhouse.io/dropbox' },
  { name: 'Twitch', url: 'https://boards.greenhouse.io/twitch' },
  { name: 'Pinterest', url: 'https://boards.greenhouse.io/pinterest' },
  { name: 'Reddit', url: 'https://boards.greenhouse.io/reddit' },
  { name: 'Lyft', url: 'https://boards.greenhouse.io/lyft' },
  { name: 'GitLab', url: 'https://boards.greenhouse.io/gitlab' },
  { name: 'Discord', url: 'https://boards.greenhouse.io/discord' },
]
