// MatchDa 대시보드 실데이터 조회 (Supabase).
// 로그인 유저의 matches/jobs/tailored_resumes 를 칸반·요약 통계로 변환한다.
// 비로그인 시 null 을 반환해 호출부에서 목업 데모로 폴백한다.
// (이 모듈은 supabaseAdmin/쿠키에 접근하므로 서버 컴포넌트·액션에서만 import 할 것)
import { getAuthUserEmail, getOrCreateProfile } from '@/lib/auth-helpers'
import { supabaseAdmin } from '@/lib/supabase-admin'
import type {
  ApplicationStatus,
  DashboardSummary,
  JobCardData,
  KanbanColumn,
} from './types'

// 실제 matches.status → MatchDa 칸반 4컬럼 매핑
// (rejected / pass 는 보드에서 제외)
const STATUS_TO_COLUMN: Record<string, ApplicationStatus> = {
  new: 'preparing',
  interested: 'preparing',
  considering: 'preparing',
  applied: 'applied',
  interview: 'interview',
  accepted: 'offer',
}

const DOT: Record<ApplicationStatus, string> = {
  preparing: '#98A2B3',
  applied: '#1A56DB',
  interview: '#B45309',
  offer: '#046C4E',
}

// 회사명 → 머리글자 칩 색상 (결정적 해시로 회사마다 일관된 색)
const CHIP_COLORS = [
  '#1DB954', '#FF6F91', '#5C6AC4', '#00B14F',
  '#2F313D', '#046C4E', '#1A56DB', '#B45309',
]
function brandFor(company: string) {
  const name = company?.trim() ?? ''
  const initial = (name[0] ?? '?').toUpperCase()
  let h = 0
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) | 0
  const color = CHIP_COLORS[Math.abs(h) % CHIP_COLORS.length]
  return { initial, color }
}

const COLUMN_ORDER: ApplicationStatus[] = ['preparing', 'applied', 'interview', 'offer']

export interface MatchdaDashboardData {
  summary: DashboardSummary
  /** 실데이터 기반 stat 델타 (i18n 고정 델타 대체용) */
  deltas: string[]
  columns: KanbanColumn[]
}

/**
 * 로그인 유저의 실제 대시보드 데이터.
 * 비로그인/프로필 없음 → null (호출부에서 목업으로 폴백)
 */
export async function getMatchdaDashboard(): Promise<MatchdaDashboardData | null> {
  const email = await getAuthUserEmail()
  if (!email) return null
  const profile = await getOrCreateProfile(email)
  if (!profile) return null

  const { data: matchRows } = await supabaseAdmin
    .from('matches')
    .select('job_id, score, status, position')
    .eq('user_id', profile.id)
  const matches = matchRows ?? []

  const jobIds = matches.map((m) => m.job_id)
  const { data: jobRows } = jobIds.length
    ? await supabaseAdmin
        .from('jobs')
        .select('id, title, company, location, salary')
        .in('id', jobIds)
    : { data: [] as { id: string; title: string; company: string; location: string; salary: string | null }[] }
  const jobMap = new Map((jobRows ?? []).map((j) => [j.id, j]))

  // 컬럼 버킷 채우기 (position 오름차순, 없으면 점수 내림차순)
  const buckets: Record<ApplicationStatus, JobCardData[]> = {
    preparing: [], applied: [], interview: [], offer: [],
  }
  const sorted = [...matches].sort((a, b) => {
    const pa = a.position ?? Infinity
    const pb = b.position ?? Infinity
    if (pa !== pb) return pa - pb
    return (b.score ?? 0) - (a.score ?? 0)
  })
  for (const m of sorted) {
    const col = STATUS_TO_COLUMN[m.status as string]
    if (!col) continue
    const j = jobMap.get(m.job_id)
    if (!j) continue
    buckets[col].push({
      id: m.job_id,
      role: j.title || '제목 미정',
      company: j.company || '',
      brand: brandFor(j.company || ''),
      location: j.location || '',
      salary: j.salary || '—',
      matchRate: m.score ?? 0,
    })
  }
  const columns: KanbanColumn[] = COLUMN_ORDER.map((s) => ({
    status: s,
    dotColor: DOT[s],
    jobs: buckets[s],
  }))

  // ── 요약 통계 (실측값) ──
  const { count: tailoredCount } = await supabaseAdmin
    .from('tailored_resumes')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', profile.id)

  const saved = matches.length
  const interviewCount = matches.filter((m) => m.status === 'interview').length
  const activeCount = matches.filter((m) => m.status === 'applied' || m.status === 'interview').length
  const scored = matches.filter((m) => typeof m.score === 'number')
  const avg = scored.length
    ? Math.round(scored.reduce((s, m) => s + (m.score ?? 0), 0) / scored.length)
    : 0

  const userName = profile.name?.trim() || email.split('@')[0] || '회원'

  return {
    summary: {
      userName,
      stats: [String(tailoredCount ?? 0), String(saved), String(activeCount), `${avg}%`],
    },
    // 실데이터 델타 — 허구 수치 없이 실측으로만 구성
    deltas: [
      `이력서 ${tailoredCount ?? 0}건`,
      `매칭 ${scored.length}개`,
      `면접 ${interviewCount}건`,
      `${scored.length}건 기준`,
    ],
    columns,
  }
}
