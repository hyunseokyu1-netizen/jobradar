// 회사 채용 페이지에서 공고 목록을 수집하는 ATS 어댑터.
// 주요 ATS(Greenhouse, Lever, Ashby, SmartRecruiters)는 공개 JSON API를 쓰고,
// 자체 구축 사이트(Spotify, Apple 등)는 generic 어댑터(HTML + Claude 추출)로 폴백한다.

import { fetchHtml } from '@/lib/scrapers/fetch-html'

export type AtsType = 'greenhouse' | 'lever' | 'ashby' | 'smartrecruiters' | 'apple' | 'generic'

export interface DiscoveredPosting {
  title: string
  url: string
  location?: string
  department?: string
}

const FETCH_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
  Accept: 'application/json, text/html;q=0.9, */*;q=0.8',
}

export function detectAtsType(url: string): { type: AtsType; board?: string } {
  let u: URL
  try {
    u = new URL(url)
  } catch {
    return { type: 'generic' }
  }
  const host = u.hostname.toLowerCase()
  const firstSeg = u.pathname.split('/').filter(Boolean)[0]

  if (host === 'boards.greenhouse.io' || host === 'job-boards.greenhouse.io') {
    return { type: 'greenhouse', board: firstSeg }
  }
  if (host === 'jobs.lever.co') {
    return { type: 'lever', board: firstSeg }
  }
  if (host === 'jobs.ashbyhq.com') {
    return { type: 'ashby', board: firstSeg }
  }
  if (host === 'careers.smartrecruiters.com' || host === 'jobs.smartrecruiters.com') {
    return { type: 'smartrecruiters', board: firstSeg }
  }
  if (host === 'jobs.apple.com') {
    return { type: 'apple' }
  }
  return { type: 'generic' }
}

async function fetchJson(url: string, init?: RequestInit): Promise<any> {
  const res = await fetch(url, { ...init, headers: { ...FETCH_HEADERS, ...init?.headers }, cache: 'no-store' })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} — ${url}`)
  return res.json()
}

async function scrapeGreenhouse(board: string): Promise<DiscoveredPosting[]> {
  const data = await fetchJson(`https://boards-api.greenhouse.io/v1/boards/${board}/jobs?content=false`)
  return (data.jobs ?? []).map((j: any) => ({
    title: j.title,
    url: j.absolute_url,
    location: j.location?.name,
    department: j.departments?.[0]?.name,
  }))
}

async function scrapeLever(board: string): Promise<DiscoveredPosting[]> {
  const data = await fetchJson(`https://api.lever.co/v0/postings/${board}?mode=json`)
  return (Array.isArray(data) ? data : []).map((j: any) => ({
    title: j.text,
    url: j.hostedUrl,
    location: j.categories?.location,
    department: j.categories?.team,
  }))
}

async function scrapeAshby(board: string): Promise<DiscoveredPosting[]> {
  const data = await fetchJson(
    `https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(board)}?includeCompensation=false`
  )
  return (data.jobs ?? []).map((j: any) => ({
    title: j.title,
    url: j.jobUrl,
    location: j.location,
    department: j.department,
  }))
}

async function scrapeSmartRecruiters(board: string): Promise<DiscoveredPosting[]> {
  const postings: DiscoveredPosting[] = []
  let offset = 0
  // 최대 3페이지(300건)까지만
  for (let page = 0; page < 3; page++) {
    const data = await fetchJson(
      `https://api.smartrecruiters.com/v1/companies/${encodeURIComponent(board)}/postings?limit=100&offset=${offset}`
    )
    const items = data.content ?? []
    for (const j of items) {
      postings.push({
        title: j.name,
        url: `https://jobs.smartrecruiters.com/${board}/${j.id}`,
        location: [j.location?.city, j.location?.country].filter(Boolean).join(', '),
        department: j.department?.label,
      })
    }
    offset += items.length
    if (items.length < 100) break
  }
  return postings
}

// Apple 검색 페이지 URL에서 검색 키워드 추출.
// 예: ?search=data → "data", ?product=apple-music-APPMU → "apple music"
function appleKeyword(url: string): string {
  const params = new URL(url).searchParams
  const search = params.get('search')?.trim()
  if (search) return search

  const product = params.get('product')?.trim()
  if (product) {
    // 'apple-music-APPMU' → 끝의 대문자 코드 제거 → 'apple-music' → 'apple music'
    return product.replace(/-[A-Z0-9]+$/, '').replace(/-/g, ' ')
  }

  const team = params.get('team')?.trim()
  if (team) return team.replace(/-/g, ' ')

  return ''
}

// Apple 공개 search API로 공고 목록 수집 (CSRF 토큰 + 키워드 검색)
async function scrapeApple(url: string): Promise<DiscoveredPosting[]> {
  const keyword = appleKeyword(url)
  if (!keyword) {
    throw new Error('Apple 소스는 검색 키워드가 필요합니다. URL에 ?search=키워드 또는 ?product=... 를 포함해주세요.')
  }

  // CSRF 토큰 + 쿠키 획득
  const tokenRes = await fetch('https://jobs.apple.com/api/v1/csrfToken', {
    headers: { 'User-Agent': FETCH_HEADERS['User-Agent'] },
    cache: 'no-store',
  })
  const token = tokenRes.headers.get('x-apple-csrf-token') ?? ''
  const cookie = tokenRes.headers.get('set-cookie') ?? ''
  if (!token) throw new Error('Apple CSRF 토큰을 가져오지 못했습니다.')

  const postings: DiscoveredPosting[] = []
  for (let page = 1; page <= 5; page++) {
    const res = await fetch('https://jobs.apple.com/api/v1/search?locale=en-us', {
      method: 'POST',
      headers: {
        'User-Agent': FETCH_HEADERS['User-Agent'],
        'Content-Type': 'application/json',
        'X-Apple-CSRF-Token': token,
        Cookie: cookie,
        Referer: 'https://jobs.apple.com/en-us/search',
        Origin: 'https://jobs.apple.com',
      },
      body: JSON.stringify({
        query: keyword,
        locale: 'en-us',
        page,
        sort: 'newest',
        format: { longDate: 'MMMM D, YYYY', mediumDate: 'MMM D, YYYY' },
        filters: { range: { standardWeeklyHours: { start: null, end: null } }, teams: [] },
      }),
      cache: 'no-store',
    })
    if (!res.ok) throw new Error(`Apple search failed: ${res.status}`)

    const results = (await res.json())?.res?.searchResults ?? []
    if (results.length === 0) break

    for (const j of results) {
      // reqId = "{positionId}-{postingIdentifier}" → detail URL 구성
      const jobNumber = j.reqId ?? j.positionId
      if (!jobNumber || !j.transformedPostingTitle) continue
      const loc = j.locations?.[0]
      postings.push({
        title: j.postingTitle,
        url: `https://jobs.apple.com/en-us/details/${jobNumber}/${j.transformedPostingTitle}`,
        location: loc ? [loc.city ?? loc.name, loc.countryName].filter(Boolean).join(', ') : undefined,
        department: j.team?.teamName,
      })
    }
  }

  return postings
}

// 자체 구축 채용 페이지: HTML을 가져와 Claude Haiku로 공고 목록 추출
async function scrapeGeneric(url: string): Promise<DiscoveredPosting[]> {
  // 봇 차단(403/429) 사이트가 많아, 브라우저 헤더 + 재시도가 포함된 공통 fetcher 사용.
  // 헤더로 안 뚫리는 Cloudflare 챌린지 등은 헤드리스 브라우저 폴백으로 처리.
  let stripped: string
  try {
    const html = await fetchHtml(url, { label: '수집', browserFallback: true })

    // 스크립트/스타일 제거 후 링크 구조는 유지한 채 압축
    stripped = html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<svg[\s\S]*?<\/svg>/gi, '')
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/\s+/g, ' ')
      // 공고가 페이지 뒤쪽에 있는 경우(긴 마케팅/네비 뒤) 잘리지 않도록 넉넉히.
      // Haiku는 200K 컨텍스트라 여유가 있다.
      .slice(0, 100000)
  } catch (directError) {
    // 직접 fetch·헤드리스 브라우저 모두 차단 → 리더 프록시(r.jina.ai)로 우회.
    // 마크다운이지만 링크가 보존되므로 아래 Haiku 추출 프롬프트를 그대로 쓸 수 있다.
    console.warn(`[discover] 직접 수집 실패, 리더 프록시로 우회: ${url} — ${String(directError)}`)
    const { fetchReaderMarkdown } = await import('@/lib/scrapers/reader')
    stripped = (await fetchReaderMarkdown(url)).slice(0, 100000)
  }

  const { anthropic } = await import('@/lib/claude')
  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 4000,
    messages: [{
      role: 'user',
      content: `아래는 회사 채용 페이지의 내용(HTML 또는 마크다운)입니다. 채용공고 목록을 추출해 JSON으로만 응답하세요. 다른 텍스트는 절대 포함하지 마세요.

형식: {"jobs": [{"title": "직무명", "url": "공고 상세 링크(절대 또는 상대 경로)", "location": "위치(있으면)", "department": "부서(있으면)"}]}

규칙:
- 실제 채용공고 링크만 포함 (네비게이션, 푸터, 블로그 링크 제외)
- 공고를 찾을 수 없으면 {"jobs": []}
- 최대 100개

페이지 내용:
${stripped}`,
    }],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) return []

  let parsed: { jobs?: { title?: string; url?: string; location?: string; department?: string }[] }
  try {
    parsed = JSON.parse(jsonMatch[0])
  } catch {
    return []
  }

  return (parsed.jobs ?? [])
    .filter(j => j.title && j.url)
    .map(j => ({
      title: j.title!,
      url: new URL(j.url!, url).toString(), // 상대 경로 → 절대 경로
      location: j.location,
      department: j.department,
    }))
}

export async function scrapeJobSource(sourceUrl: string, sourceType: AtsType): Promise<DiscoveredPosting[]> {
  const { board } = detectAtsType(sourceUrl)

  let postings: DiscoveredPosting[]
  if (sourceType === 'greenhouse' && board) postings = await scrapeGreenhouse(board)
  else if (sourceType === 'lever' && board) postings = await scrapeLever(board)
  else if (sourceType === 'ashby' && board) postings = await scrapeAshby(board)
  else if (sourceType === 'smartrecruiters' && board) postings = await scrapeSmartRecruiters(board)
  else if (sourceType === 'apple') postings = await scrapeApple(sourceUrl)
  else postings = await scrapeGeneric(sourceUrl)

  // URL 기준 중복 제거
  const seen = new Set<string>()
  return postings.filter(p => {
    if (!p.url || seen.has(p.url)) return false
    seen.add(p.url)
    return true
  })
}
