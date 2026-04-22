import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { runMatching } = await import('@/lib/matching')
  const result = await runMatching()

  return NextResponse.json({ ok: true, ...result })
}

// 특정 job만 매칭 (잡 상세 페이지에서 개별 호출용)
export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { jobId } = await request.json()
  if (!jobId) return NextResponse.json({ error: 'jobId required' }, { status: 400 })

  const { matchJob } = await import('@/lib/matching')
  const result = await matchJob(jobId)

  return NextResponse.json({ ok: true, ...result })
}
