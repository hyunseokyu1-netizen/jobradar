import { describe, it, expect, vi } from 'vitest'

// scrape-cache는 supabaseAdmin을 import하므로 모킹 (normalizeSourceUrl만 테스트)
vi.mock('@/lib/supabase-admin', () => ({ supabaseAdmin: {} }))

const { normalizeSourceUrl } = await import('@/lib/discover/scrape-cache')

describe('normalizeSourceUrl — 공유 캐시 키 정규화', () => {
  it('호스트 대소문자·끝 슬래시를 정규화해 같은 페이지가 같은 키가 된다', () => {
    expect(normalizeSourceUrl('https://Jobs.Lever.co/spotify/')).toBe(
      normalizeSourceUrl('https://jobs.lever.co/spotify')
    )
  })

  it('해시 프래그먼트 제거', () => {
    expect(normalizeSourceUrl('https://a.com/jobs#section')).toBe(normalizeSourceUrl('https://a.com/jobs'))
  })

  it('쿼리 파라미터는 보존 (Apple ?search=키워드 등 의미 있는 구분)', () => {
    expect(normalizeSourceUrl('https://jobs.apple.com/en-us/search?search=data')).not.toBe(
      normalizeSourceUrl('https://jobs.apple.com/en-us/search?search=ios')
    )
  })

  it('파싱 불가 문자열은 trim만 하고 원본 유지', () => {
    expect(normalizeSourceUrl('  not-a-url  ')).toBe('not-a-url')
  })
})
