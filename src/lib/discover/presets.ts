// 잡 탐색 추천 기업 프리셋 — 한 번 클릭으로 채용페이지 등록 + 수집.
// URL은 지원 ATS(greenhouse/lever/apple)의 보드 주소로, 공개 API로 안정 수집됨.
// (2026-07 공개 ATS API로 유효성 확인한 슬러그)

export interface PresetCompany {
  name: string
  url: string
}

export const PRESET_COMPANIES: PresetCompany[] = [
  { name: 'Apple', url: 'https://jobs.apple.com/en-us/search' },
  { name: 'Spotify', url: 'https://jobs.lever.co/spotify' },
  { name: 'Stripe', url: 'https://boards.greenhouse.io/stripe' },
  { name: 'Anthropic', url: 'https://boards.greenhouse.io/anthropic' },
  { name: 'Databricks', url: 'https://boards.greenhouse.io/databricks' },
  { name: 'Figma', url: 'https://boards.greenhouse.io/figma' },
  { name: 'Coinbase', url: 'https://boards.greenhouse.io/coinbase' },
  { name: 'Cloudflare', url: 'https://boards.greenhouse.io/cloudflare' },
  { name: 'Pinterest', url: 'https://boards.greenhouse.io/pinterest' },
  { name: 'Reddit', url: 'https://boards.greenhouse.io/reddit' },
  { name: 'Lyft', url: 'https://boards.greenhouse.io/lyft' },
  { name: 'DoorDash', url: 'https://boards.greenhouse.io/doordashusa' },
  { name: 'GitLab', url: 'https://boards.greenhouse.io/gitlab' },
  { name: 'Discord', url: 'https://boards.greenhouse.io/discord' },
]
