import { NextResponse } from 'next/server'
import { scrapeIndeed } from '@/lib/scrapers/indeed'

// Vercel Cron 또는 수동 호출용
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await scrapeIndeed()
    return NextResponse.json({ ok: true, ...result })
  } catch (error) {
    console.error('Scrape error:', error)
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 })
  }
}
