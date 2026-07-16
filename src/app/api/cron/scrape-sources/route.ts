import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { scrapeSourceCore } from '@/lib/discover/scrape-source'
import type { AtsType } from '@/lib/discover/ats'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

// 한 번의 크론 실행에서 처리할 소스 상한 (300초 내 안전 완료 + AI 비용 제어)
const MAX_SOURCES_PER_RUN = 6
// 이보다 오래된 잠금은 죽은 실행의 잔재로 보고 회수한다
const LOCK_STALE_MS = 15 * 60 * 1000

// 공개 API 기반 ATS는 빠르고 안정적 — 헤드리스 브라우저·AI 추출이 필요한 generic보다 우선
const ATS_PRIORITY: Record<string, number> = {
  greenhouse: 0, lever: 0, ashby: 0, smartrecruiters: 0,
  apple: 1,
  generic: 2,
}

interface DueSource {
  id: string
  user_id: string
  url: string
  source_type: string
  consecutive_failures: number | null
  scrape_lock_at: string | null
  next_scrape_at: string | null
}

/**
 * 등록된 채용페이지(job_sources)의 백그라운드 자동 수집.
 * Vercel Cron이 매일 호출 — due(수집 예정 시각 경과 또는 미예약) 소스를
 * ATS 우선순위로 상한만큼 처리한다. 결과 스케줄/백오프는 scrapeSourceCore가 기록.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const nowIso = now.toISOString()

  const { data: candidates, error: queryError } = await supabaseAdmin
    .from('job_sources')
    .select('id, user_id, url, source_type, consecutive_failures, scrape_lock_at, next_scrape_at')
    .eq('auto_scrape_paused', false)
    .or(`next_scrape_at.is.null,next_scrape_at.lte.${nowIso}`)
    .limit(100)

  if (queryError) {
    return NextResponse.json({ ok: false, error: queryError.message }, { status: 500 })
  }

  // 살아있는 잠금(다른 실행이 처리 중)은 제외하고, ATS 우선 + 오래 기다린 순으로 정렬
  const due = (candidates ?? [])
    .filter((s: DueSource) => {
      if (!s.scrape_lock_at) return true
      return now.getTime() - new Date(s.scrape_lock_at).getTime() > LOCK_STALE_MS
    })
    .sort((a: DueSource, b: DueSource) => {
      const pa = ATS_PRIORITY[a.source_type] ?? 2
      const pb = ATS_PRIORITY[b.source_type] ?? 2
      if (pa !== pb) return pa - pb
      const ta = a.next_scrape_at ? new Date(a.next_scrape_at).getTime() : 0
      const tb = b.next_scrape_at ? new Date(b.next_scrape_at).getTime() : 0
      return ta - tb
    })
    .slice(0, MAX_SOURCES_PER_RUN)

  const results: { source: string; ok: boolean; detail: string }[] = []

  for (const source of due as DueSource[]) {
    // 잠금 획득 — 조건부 update로 다른 실행과의 이중 처리를 방지한다.
    // (같은 소스를 이미 잠근 실행이 있으면 filter가 0행 매치 → 건너뜀)
    const staleBefore = new Date(now.getTime() - LOCK_STALE_MS).toISOString()
    const { data: locked } = await supabaseAdmin
      .from('job_sources')
      .update({ scrape_lock_at: nowIso })
      .eq('id', source.id)
      .or(`scrape_lock_at.is.null,scrape_lock_at.lt.${staleBefore}`)
      .select('id')
    if (!locked?.length) {
      results.push({ source: source.url, ok: false, detail: 'locked by another run' })
      continue
    }

    // 소스 소유자의 매칭 프로파일 로드 (채점 기준)
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('skills, desired_positions, career_summary')
      .eq('id', source.user_id)
      .maybeSingle()

    if (!profile) {
      // 소유자 프로필이 없으면(탈퇴 등) 잠금만 해제하고 건너뜀
      await supabaseAdmin.from('job_sources').update({ scrape_lock_at: null }).eq('id', source.id)
      results.push({ source: source.url, ok: false, detail: 'profile not found' })
      continue
    }

    try {
      const result = await scrapeSourceCore(
        { id: source.id, user_id: source.user_id, url: source.url, source_type: source.source_type as AtsType },
        profile,
        { currentFailures: source.consecutive_failures ?? 0 }
      )
      results.push({
        source: source.url,
        ok: !result.error,
        detail: result.error ?? `found ${result.found}, added ${result.added}, scored ${result.scored}${result.fromCache ? ' (cache)' : ''}`,
      })
    } catch (e) {
      // scrapeSourceCore 내부에서 못 잡은 예외 — 잠금 해제 후 다음 소스로
      await supabaseAdmin.from('job_sources').update({ scrape_lock_at: null }).eq('id', source.id)
      results.push({ source: source.url, ok: false, detail: String(e) })
    }
  }

  return NextResponse.json({
    ok: true,
    dueTotal: candidates?.length ?? 0,
    processed: results.length,
    results,
  })
}
