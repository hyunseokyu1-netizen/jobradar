import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { scrapeSeekUrl } from '@/lib/scrapers/seek-url'
import { scrapeIndeedUrl } from '@/lib/scrapers/indeed-url'
import { scrapeGenericUrl } from '@/lib/scrapers/generic-url'
import type { Platform } from '@/lib/detect-platform'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

export async function POST(request: Request) {
  const { jobId } = await request.json()
  if (!jobId) return NextResponse.json({ error: 'jobId required' }, { status: 400 })

  const { data: job } = await supabaseAdmin
    .from('jobs')
    .select('id, url, source')
    .eq('id', jobId)
    .single()

  if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 })

  try {
    const source = job.source as Platform
    const scraped =
      source === 'seek'    ? await scrapeSeekUrl(job.url) :
      source === 'indeed'  ? await scrapeIndeedUrl(job.url) :
                             await scrapeGenericUrl(job.url)

    await supabaseAdmin
      .from('jobs')
      .update({
        title: scraped.title,
        company: scraped.company,
        location: scraped.location,
        salary: scraped.salary,
        description: scraped.description,
        posted_at: scraped.posted_at,
        scraped_at: new Date().toISOString(),
      })
      .eq('id', job.id)

    return NextResponse.json({ ok: true, title: scraped.title })
  } catch (e) {
    await supabaseAdmin
      .from('jobs')
      .update({ title: '스크래핑 실패' })
      .eq('id', job.id)

    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
