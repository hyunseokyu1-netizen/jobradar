import { anthropic, textOf } from '@/lib/claude'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getAuthUserEmail, getOrCreateProfile } from '@/lib/auth-helpers'

/** 점수 근거 — jd_analysis: JD 전문 기반 정밀 분석 / title_estimate: 제목·회사만으로 추정(신뢰도 낮음) */
export type ScoreType = 'jd_analysis' | 'title_estimate'

interface MatchResult {
  /** null = 분석 실패 (0점과 구분 — 0은 "무관한 직무"라는 실제 판정) */
  score: number | null
  reason: string
  highlights: string[]
}

// 모델 응답을 신뢰하지 않고 범위·타입을 강제한다
function clampScore(v: unknown): number | null {
  const n = Number(v)
  if (!Number.isFinite(n)) return null
  return Math.max(0, Math.min(100, Math.round(n)))
}

async function analyzeMatch(
  jd: string,
  profile: {
    name: string | null
    skills: string[] | null
    desired_positions: string[] | null
    career_summary: string | null
    preferences: { salary_min?: number; salary_max?: number; salary_currency?: string } | null
  }
): Promise<MatchResult> {
  const currency = profile.preferences?.salary_currency ?? 'USD'
  const prompt = `당신은 채용 매칭 전문가입니다. 아래 채용공고(JD)와 후보자 프로파일을 분석하여 매칭 점수를 평가해주세요.

## 후보자 프로파일
- 이름: ${profile.name ?? '미입력'}
- 스킬: ${profile.skills?.join(', ') ?? '미입력'}
- 목표 포지션: ${profile.desired_positions?.join(', ') ?? '미입력'}
- 경력 요약: ${profile.career_summary ?? '미입력'}
- 희망 연봉: ${profile.preferences?.salary_min ?? '?'} ~ ${profile.preferences?.salary_max ?? '?'} ${currency}

## 채용공고 (JD)
${jd.slice(0, 3000)}

## 평가 기준
1. 필수 기술 스택 일치도
2. 경력 수준 적합도
3. 포지션 목표와의 연관성
4. 연봉 범위 적합도 (JD에 명시된 경우)

아래 JSON 형식으로만 응답하세요. 다른 텍스트는 포함하지 마세요:
{
  "score": 0~100 사이 정수,
  "reason": "2~3문장으로 매칭 이유 설명 (한국어)",
  "highlights": ["핵심 매칭 포인트 1", "핵심 매칭 포인트 2", "핵심 매칭 포인트 3"]
}`

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 500,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = textOf(message)

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON found')
    const parsed = JSON.parse(jsonMatch[0]) as { score?: unknown; reason?: unknown; highlights?: unknown }
    const score = clampScore(parsed.score)
    if (score === null) throw new Error('Invalid score in response')
    return {
      score,
      reason: typeof parsed.reason === 'string' ? parsed.reason : '',
      highlights: Array.isArray(parsed.highlights)
        ? parsed.highlights.filter((h): h is string => typeof h === 'string').slice(0, 5)
        : [],
    }
  } catch {
    // 실패는 0점이 아니라 미채점(null) — UI에서 "분석 실패, 다시 시도"로 구분 표시
    return { score: null, reason: '분석 실패 — 다시 시도해주세요.', highlights: [] }
  }
}

export async function matchJob(jobId: string) {
  const { data: job } = await supabaseAdmin
    .from('jobs')
    .select('*')
    .eq('id', jobId)
    .single()

  if (!job) return { error: 'Job not found' }

  const email = await getAuthUserEmail()
  if (!email) return { error: '로그인이 필요합니다.' }

  const profile = await getOrCreateProfile(email)
  if (!profile) return { error: 'Profile not found' }

  // JD 전문이 있으면 정밀 분석, 없으면 제목·회사만으로 추정 (점수 신뢰도가 다르므로 기록)
  const hasJd = !!job.description?.trim()
  const scoreType: ScoreType = hasJd ? 'jd_analysis' : 'title_estimate'
  const jd = job.description ?? `${job.title} at ${job.company}. Location: ${job.location}`
  const result = await analyzeMatch(jd, profile)

  // 기존 status 유지 (재매칭 시 사용자가 설정한 상태 덮어쓰지 않음)
  const { data: existing } = await supabaseAdmin
    .from('matches')
    .select('status')
    .eq('user_id', profile.id)
    .eq('job_id', job.id)
    .single()

  await supabaseAdmin.from('matches').upsert({
    user_id: profile.id,
    job_id: job.id,
    score: result.score,
    score_type: result.score !== null ? scoreType : null,
    reason: result.reason,
    highlights: result.highlights,
    status: existing?.status ?? 'new',
  }, { onConflict: 'user_id,job_id' })

  // 분석 실패(null) 시 scoreType도 반환하지 않는다 — DB 저장(위)과 일관되게
  return { jobId, score: result.score, scoreType: result.score !== null ? scoreType : undefined, reason: result.reason }
}

export async function runMatching() {
  const email = await getAuthUserEmail()
  if (!email) return { error: '로그인이 필요합니다.', matched: 0 }

  const profile = await getOrCreateProfile(email)
  if (!profile) return { error: 'Profile not found', matched: 0 }

  // 아직 매칭 안 된 최신 공고 최대 5개 (서버 액션 30초 타임아웃 대응)
  const { data: jobs } = await supabaseAdmin
    .from('jobs')
    .select('id, title, company, location, description')
    .order('scraped_at', { ascending: false })
    .limit(5)

  if (!jobs?.length) return { matched: 0, skipped: 0 }

  // 이미 매칭된 job_id 목록
  const { data: existing } = await supabaseAdmin
    .from('matches')
    .select('job_id')
    .eq('user_id', profile.id)

  const matchedIds = new Set(existing?.map(m => m.job_id) ?? [])
  const unmatched = jobs.filter(j => !matchedIds.has(j.id))

  let matched = 0
  let errors = 0
  let firstError = ''

  for (const job of unmatched) {
    try {
      const hasJd = !!job.description?.trim()
      const jd = job.description ?? `${job.title} at ${job.company}`
      const result = await analyzeMatch(jd, profile)

      await supabaseAdmin.from('matches').upsert({
        user_id: profile.id,
        job_id: job.id,
        score: result.score,
        score_type: result.score !== null ? (hasJd ? 'jd_analysis' : 'title_estimate') : null,
        reason: result.reason,
        highlights: result.highlights,
        status: 'new',  // 배치 매칭은 신규 공고만 대상이므로 항상 new
      }, { onConflict: 'user_id,job_id' })

      matched++
    } catch (e) {
      errors++
      if (!firstError) firstError = String(e)
      console.error(`[matching] job ${job.id} failed:`, e)
      // 실패는 미채점(null)으로 저장 — 0점(실제 판정)과 섞이지 않게 한다
      await supabaseAdmin.from('matches').upsert({
        user_id: profile.id,
        job_id: job.id,
        score: null,
        score_type: null,
        reason: `매칭 실패: ${String(e).slice(0, 200)}`,
        highlights: [],
        status: 'new',
      }, { onConflict: 'user_id,job_id' })
    }
  }

  return { matched, skipped: matchedIds.size, errors, firstError }
}
