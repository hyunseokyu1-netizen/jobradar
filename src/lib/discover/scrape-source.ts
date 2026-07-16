// 채용페이지 소스 1개를 수집·채점해 discovered_jobs에 반영하는 핵심 로직.
// 수동 수집(서버 액션 scrapeSourceAction)과 백그라운드 크론이 공유한다.
// 인증·소유권 확인은 호출부 책임 — 여기서는 전달받은 source/profile을 신뢰한다.

import { supabaseAdmin } from '@/lib/supabase-admin'
import { getPostingsWithCache } from './scrape-cache'
import { prefilterPostings, scorePostings } from './scoring'
import type { AtsType } from './ats'

// 한 번의 수집에서 Haiku 채점할 신규 공고 상한 (비용 제어)
const MAX_SCORED_PER_SCRAPE = 50

// 자동 수집 주기·백오프 정책
const SCRAPE_INTERVAL_MS = 24 * 60 * 60 * 1000       // 성공 시 다음 수집: 24시간 뒤
const MAX_BACKOFF_MS = 7 * 24 * 60 * 60 * 1000        // 실패 백오프 상한: 7일
export const PAUSE_AFTER_FAILURES = 5                  // 연속 실패 5회면 자동 수집 일시중지

export interface ScrapeSourceInput {
  id: string
  user_id: string
  url: string
  source_type: AtsType
}

export interface ScrapeProfile {
  skills: string[] | null
  desired_positions: string[] | null
  career_summary: string | null
}

export interface ScrapeSourceResult {
  found?: number
  added?: number
  scored?: number
  fromCache?: boolean
  error?: string
}

/** 실패 횟수 기준 다음 재시도 시각 (24h → 48h → 96h → … 최대 7일) */
function backoffUntil(failures: number): string {
  const delay = Math.min(SCRAPE_INTERVAL_MS * 2 ** Math.max(0, failures - 1), MAX_BACKOFF_MS)
  return new Date(Date.now() + delay).toISOString()
}

/**
 * 소스 수집 실행 + job_sources 스케줄 상태 갱신.
 * 성공: last_scraped_at 갱신, 실패 카운터 리셋, 다음 수집 24시간 뒤 예약.
 * 실패: last_scrape_error 기록, 지수 백오프, 연속 5회면 자동 수집 일시중지.
 */
export async function scrapeSourceCore(
  source: ScrapeSourceInput,
  profile: ScrapeProfile,
  opts: { currentFailures?: number } = {}
): Promise<ScrapeSourceResult> {
  let postings
  let fromCache = false
  try {
    ;({ postings, fromCache } = await getPostingsWithCache(source.url, source.source_type))
  } catch (e) {
    const failures = (opts.currentFailures ?? 0) + 1
    const message = `수집 실패: ${String(e)}`
    await supabaseAdmin
      .from('job_sources')
      .update({
        last_scrape_error: message,
        consecutive_failures: failures,
        next_scrape_at: backoffUntil(failures),
        auto_scrape_paused: failures >= PAUSE_AFTER_FAILURES,
        scrape_lock_at: null,
      })
      .eq('id', source.id)
      .eq('user_id', source.user_id)
    return { error: message }
  }

  // 성공 시 공통 갱신값 — 실패 카운터 리셋 + 다음 자동 수집 예약 + 잠금 해제
  const successPatch = {
    last_scraped_at: new Date().toISOString(),
    last_scrape_error: null,
    consecutive_failures: 0,
    next_scrape_at: new Date(Date.now() + SCRAPE_INTERVAL_MS).toISOString(),
    auto_scrape_paused: false,
    scrape_lock_at: null,
  }

  if (postings.length === 0) {
    await supabaseAdmin
      .from('job_sources')
      .update(successPatch)
      .eq('id', source.id)
      .eq('user_id', source.user_id)
    return { found: 0, added: 0, scored: 0, fromCache }
  }

  // 이미 수집된 URL은 제외 (재채점 방지)
  const { data: existing } = await supabaseAdmin
    .from('discovered_jobs')
    .select('url')
    .eq('user_id', source.user_id)
    .in('url', postings.map(p => p.url))

  const existingUrls = new Set((existing ?? []).map(e => e.url))
  const fresh = postings.filter(p => !existingUrls.has(p.url))

  // 1단계: 키워드 프리필터 (무료) → 2단계: Haiku 배치 채점
  const { passed, filtered } = prefilterPostings(fresh, profile)
  const toScore = passed.slice(0, MAX_SCORED_PER_SCRAPE)
  const overflow = passed.slice(MAX_SCORED_PER_SCRAPE)

  let scored
  try {
    scored = await scorePostings(toScore, profile)
  } catch (e) {
    // 수집 자체는 성공했으므로 실패 백오프는 걸지 않되, 잠금은 해제하고 채점 오류만 알린다
    await supabaseAdmin
      .from('job_sources')
      .update({ scrape_lock_at: null })
      .eq('id', source.id)
      .eq('user_id', source.user_id)
    return { error: `매칭 채점 실패: ${String(e)}` }
  }

  const rows = [
    ...scored.map(p => ({
      user_id: source.user_id,
      source_id: source.id,
      title: p.title,
      url: p.url,
      location: p.location ?? null,
      department: p.department ?? null,
      match_score: p.score,
      match_reason: p.reason,
      status: 'new',
    })),
    // 프리필터 탈락·상한 초과분은 점수 없이 저장 (다음 수집 때 중복 채점 방지)
    ...[...overflow, ...filtered].map(p => ({
      user_id: source.user_id,
      source_id: source.id,
      title: p.title,
      url: p.url,
      location: p.location ?? null,
      department: p.department ?? null,
      match_score: null,
      match_reason: null,
      status: 'new',
    })),
  ]

  if (rows.length > 0) {
    const { error: insertError } = await supabaseAdmin
      .from('discovered_jobs')
      .upsert(rows, { onConflict: 'user_id,url', ignoreDuplicates: true })
    if (insertError) return { error: insertError.message }
  }

  await supabaseAdmin
    .from('job_sources')
    .update(successPatch)
    .eq('id', source.id)
    .eq('user_id', source.user_id)

  return { found: postings.length, added: fresh.length, scored: scored.length, fromCache }
}
