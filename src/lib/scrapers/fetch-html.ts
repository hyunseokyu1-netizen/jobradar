// 채용공고 URL 스크래핑용 공통 fetch 헬퍼.
// 일부 사이트(예: Akamai/Cloudflare 봇 차단)는 데이터센터 IP에 간헐적으로 403/429를
// 반환하므로, 브라우저와 유사한 헤더 + 일시적 오류에 대한 재시도로 성공률을 높인다.

const BROWSER_HEADERS: Record<string, string> = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  'Accept':
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Sec-Fetch-User': '?1',
  'Upgrade-Insecure-Requests': '1',
}

// 재시도 대상이 되는 일시적 차단/오류 상태 코드
const RETRYABLE = new Set([403, 429, 500, 502, 503, 504])

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

interface FetchHtmlOptions {
  label?: string           // 에러 메시지 접두사 (예: 'Seek')
  acceptLanguage?: string  // 사이트별 언어 헤더 오버라이드
  retries?: number         // 추가 재시도 횟수 (기본 2 = 최대 3회 시도)
  browserFallback?: boolean // 봇 차단(403/429)으로 모두 실패 시 헤드리스 브라우저로 재시도
}

export async function fetchHtml(url: string, opts: FetchHtmlOptions = {}): Promise<string> {
  const { label = 'Fetch', acceptLanguage, retries = 2, browserFallback = false } = opts
  const headers = acceptLanguage
    ? { ...BROWSER_HEADERS, 'Accept-Language': acceptLanguage }
    : BROWSER_HEADERS

  let lastError = `${label} failed`
  let blocked = false // 마지막 실패가 봇 차단(403/429 등)이었는지

  for (let attempt = 0; attempt <= retries; attempt++) {
    if (attempt > 0) await sleep(400 * 2 ** (attempt - 1)) // 400ms, 800ms ...

    let res: Response
    try {
      res = await fetch(url, { headers })
    } catch (e) {
      lastError = `${label} fetch failed: ${String(e)}`
      continue // 네트워크 오류 → 재시도
    }

    if (res.ok) return res.text()

    lastError = `Fetch failed: ${res.status}`
    blocked = RETRYABLE.has(res.status)
    // 영구적 오류(404 등)는 즉시 실패, 일시적 차단만 재시도
    if (!blocked) break
  }

  // 봇 차단으로 모두 실패했고 폴백이 켜져 있으면 실제 브라우저로 재시도
  if (browserFallback && blocked) {
    try {
      const { fetchHtmlWithBrowser } = await import('./fetch-html-browser')
      return await fetchHtmlWithBrowser(url)
    } catch (e) {
      lastError = `${label} browser fallback failed: ${String(e)}`
    }
  }

  throw new Error(lastError)
}
