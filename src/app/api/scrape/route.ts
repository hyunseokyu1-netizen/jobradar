import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
// Vercel Pro 최대 300s, Hobby 최대 60s
export const maxDuration = 300

// Vercel Cron 또는 수동 호출용
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { scrapeIndeed } = await import('@/lib/scrapers/indeed')
    const { scrapeSeek } = await import('@/lib/scrapers/seek')
    const [indeed, seek] = await Promise.allSettled([scrapeIndeed(), scrapeSeek()])

    return NextResponse.json({
      ok: true,
      indeed: indeed.status === 'fulfilled' ? indeed.value : { error: String(indeed.reason) },
      seek: seek.status === 'fulfilled' ? seek.value : { error: String(seek.reason) },
    })
  } catch (error) {
    console.error('Scrape error:', error)
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 })
  }
}
