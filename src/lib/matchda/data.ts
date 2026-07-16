// MatchDa 대시보드 실데이터 조회 (Supabase).
// 로그인 유저의 matches/jobs/tailored_resumes 를 칸반·요약 통계로 변환한다.
// 비로그인 시 null 을 반환해 호출부에서 목업 데모로 폴백한다.
// (이 모듈은 supabaseAdmin/쿠키에 접근하므로 서버 컴포넌트·액션에서만 import 할 것)
import { getAuthUserEmail, getOrCreateProfile } from '@/lib/auth-helpers'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { normalizeResumeDesign } from './resume-design'
import { toStudioResume, contactLine, studioToDoc, type StudioResume } from '@/lib/resume'
import type {
  ApplicationStatus,
  DashboardSummary,
  JobCardData,
  KanbanColumn,
  ResumeDocumentData,
  ResumeWorkspaceData,
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
  /** 아직 AI 매칭 안 된 공고 수 (일괄 매칭 버튼용) */
  unmatchedCount: number
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
    .select('job_id, score, status, position, created_at')
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

  // 컬럼 버킷 채우기 — 최신 추가 순 (수동 정렬 position은 리스트 뷰 전용)
  const buckets: Record<ApplicationStatus, JobCardData[]> = {
    preparing: [], applied: [], interview: [], offer: [],
  }
  const sorted = [...matches].sort(
    (a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime()
  )
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
      status: m.status as string,
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
    unmatchedCount: matches.filter((m) => typeof m.score !== 'number').length,
  }
}

// ─────────────────────────────────────────────────────────────
// 워크스페이스 — 프로필의 구조화 이력서(onboarding_ko/en) ↔ 타깃 공고
// ─────────────────────────────────────────────────────────────

interface OnboardingExperience {
  company?: string
  position?: string
  period?: string
  description?: string
  hidden?: boolean // 이력서 스튜디오에서 "포함" 해제한 항목
}
interface OnboardingEducation {
  school?: string
  major?: string
  degree?: string
  period?: string
  hidden?: boolean
}
interface OnboardingResume {
  name?: string // 영문판(onboarding_en)은 로마자 표기
  phone?: string
  links?: string // 포트폴리오·GitHub 등 추가 연락처
  title?: string
  summary?: string
  skills?: string[]
  hidden_skills?: string[]
  experience?: OnboardingExperience[]
  education?: OnboardingEducation[]
  design?: unknown // 이력서 스튜디오 디자인 설정 (normalizeResumeDesign으로 정규화)
}

function expToBullets(description?: string) {
  return (description ?? '')
    .split('\n')
    .map((l) => l.replace(/^[-•\s]+/, '').trim())
    .filter(Boolean)
    .map((text) => ({ text }))
}

function buildDoc(
  resume: OnboardingResume,
  name: string,
  email: string,
  fallbackTitle: string
): ResumeDocumentData {
  // 스튜디오에서 "포함" 해제(hidden)한 항목·스킬은 문서에서 제외
  const exps = (resume.experience ?? []).filter((e) => !e.hidden)
  const edu = (resume.education ?? []).filter((e) => !e.hidden)
  const hiddenSkills = resume.hidden_skills ?? []
  return {
    // 이력서 데이터에 언어별 이름(영문판은 로마자)이 있으면 우선 사용
    name: resume.name?.trim() || name,
    title: resume.title || exps[0]?.position || fallbackTitle || '',
    contact: contactLine(email, resume.phone, resume.links),
    summary: resume.summary || undefined,
    experiences: exps.map((e) => ({
      org: [e.company, e.position].filter(Boolean).join(' — '),
      period: e.period ?? '',
      bullets: expToBullets(e.description),
    })),
    skills: (resume.skills ?? []).filter((s) => !hiddenSkills.includes(s)),
    education: edu.map((e) => ({
      org: [e.school, e.major || e.degree].filter(Boolean).join(' — '),
      period: e.period ?? '',
    })),
  }
}

/** 내 공고는 맞지만 구조화 이력서가 없어 연결이 필요한 상태 (목업 대신 연결 안내 렌더) */
export interface WorkspaceGate {
  gate: 'needs-resume'
  /** 업로드된 이력서 원문 존재 여부 — 있으면 "자동 연결" 버튼 노출 */
  hasResumeText: boolean
}

/**
 * 로그인 유저의 실제 이력서(한/영 구조화) + 타깃 공고로 워크스페이스 데이터 구성.
 * - 비로그인 / jobId 없음 / 내 공고 아님 → null (목업 데모 폴백)
 * - 내 공고인데 구조화 이력서(onboarding_en) 미작성 → WorkspaceGate (연결 안내)
 */
export async function getMatchdaWorkspace(
  jobId?: string
): Promise<ResumeWorkspaceData | WorkspaceGate | null> {
  if (!jobId) return null
  const email = await getAuthUserEmail()
  if (!email) return null
  const profile = await getOrCreateProfile(email)
  if (!profile) return null

  const ko = (profile.onboarding_ko ?? {}) as OnboardingResume
  const en = (profile.onboarding_en ?? {}) as OnboardingResume
  const hasEn = (en.experience?.length ?? 0) > 0 || (en.skills?.length ?? 0) > 0 || !!en.summary

  // 타깃 공고 (유저 소유 확인). select('*') 로 optimization 컬럼 유무에 안전하게 대응
  const { data: match } = await supabaseAdmin
    .from('matches')
    .select('*')
    .eq('user_id', profile.id)
    .eq('job_id', jobId)
    .maybeSingle()
  if (!match) return null

  // 내 공고는 맞는데 구조화 이력서가 없음 → 목업(가짜 이력서) 대신 연결 안내
  if (!hasEn) {
    return { gate: 'needs-resume', hasResumeText: !!profile.resume_text?.trim() }
  }

  const { data: job } = await supabaseAdmin
    .from('jobs')
    .select('title, company, location, description')
    .eq('id', jobId)
    .maybeSingle()
  if (!job) return null

  const matchRow = match as {
    score?: number
    score_type?: string | null
    memo?: string | null
    applied_resume_filename?: string | null
    applied_resume_text?: string | null
    applied_documents?: unknown
    applied_at?: string | null
    status?: string | null
  }

  const name = profile.name?.trim() || email.split('@')[0] || ''
  const koTitle = ko.experience?.[0]?.position || profile.desired_positions?.[0] || ''
  const enTitle = en.experience?.[0]?.position || ''

  // 공고 전용 초안(tailored_resumes) — 있으면 마스터 대신 이걸 편집 시작점으로 쓴다.
  // 워크스페이스에서 저장·번역해도 여기(공고별 행)에만 쓰이고 마스터(profiles.onboarding_*)는 건드리지 않는다.
  const { data: draft } = await supabaseAdmin
    .from('tailored_resumes')
    .select('content_ko, content_en, base_resume_synced_at')
    .eq('user_id', profile.id)
    .eq('job_id', jobId)
    .maybeSingle()

  const draftKo = (draft?.content_ko ?? null) as StudioResume | null
  const draftEn = (draft?.content_en ?? null) as StudioResume | null
  const hasJobDraft = !!draftKo
  // resume_updated_at(마스터 이력서 실제 변경 시각)로만 비교 — profiles.updated_at은 매칭 설정
  // 등 이력서와 무관한 변경에도 갱신되므로 여기 쓰면 배너가 잘못 뜬다(오탐).
  const resumeUpdatedAt = profile.resume_updated_at as string | null | undefined
  const masterChanged =
    hasJobDraft && !!draft?.base_resume_synced_at && !!resumeUpdatedAt
      ? new Date(resumeUpdatedAt).getTime() > new Date(draft.base_resume_synced_at).getTime()
      : false

  const koStudio = draftKo ?? toStudioResume(profile.onboarding_ko, name, (profile.phone as string) ?? '')
  const translated = draftEn
    ? studioToDoc(draftEn, profile.email ?? '')
    : buildDoc(en, name, profile.email ?? '', enTitle)

  // 공고별 AI 최적화 결과(캐시) 적용 — 하이라이트 + 최적화 노트
  const opt = (match as { optimization?: unknown }).optimization as
    | { highlights?: string[]; note?: { keyword?: string; body?: string } | null }
    | null
    | undefined
  const highlights = opt?.highlights ?? []
  if (highlights.length) {
    for (const exp of translated.experiences) {
      for (const b of exp.bullets) {
        const hits = highlights.filter((h) => b.text.includes(h))
        if (hits.length) b.highlights = hits
      }
    }
  }
  const optimizationNote =
    opt?.note?.keyword && opt?.note?.body
      ? { company: job.company || '', keyword: opt.note.keyword, body: opt.note.body }
      : undefined
  const optimized = highlights.length > 0 || !!optimizationNote

  return {
    docTitle: enTitle || koTitle || (job.title ?? ''),
    email: profile.email ?? '',
    target: {
      company: job.company || '',
      role: job.title || '',
      location: job.location || '',
      brand: brandFor(job.company || ''),
    },
    // null 유지 — 분석 실패·미채점을 0점(실제 판정)으로 뭉개지 않는다
    matchRate: match.score ?? null,
    matchScoreType: matchRow.score_type ?? null,
    // 최적화 분석 완료 시 맞춤본(하이라이트·노트 표시), 아니면 일반 이력서 비교
    tailored: optimized,
    optimizable: !optimized, // 아직 분석 전이면 생성 버튼 노출
    optimizationNote,
    original: buildDoc(ko, name, profile.email ?? '', koTitle),
    translated,
    jobExtra: {
      description: job.description ?? null,
      memo: matchRow.memo ?? null,
      appliedResumeFilename: matchRow.applied_resume_filename ?? null,
      appliedResumeText: matchRow.applied_resume_text ?? null,
      appliedDocuments: Array.isArray(matchRow.applied_documents)
        ? (matchRow.applied_documents as import('@/lib/applied-documents').AppliedDocument[])
        : [],
      location: job.location ?? null,
      appliedAt: matchRow.applied_at ?? null,
      status: matchRow.status ?? null,
    },
    // 스튜디오 디자인 설정 (ko에 저장, 한/영 문서 공통 적용)
    design: ko.design ? normalizeResumeDesign(ko.design) : undefined,
    // 편집·AI 수정·다운로드용 구조화 이력서 — 공고별 초안이 있으면 그것, 없으면 마스터
    koStudio,
    enStudio: toStudioResume(profile.onboarding_en, name, (profile.phone as string) ?? ''),
    hasJobDraft,
    masterChanged,
  }
}

// ── 공개 후기 (랜딩 후기 섹션용) ──────────────────────────────
export interface PublicTestimonial {
  rating: number
  content: string
  name: string
}

/**
 * 공개 게재에 동의(allow_public)한 후기 중 별점 4점 이상, 본문 있는 것만.
 * 랜딩은 공개 페이지이므로 이메일 등 개인정보는 절대 포함하지 않는다 (display_name만).
 */
export async function getPublicTestimonials(limit = 6): Promise<PublicTestimonial[]> {
  try {
    const { data } = await supabaseAdmin
      .from('user_feedback')
      .select('rating, content, display_name')
      .eq('allow_public', true)
      .gte('rating', 4)
      .neq('content', '')
      .order('updated_at', { ascending: false })
      .limit(limit)

    return (data ?? [])
      .filter(r => (r.content ?? '').trim().length >= 10)
      .map(r => ({
        rating: r.rating,
        content: r.content.trim(),
        name: (r.display_name ?? '').trim() || '매치다 사용자',
      }))
  } catch (e) {
    // 후기 조회 실패가 랜딩 렌더를 막으면 안 된다 — 빈 배열이면 호출부가 예시로 폴백
    console.error('Public testimonials fetch error:', e)
    return []
  }
}
