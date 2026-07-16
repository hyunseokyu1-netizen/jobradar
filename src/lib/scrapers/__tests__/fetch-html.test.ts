import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// DNS는 항상 공개 IP로 풀리게 모킹 (SSRF 판정은 URL 정책 + fetch 모킹으로 재현)
vi.mock('node:dns/promises', () => ({
  lookup: vi.fn().mockResolvedValue([{ address: '104.16.0.1', family: 4 }]),
}))

const { fetchHtml, isBotBlockPage } = await import('@/lib/scrapers/fetch-html')

const realFetch = globalThis.fetch
const fetchMock = vi.fn()

beforeEach(() => {
  fetchMock.mockReset()
  globalThis.fetch = fetchMock as typeof fetch
})
afterEach(() => {
  globalThis.fetch = realFetch
})

const html = (body: string, init?: ResponseInit) =>
  new Response(body, { status: 200, headers: { 'content-type': 'text/html' }, ...init })

describe('fetchHtml — 리다이렉트 SSRF 가드', () => {
  it('공개 URL → 내부 주소 리다이렉트를 홉 검증에서 차단 (내부로 요청이 나가지 않음)', async () => {
    fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url.includes('evil.example.com')) {
        return new Response(null, { status: 302, headers: { location: 'http://169.254.169.254/latest/' } })
      }
      throw new Error(`unexpected fetch: ${url}`)
    })

    await expect(fetchHtml('https://evil.example.com/jobs', { retries: 0 })).rejects.toThrow()
    // 내부 주소로는 fetch 자체가 호출되지 않아야 한다
    const calledUrls = fetchMock.mock.calls.map(c => String(c[0]))
    expect(calledUrls.some(u => u.includes('169.254.169.254'))).toBe(false)
  })

  it('정상 공개 → 공개 리다이렉트는 따라간다', async () => {
    fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url.endsWith('/step1')) {
        return new Response(null, { status: 302, headers: { location: 'https://ok.example.com/final' } })
      }
      if (url.endsWith('/final')) return html('<html>FINAL</html>')
      throw new Error(`unexpected: ${url}`)
    })
    await expect(fetchHtml('https://ok.example.com/step1', { retries: 0 })).resolves.toContain('FINAL')
  })

  it('리다이렉트 루프는 최대 홉 초과로 실패하고 재시도하지 않는다', async () => {
    fetchMock.mockImplementation(async () =>
      new Response(null, { status: 302, headers: { location: 'https://loop.example.com/again' } })
    )
    await expect(fetchHtml('https://loop.example.com/start', { retries: 2 })).rejects.toThrow(/리다이렉트/)
    // 초기 1회 + 5홉 = 6회. UrlGuardError로 즉시 실패하므로 재시도로 늘어나면 안 됨
    expect(fetchMock.mock.calls.length).toBeLessThanOrEqual(6)
  })

  it('바이너리 Content-Type은 거부', async () => {
    fetchMock.mockResolvedValue(
      new Response('binary', { status: 200, headers: { 'content-type': 'application/octet-stream' } })
    )
    await expect(fetchHtml('https://ok.example.com/file', { retries: 0 })).rejects.toThrow(/지원하지 않는 응답 형식/)
  })

  it('404 등 영구 오류는 재시도 없이 즉시 실패', async () => {
    fetchMock.mockResolvedValue(new Response('nf', { status: 404 }))
    await expect(fetchHtml('https://ok.example.com/gone', { retries: 2 })).rejects.toThrow(/404/)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('503 일시 오류는 재시도한다', async () => {
    fetchMock
      .mockResolvedValueOnce(new Response('busy', { status: 503 }))
      .mockResolvedValueOnce(html('<html>OK</html>'))
    await expect(fetchHtml('https://ok.example.com/flaky', { retries: 1 })).resolves.toContain('OK')
    expect(fetchMock).toHaveBeenCalledTimes(2)
  }, 10_000)
})

describe('isBotBlockPage — 봇 차단 인터스티셜 판별', () => {
  it('Cloudflare 챌린지 제목 감지', () => {
    expect(isBotBlockPage('<html><title>Just a moment...</title></html>')).toBe(true)
    expect(isBotBlockPage('<html><title>Attention Required! | Cloudflare</title></html>')).toBe(true)
  })

  it('정상 채용 페이지는 통과', () => {
    expect(isBotBlockPage('<html><title>Careers at ABC</title><body>Backend Engineer</body></html>')).toBe(false)
  })
})
