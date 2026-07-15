// 공유 스크래핑 캐시 — 같은 채용페이지를 여러 유저가 수집할 때 재스크래핑을 생략한다.
// 캐시가 신선하면(TTL 내) DB에서 공고 목록을 읽고, 아니면 스크래핑 후 캐시를 갱신한다.
// 캐시 계층 장애(테이블 미생성 등)는 치명적이지 않아야 하므로 실패 시 직접 스크래핑으로 폴백.

import { supabaseAdmin } from '@/lib/supabase-admin'
import { scrapeJobSource, type AtsType, type DiscoveredPosting } from './ats'

// 채용공고 게시판은 하루에 몇 번 안 바뀐다 — 6시간이면 신선도와 절약의 균형점
const CACHE_TTL_MS = 6 * 60 * 60 * 1000

/** 같은 페이지가 유저마다 미세하게 다른 URL로 등록되지 않도록 정규화 (소문자 호스트, 끝 슬래시 제거) */
export function normalizeSourceUrl(url: string): string {
  try {
    const u = new URL(url.trim())
    u.hostname = u.hostname.toLowerCase()
    u.hash = ''
    let s = u.toString()
    if (s.endsWith('/')) s = s.slice(0, -1)
    return s
  } catch {
    return url.trim()
  }
}

export async function getPostingsWithCache(
  sourceUrl: string,
  sourceType: AtsType
): Promise<{ postings: DiscoveredPosting[]; fromCache: boolean }> {
  const key = normalizeSourceUrl(sourceUrl)

  // 1) 신선한 캐시가 있으면 그대로 사용 (스크래핑 생략)
  try {
    const { data: hit } = await supabaseAdmin
      .from('discover_scrape_cache')
      .select('postings, scraped_at')
      .eq('source_url', key)
      .maybeSingle()

    if (hit && Date.now() - new Date(hit.scraped_at).getTime() < CACHE_TTL_MS) {
      const cached = hit.postings as DiscoveredPosting[]
      if (Array.isArray(cached) && cached.length > 0) {
        return { postings: cached, fromCache: true }
      }
    }
  } catch (e) {
    console.error('Scrape cache read error (fallback to scrape):', e)
  }

  // 2) 캐시 미스/만료 → 실제 스크래핑
  const postings = await scrapeJobSource(sourceUrl, sourceType)

  // 3) 캐시 갱신 (베스트 에포트 — 실패해도 수집 결과는 반환)
  if (postings.length > 0) {
    try {
      await supabaseAdmin.from('discover_scrape_cache').upsert(
        {
          source_url: key,
          source_type: sourceType,
          postings,
          scraped_at: new Date().toISOString(),
        },
        { onConflict: 'source_url' }
      )
    } catch (e) {
      console.error('Scrape cache write error (non-fatal):', e)
    }
  }

  return { postings, fromCache: false }
}
