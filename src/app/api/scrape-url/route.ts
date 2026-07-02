import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { scrapeSeekUrl } from '@/lib/scrapers/seek-url'
import { scrapeIndeedUrl } from '@/lib/scrapers/indeed-url'
import { scrapeGenericUrl } from '@/lib/scrapers/generic-url'
import { parseGlassdoorUrl } from '@/lib/scrapers/glassdoor-url'
import { scrapeAppleUrl } from '@/lib/scrapers/apple-url'
import { scrapeJobViaReader } from '@/lib/scrapers/reader'
import type { Platform } from '@/lib/detect-platform'

export const dynamic = 'force-dynamic'
// 리더 프록시 우회(최대 45초) + Haiku 추출까지 감안한 상한
export const maxDuration = 90

export async function POST(request: Request) {
  const { jobId } = await request.json()
  if (!jobId) return NextResponse.json({ error: 'jobId required' }, { status: 400 })

  const { data: job } = await supabaseAdmin
    .from('jobs')
    .select('id, url, source, title, description')
    .eq('id', jobId)
    .single()

  if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 })

  try {
    const source = job.source as Platform
    let scraped
    try {
      scraped =
        source === 'seek'      ? await scrapeSeekUrl(job.url) :
        source === 'indeed'    ? await scrapeIndeedUrl(job.url) :
        source === 'glassdoor' ? parseGlassdoorUrl(job.url) :
        source === 'apple'     ? await scrapeAppleUrl(job.url) :
                                 await scrapeGenericUrl(job.url)
    } catch (directError) {
      // 직접 fetch가 봇 차단(403/429, Cloudflare 등)으로 실패 →
      // 리더 프록시(r.jina.ai)로 우회해 마크다운을 받아 AI로 추출
      console.warn(`[scrape-url] 직접 수집 실패, 리더 프록시로 우회: ${job.url} — ${String(directError)}`)
      scraped = await scrapeJobViaReader(job.url)
    }

    await supabaseAdmin
      .from('jobs')
      .update({
        title: scraped.title,
        company: scraped.company,
        location: scraped.location,
        salary: scraped.salary,
        // 리더 폴백이 제목만 건진 경우(빈 JD), 기존/수동 입력 JD를 지우지 않는다
        description: scraped.description || job.description || null,
        posted_at: scraped.posted_at,
        scraped_at: new Date().toISOString(),
      })
      .eq('id', job.id)

    return NextResponse.json({ ok: true, title: scraped.title })
  } catch (e) {
    const errMsg = String(e)
    console.error(`[scrape-url] ${job.url}:`, errMsg)

    // 이전에 정상 스크래핑된 적이 있으면(= 진짜 제목 보유) 기존 데이터를 보존한다.
    // 간헐적 403/429 재스크래핑이 잘 수집된 공고를 덮어쓰지 않도록 방지.
    const neverScraped = job.title === '스크래핑 대기 중...' || job.title === '스크래핑 실패'
    if (neverScraped) {
      await supabaseAdmin
        .from('jobs')
        .update({ title: '스크래핑 실패', description: errMsg })
        .eq('id', job.id)
    }

    return NextResponse.json({ error: errMsg }, { status: 500 })
  }
}
