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

    // 동일한 Chromium 바이너리를 동시에 실행하면 ETXTBSY 발생 → 순차 실행
    const indeedResult = await scrapeIndeed().catch((e: unknown) => ({ error: String(e) }))
    const seekResult = await scrapeSeek().catch((e: unknown) => ({ error: String(e) }))

    return NextResponse.json({ ok: true, indeed: indeedResult, seek: seekResult })
  } catch (error) {
    console.error('Scrape error:', error)
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 })
  }
}
