'use server'

import { textOf } from '@/lib/claude'
import { revalidatePath } from 'next/cache'
import { runMatching } from '@/lib/matching'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { detectPlatform } from '@/lib/detect-platform'
import { getAuthUserEmail, getOrCreateProfile } from '@/lib/auth-helpers'
import { parseResumeFile } from '@/lib/resume-parser'
import { planOf, billingEnabled, FREE_LIMITS } from '@/lib/plan'

export async function triggerMatching() {
  try {
    const result = await runMatching()
    return result
  } catch (e) {
    return { error: String(e), matched: 0, errors: 0, firstError: '' }
  }
}

export async function generateCoverLetter(jobId: string): Promise<{ content?: string; error?: string }> {
  const email = await getAuthUserEmail()
  if (!email) return { error: '로그인이 필요합니다.' }

  const { data: job } = await supabaseAdmin
    .from('jobs')
    .select('title, company, location, description')
    .eq('id', jobId)
    .single()

  if (!job) return { error: 'Job not found' }

  const profile = await getOrCreateProfile(email)
  if (!profile) return { error: 'Profile not found' }

  const { anthropic } = await import('@/lib/claude')

  const resumeSection = profile.resume_text
    ? `\n\n## 이력서 전문\n${profile.resume_text.slice(0, 3000)}`
    : ''

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1000,
    messages: [{
      role: 'user',
      content: `당신은 전문 커버레터 작성 전문가입니다. 아래 정보를 바탕으로 채용 커버레터를 영어로 작성해주세요.

## 지원자 정보
- 이름: ${profile.name ?? ''}
- 스킬: ${profile.skills?.join(', ') ?? ''}
- 경력 요약: ${profile.career_summary ?? ''}${resumeSection}

## 지원 포지션
- 직책: ${job.title}
- 회사: ${job.company}
- 위치: ${job.location ?? ''}

## 채용공고 (JD)
${(job.description ?? `${job.title} at ${job.company}`).slice(0, 2000)}

## 작성 요구사항
- 3단락 구성, 300단어 이내
- 1단락: 지원 동기 + 핵심 강점
- 2단락: JD 요구사항과 내 경험 연결 (구체적 사례)
- 3단락: 기여 의지 + 마무리
- "I am writing to apply for..." 같은 진부한 표현 금지
- 자연스럽고 자신감 있는 톤
- 본문만 작성 (Dear/Sincerely 등 형식 포함)`,
    }],
  })

  const content = textOf(message)

  await supabaseAdmin.from('cover_letters').upsert({
    user_id: profile.id,
    job_id: jobId,
    content,
  }, { onConflict: 'user_id,job_id' })

  return { content }
}

export async function getCoverLetter(jobId: string): Promise<{ content?: string }> {
  const email = await getAuthUserEmail()
  if (!email) return {}

  const profile = await getOrCreateProfile(email)
  if (!profile) return {}

  const { data } = await supabaseAdmin
    .from('cover_letters')
    .select('content')
    .eq('job_id', jobId)
    .eq('user_id', profile.id)
    .single()
  return { content: data?.content ?? undefined }
}

export async function saveCoverLetter(jobId: string, content: string): Promise<{ error?: string }> {
  const email = await getAuthUserEmail()
  if (!email) return { error: '로그인이 필요합니다.' }

  const profile = await getOrCreateProfile(email)
  if (!profile) return { error: 'Profile not found' }

  const { error } = await supabaseAdmin
    .from('cover_letters')
    .upsert({ user_id: profile.id, job_id: jobId, content }, { onConflict: 'user_id,job_id' })
  if (error) return { error: error.message }
  return {}
}

export async function reviewCoverLetter(jobId: string, content: string): Promise<{ content?: string; error?: string }> {
  const email = await getAuthUserEmail()
  if (!email) return { error: '로그인이 필요합니다.' }

  const profile = await getOrCreateProfile(email)
  if (!profile) return { error: 'Profile not found' }

  const { data: job } = await supabaseAdmin
    .from('jobs')
    .select('title, company, description')
    .eq('id', jobId)
    .single()

  if (!job) return { error: 'Job not found' }

  const { anthropic } = await import('@/lib/claude')

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1000,
    messages: [{
      role: 'user',
      content: `아래는 ${job.title} at ${job.company} 포지션에 지원하기 위해 작성한 커버레터입니다.
내용과 구조는 최대한 유지하면서, 어색한 표현이나 반복, 어법 오류를 다듬어주세요.
개선된 버전만 출력해주세요.

## 현재 커버레터
${content}`,
    }],
  })

  const reviewed = textOf(message) || content

  await supabaseAdmin.from('cover_letters').upsert(
    { user_id: profile.id, job_id: jobId, content: reviewed },
    { onConflict: 'user_id,job_id' }
  )

  return { content: reviewed }
}

export async function translateCoverLetter(content: string): Promise<{ translation?: string; error?: string }> {
  const email = await getAuthUserEmail()
  if (!email) return { error: '로그인이 필요합니다.' }

  const { anthropic } = await import('@/lib/claude')

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1500,
    messages: [{
      role: 'user',
      content: `아래 영문 커버레터를 자연스러운 한국어로 번역해주세요. 번역문만 출력하고 다른 설명은 쓰지 마세요.\n\n${content}`,
    }],
  })

  const translation = textOf(message)
  return { translation }
}

// ── RAG 검색 헬퍼 ────────────────────────────────────────────
// JD에서 핵심 키워드 추출 (불용어 제거, 소문자)
const RAG_STOPWORDS = new Set([
  'the', 'and', 'for', 'with', 'you', 'our', 'are', 'will', 'that', 'this', 'have', 'has',
  'from', 'your', 'who', 'all', 'any', 'can', 'not', 'but', 'they', 'their', 'been', 'were',
  'about', 'into', 'more', 'other', 'such', 'than', 'then', 'them', 'these', 'those', 'work',
  'role', 'team', 'job', 'per', 'via', 'etc', 'a', 'an', 'to', 'of', 'in', 'on', 'as', 'at', 'is', 'be', 'or', 'we',
])
function ragKeywords(text: string): Set<string> {
  const words = text.toLowerCase().match(/[a-z][a-z+#.-]{2,}/g) ?? []
  return new Set(words.filter(w => !RAG_STOPWORDS.has(w)))
}
function ragScore(text: string, kws: Set<string>): number {
  const words = text.toLowerCase().match(/[a-z][a-z+#.-]{2,}/g) ?? []
  let s = 0
  for (const w of words) if (kws.has(w)) s++
  return s
}

/**
 * RAG 검색: 사용자의 과거 맞춤 이력서 코퍼스에서 이번 JD에 가장 관련된 항목을 골라
 * 표현·강조 참고용 컨텍스트로 반환한다. (현재 공고는 제외, 상위 3건)
 */
async function retrievePastResumes(profileId: string, jobId: string, jd: string): Promise<string> {
  const { data: past } = await supabaseAdmin
    .from('tailored_resumes')
    .select('job_id, content')
    .eq('user_id', profileId)
    .neq('job_id', jobId)
    .not('content', 'is', null)
    .limit(30)
  if (!past?.length) return ''

  // 관련 공고 제목 매핑
  const jobIds = past.map(p => p.job_id)
  const { data: jobRows } = await supabaseAdmin
    .from('jobs')
    .select('id, title, company')
    .in('id', jobIds)
  const titleMap = new Map((jobRows ?? []).map(j => [j.id, `${j.title}${j.company ? ` @ ${j.company}` : ''}`]))

  const kws = ragKeywords(jd)
  const ranked = past
    .map(p => ({ ...p, score: ragScore(p.content ?? '', kws) }))
    .sort((a, b) => b.score - a.score)
    .filter(p => p.score > 0)
    .slice(0, 3)
  if (!ranked.length) return ''

  return ranked
    .map((p, i) => `### 참고 이력서 ${i + 1} — 유사 공고 "${titleMap.get(p.job_id) ?? '이전 공고'}"에 작성했던 버전\n${(p.content ?? '').slice(0, 2500)}`)
    .join('\n\n')
}

// onboarding_en(구조화 영문 이력서)에서 사실 기반 텍스트 조립 (resume_text 보완)
function structuredResumeText(onboardingEn: unknown): string {
  const r = (onboardingEn && typeof onboardingEn === 'object' ? onboardingEn : {}) as Record<string, unknown>
  const s = (v: unknown) => (typeof v === 'string' ? v : '')
  const arr = (v: unknown) => (Array.isArray(v) ? v : [])
  const lines: string[] = []
  if (s(r.name)) lines.push(s(r.name))
  if (s(r.title)) lines.push(s(r.title))
  if (s(r.summary)) lines.push('', 'SUMMARY', s(r.summary))
  const exps = arr(r.experience) as Record<string, unknown>[]
  if (exps.length) {
    lines.push('', 'EXPERIENCE')
    for (const e of exps) {
      if (e?.hidden) continue
      lines.push(`${s(e.company)} — ${s(e.position)} (${s(e.period)})`)
      if (s(e.description)) lines.push(s(e.description))
    }
  }
  const skills = (arr(r.skills) as string[]).filter(x => typeof x === 'string')
  if (skills.length) lines.push('', 'SKILLS', skills.join(', '))
  const edu = arr(r.education) as Record<string, unknown>[]
  if (edu.length) {
    lines.push('', 'EDUCATION')
    for (const e of edu) lines.push(`${s(e.school)} — ${s(e.major)} ${s(e.degree)} (${s(e.period)})`)
  }
  return lines.join('\n').trim()
}

export async function generateTailoredResume(jobId: string): Promise<{ content?: string; ragSources?: number; error?: string }> {
  const email = await getAuthUserEmail()
  if (!email) return { error: '로그인이 필요합니다.' }

  const profile = await getOrCreateProfile(email)
  if (!profile) return { error: 'Profile not found' }

  // 무료 플랜 맞춤 이력서 한도: 새 공고에 한해 제한 (기존 공고 재생성은 허용)
  if (billingEnabled() && planOf(profile) !== 'premium') {
    const { data: existingForJob } = await supabaseAdmin
      .from('tailored_resumes')
      .select('id')
      .eq('user_id', profile.id)
      .eq('job_id', jobId)
      .maybeSingle()
    if (!existingForJob) {
      const { count } = await supabaseAdmin
        .from('tailored_resumes')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', profile.id)
      if ((count ?? 0) >= FREE_LIMITS.tailoredResumes) {
        return { error: `무료 플랜은 맞춤 이력서를 ${FREE_LIMITS.tailoredResumes}개까지 만들 수 있어요. 프리미엄으로 업그레이드하면 무제한입니다. (요금제 페이지 /pricing)` }
      }
    }
  }

  // 사실 기반 이력서: 업로드 원문 + 구조화 프로필(둘 중 있는 것 모두 활용)
  const structured = structuredResumeText(profile.onboarding_en)
  const baseResume = [profile.resume_text ?? '', structured].filter(Boolean).join('\n\n').trim()
  if (!baseResume) {
    return { error: '프로필 페이지에서 이력서를 먼저 업로드하거나 작성해주세요.' }
  }

  const { data: job } = await supabaseAdmin
    .from('jobs')
    .select('title, company, location, description')
    .eq('id', jobId)
    .single()

  if (!job) return { error: 'Job not found' }

  const jd = (job.description ?? `${job.title} at ${job.company}`).slice(0, 3000)

  // RAG: 과거 맞춤 이력서 코퍼스에서 이 JD에 관련된 표현·강조 검색
  const pastContext = await retrievePastResumes(profile.id, jobId, `${job.title} ${job.company} ${jd}`)
  const ragSources = pastContext ? pastContext.split('### 참고 이력서').length - 1 : 0

  // 실제 연락처 — 모델이 이메일·전화를 지어내지 않도록 명시적으로 제공한다
  const en = (profile.onboarding_en ?? {}) as { links?: string }
  const realContact = [email, profile.phone, en.links].map((v: unknown) => (typeof v === 'string' ? v.trim() : '')).filter(Boolean).join(' · ')

  const { anthropic } = await import('@/lib/claude')

  const message = await anthropic.messages.create({
    model: 'claude-opus-4-8',
    max_tokens: 4000,
    thinking: { type: 'adaptive' },
    messages: [{
      role: 'user',
      content: `당신은 전문 이력서 컨설턴트입니다. 아래 지원자의 이력서를 채용공고(JD)에 맞춰 재구성한 맞춤 이력서를 영어로 작성해주세요.

## 지원 포지션
- 직책: ${job.title}
- 회사: ${job.company}
- 위치: ${job.location ?? ''}

## 지원자 실제 연락처 (아래 표기를 그대로 사용, 변형·추가 금지)
${realContact || '(연락처 없음 — 연락처 줄을 아예 출력하지 말 것)'}

## 원본 이력서 (사실의 유일한 출처)
${baseResume.slice(0, 7000)}
${pastContext ? `\n## 과거에 유사 공고에 작성한 맞춤 이력서 (표현·강조 방식만 참고, 새로운 사실 추가 금지)\n${pastContext}\n` : ''}
## 작성 요구사항
- **사실은 오직 "원본 이력서"에서만** 가져올 것. 경력·스킬·수치·회사명을 절대 지어내거나 과장하지 말 것
- **연락처(이메일·전화·링크)는 위 "실제 연락처"만 그대로 사용**할 것. 이메일 주소나 거주지·위치를 절대 지어내지 말 것 (원본에 없는 위치는 출력하지 말 것 — 공고의 근무지를 지원자 위치처럼 쓰지 말 것)
- **직함은 원본 이력서의 직함을 유지**할 것. 공고 직급(Senior 등)에 맞춰 임의로 올리지 말 것
- "과거 맞춤 이력서"는 강조점·표현·bullet 스타일을 참고하는 용도이며, 거기서 새로운 사실을 끌어오지 말 것
- JD의 핵심 요구사항과 키워드에 맞춰 강조점과 항목 순서를 재구성할 것
- 구성: 이름·연락처 → PROFESSIONAL SUMMARY (3~4줄, 이 포지션 맞춤) → KEY SKILLS (JD 관련 스킬 우선) → WORK EXPERIENCE (JD와 관련된 성과 중심 bullet, 액션 동사로 시작) → EDUCATION 및 기타
- ATS 친화적인 평문 텍스트로 작성 (표나 마크다운 기호 없이, 섹션 제목은 대문자)
- 맞춤 이력서 본문만 출력하고 다른 설명은 쓰지 말 것`,
    }],
  })

  const textBlock = message.content.find(b => b.type === 'text')
  const content = textBlock?.type === 'text' ? textBlock.text.trim() : ''
  if (!content) return { error: '이력서 생성에 실패했습니다. 다시 시도해주세요.' }

  const { error } = await supabaseAdmin.from('tailored_resumes').upsert({
    user_id: profile.id,
    job_id: jobId,
    content,
    translation: null, // 영문이 새로 생성되었으므로 캐싱된 번역 무효화
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id,job_id' })

  if (error) return { error: error.message }

  return { content, ragSources }
}

// 맞춤 이력서를 한국어로 번역 (참고용) — 결과를 DB에 캐싱
export async function translateTailoredResume(jobId: string, content: string): Promise<{ translation?: string; error?: string }> {
  if (!content.trim()) return { error: '번역할 내용이 없습니다.' }

  const email = await getAuthUserEmail()
  if (!email) return { error: '로그인이 필요합니다.' }

  const profile = await getOrCreateProfile(email)
  if (!profile) return { error: 'Profile not found' }

  const { anthropic } = await import('@/lib/claude')
  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 3000,
    messages: [{
      role: 'user',
      content: `아래 영문 이력서를 자연스러운 한국어로 번역해주세요. 섹션 제목과 줄 구성은 원문 구조를 그대로 유지하고, 번역문만 출력하세요. 다른 설명은 쓰지 마세요.\n\n${content}`,
    }],
  })

  const translation = textOf(message)
  if (!translation) return { error: '번역에 실패했습니다. 다시 시도해주세요.' }

  // 현재 영문(content)과 함께 번역을 저장해 재방문 시 재번역 없이 표시
  const { error } = await supabaseAdmin
    .from('tailored_resumes')
    .upsert(
      { user_id: profile.id, job_id: jobId, content, translation, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,job_id' }
    )
  if (error) return { error: error.message }

  return { translation }
}

// 지시사항에 따라 맞춤 이력서 전체를 다시 작성
export async function editTailoredResume(jobId: string, currentContent: string, instruction: string): Promise<{ content?: string; error?: string }> {
  const email = await getAuthUserEmail()
  if (!email) return { error: '로그인이 필요합니다.' }

  const profile = await getOrCreateProfile(email)
  if (!profile) return { error: 'Profile not found' }
  if (!instruction.trim()) return { error: '수정 요청을 입력해주세요.' }
  if (!currentContent.trim()) return { error: '수정할 이력서가 없습니다.' }

  const { data: job } = await supabaseAdmin
    .from('jobs')
    .select('title, company, location, description')
    .eq('id', jobId)
    .single()

  if (!job) return { error: 'Job not found' }

  const { anthropic } = await import('@/lib/claude')
  const message = await anthropic.messages.create({
    model: 'claude-opus-4-8',
    max_tokens: 4000,
    thinking: { type: 'adaptive' },
    messages: [{
      role: 'user',
      content: `당신은 전문 이력서 컨설턴트입니다. 아래 맞춤 이력서를 사용자의 수정 요청에 따라 다시 작성해주세요.

## 지원 포지션
- 직책: ${job.title}
- 회사: ${job.company}
- 위치: ${job.location ?? ''}

## 채용공고 (JD)
${(job.description ?? `${job.title} at ${job.company}`).slice(0, 2000)}

## 원본 이력서 (사실 출처)
${profile.resume_text?.slice(0, 4000) ?? ''}

## 현재 맞춤 이력서
${currentContent}

## 사용자 수정 요청
${instruction}

## 작성 요구사항
- 수정 요청을 반영하되, 요청과 무관한 부분은 현재 이력서 내용을 최대한 유지할 것
- 원본 이력서에 있는 사실만 사용할 것. 경력, 스킬, 수치, 회사명을 절대 지어내거나 과장하지 말 것
- ATS 친화적인 평문 텍스트로 작성 (표나 마크다운 기호 없이, 섹션 제목은 대문자)
- 영어로 작성하고, 수정된 이력서 전문만 출력할 것. 다른 설명은 쓰지 말 것`,
    }],
  })

  const textBlock = message.content.find(b => b.type === 'text')
  const content = textBlock?.type === 'text' ? textBlock.text.trim() : ''
  if (!content) return { error: '이력서 수정에 실패했습니다. 다시 시도해주세요.' }

  const { error } = await supabaseAdmin.from('tailored_resumes').upsert({
    user_id: profile.id,
    job_id: jobId,
    content,
    translation: null, // 영문이 수정되었으므로 캐싱된 번역 무효화
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id,job_id' })

  if (error) return { error: error.message }

  return { content }
}

export async function getTailoredResume(jobId: string): Promise<{ content?: string; translation?: string }> {
  const email = await getAuthUserEmail()
  if (!email) return {}

  const profile = await getOrCreateProfile(email)
  if (!profile) return {}

  const { data } = await supabaseAdmin
    .from('tailored_resumes')
    .select('content, translation')
    .eq('job_id', jobId)
    .eq('user_id', profile.id)
    .single()
  return {
    content: data?.content ?? undefined,
    translation: data?.translation ?? undefined,
  }
}

export async function saveTailoredResume(jobId: string, content: string): Promise<{ error?: string }> {
  const email = await getAuthUserEmail()
  if (!email) return { error: '로그인이 필요합니다.' }

  const profile = await getOrCreateProfile(email)
  if (!profile) return { error: 'Profile not found' }

  const { error } = await supabaseAdmin
    .from('tailored_resumes')
    .upsert(
      // 영문을 직접 편집해 저장한 경우이므로 캐싱된 번역 무효화
      { user_id: profile.id, job_id: jobId, content, translation: null, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,job_id' }
    )
  if (error) return { error: error.message }
  return {}
}

export async function generateTailoredResumeDocx(jobId: string): Promise<{ base64?: string; filename?: string; error?: string }> {
  const email = await getAuthUserEmail()
  if (!email) return { error: '로그인이 필요합니다.' }

  const profile = await getOrCreateProfile(email)
  if (!profile) return { error: 'Profile not found' }
  if (!profile.resume_file_path) {
    return { error: '원본 DOCX가 없습니다. 프로필 페이지에서 DOCX 이력서를 다시 업로드해주세요.' }
  }

  const { data: job } = await supabaseAdmin
    .from('jobs')
    .select('title, company, description')
    .eq('id', jobId)
    .single()

  if (!job) return { error: 'Job not found' }

  // 원본 DOCX 다운로드
  const { data: fileData, error: downloadError } = await supabaseAdmin.storage
    .from('resumes')
    .download(profile.resume_file_path)
  if (downloadError || !fileData) {
    return { error: '원본 이력서 파일을 불러오지 못했습니다. 프로필에서 DOCX를 다시 업로드해주세요.' }
  }

  const { loadDocx, applyReplacements } = await import('@/lib/docx-rewrite')
  const doc = await loadDocx(Buffer.from(await fileData.arrayBuffer()))

  const numbered = doc.paragraphs
    .filter(p => p.text.trim())
    .map(p => `[${p.index}] ${p.text}`)
    .join('\n')

  const { anthropic } = await import('@/lib/claude')

  const message = await anthropic.messages.create({
    model: 'claude-opus-4-8',
    max_tokens: 8000,
    thinking: { type: 'adaptive' },
    messages: [{
      role: 'user',
      content: `당신은 전문 이력서 컨설턴트입니다. 아래는 지원자의 이력서를 문단 단위로 번호를 붙여 나열한 것입니다.
채용공고(JD)에 맞춰 일부 문단의 텍스트를 다시 쓴 결과를 JSON으로만 응답해주세요.

## 지원 포지션
- 직책: ${job.title}
- 회사: ${job.company}

## 채용공고 (JD)
${(job.description ?? `${job.title} at ${job.company}`).slice(0, 3000)}

## 이력서 문단 (번호 = 문단 인덱스)
${numbered}

## 규칙
- 수정할 문단만 {"replacements": [{"i": 문단인덱스, "text": "새 텍스트"}]} 형식의 JSON으로 출력. JSON 외 다른 텍스트 금지
- Professional Summary와 경력 bullet 위주로 JD의 키워드·요구사항에 맞춰 다시 쓸 것
- 이름, 연락처, 회사명, 직책, 근무 기간, 학력, 섹션 제목 문단은 절대 수정하지 말 것 (replacements에 포함하지 말 것)
- 원본에 있는 사실만 사용하고 경력·스킬·수치를 지어내지 말 것
- 각 문단의 새 텍스트는 원본과 비슷한 길이로 유지할 것 (레이아웃이 깨지지 않도록 ±30% 이내)
- 새 문단을 추가하거나 문단을 합치지 말 것. 영어로 작성할 것`,
    }],
  })

  const textBlock = message.content.find(b => b.type === 'text')
  const raw = textBlock?.type === 'text' ? textBlock.text : ''
  const jsonMatch = raw.match(/\{[\s\S]*\}/)
  if (!jsonMatch) return { error: 'AI 응답을 해석하지 못했습니다. 다시 시도해주세요.' }

  let replacements: Map<number, string>
  try {
    const parsed = JSON.parse(jsonMatch[0]) as { replacements: { i: number; text: string }[] }
    replacements = new Map(parsed.replacements.map(r => [r.i, r.text]))
  } catch {
    return { error: 'AI 응답을 해석하지 못했습니다. 다시 시도해주세요.' }
  }
  if (replacements.size === 0) return { error: '수정할 문단을 찾지 못했습니다. JD를 확인해주세요.' }

  const result = await applyReplacements(doc, replacements)

  const safe = (s: string) => s.replace(/[^\w가-힣-]+/g, '_').slice(0, 30)
  return {
    base64: result.toString('base64'),
    filename: `resume_${safe(job.company)}_${safe(job.title)}.docx`,
  }
}

// 저장된 맞춤 이력서 텍스트를 원본 DOCX 양식에 적용 (Claude 호출 없음)
export async function applyTailoredTextToDocx(jobId: string): Promise<{ base64?: string; filename?: string; error?: string }> {
  const email = await getAuthUserEmail()
  if (!email) return { error: '로그인이 필요합니다.' }

  const profile = await getOrCreateProfile(email)
  if (!profile) return { error: 'Profile not found' }

  const { data: tailored } = await supabaseAdmin
    .from('tailored_resumes')
    .select('content')
    .eq('user_id', profile.id)
    .eq('job_id', jobId)
    .single()

  if (!tailored?.content) return { error: '먼저 맞춤 이력서를 생성해주세요.' }

  if (!profile.resume_file_path) {
    return { error: '원본 DOCX가 없습니다. 프로필 페이지에서 DOCX 이력서를 다시 업로드해주세요.' }
  }

  const { data: fileData, error: downloadError } = await supabaseAdmin.storage
    .from('resumes')
    .download(profile.resume_file_path)
  if (downloadError || !fileData) {
    return { error: '원본 이력서 파일을 불러오지 못했습니다. 프로필에서 DOCX를 다시 업로드해주세요.' }
  }

  const { loadDocx, applyReplacements } = await import('@/lib/docx-rewrite')
  const doc = await loadDocx(Buffer.from(await fileData.arrayBuffer()))

  // 비어있지 않은 원본 문단과 맞춤 텍스트 줄을 위치 기반으로 매핑
  const tailoredLines = tailored.content.split('\n').filter((l: string) => l.trim())
  const nonEmptyParas = doc.paragraphs.filter(p => p.text.trim())

  const replacements = new Map<number, string>()
  const maxLen = Math.min(nonEmptyParas.length, tailoredLines.length)
  for (let i = 0; i < maxLen; i++) {
    const newText = tailoredLines[i].trim()
    if (newText !== nonEmptyParas[i].text.trim()) {
      replacements.set(nonEmptyParas[i].index, newText)
    }
  }

  const { data: job } = await supabaseAdmin
    .from('jobs')
    .select('title, company')
    .eq('id', jobId)
    .single()

  const result = await applyReplacements(doc, replacements)
  const safe = (s: string) => (s ?? '').replace(/[^\w가-힣-]+/g, '_').slice(0, 30)
  return {
    base64: result.toString('base64'),
    filename: `resume_${safe(job?.company ?? '')}_${safe(job?.title ?? '')}.docx`,
  }
}

export async function updateJobDescription(jobId: string, description: string): Promise<{ error?: string }> {
  const email = await getAuthUserEmail()
  if (!email) return { error: '로그인이 필요합니다.' }

  const profile = await getOrCreateProfile(email)
  if (!profile) return { error: 'Profile not found' }

  // 내 지원 목록에 있는 공고만 수정 허용 (공유 jobs 필드 무단 변조 차단)
  const { data: match } = await supabaseAdmin
    .from('matches')
    .select('job_id')
    .eq('user_id', profile.id)
    .eq('job_id', jobId)
    .maybeSingle()
  if (!match) return { error: '수정 권한이 없습니다.' }

  const { error } = await supabaseAdmin
    .from('jobs')
    .update({ description })
    .eq('id', jobId)
  if (error) return { error: error.message }
  return {}
}

// 공유 jobs 풀은 여러 유저가 함께 쓰므로, "삭제"는 내 목록(matches)에서만 제거한다.
// (공유 jobs 행이나 다른 유저의 matches는 건드리지 않는다.)
export async function deleteJob(jobId: string): Promise<{ error?: string }> {
  const email = await getAuthUserEmail()
  if (!email) return { error: '로그인이 필요합니다.' }

  const profile = await getOrCreateProfile(email)
  if (!profile) return { error: 'Profile not found' }

  const { error } = await supabaseAdmin
    .from('matches')
    .delete()
    .eq('user_id', profile.id)
    .eq('job_id', jobId)
  if (error) return { error: error.message }
  revalidatePath('/')
  return {}
}

export async function matchSingleJob(jobId: string): Promise<{ error?: string; score?: number }> {
  try {
    const { matchJob } = await import('@/lib/matching')
    const result = await matchJob(jobId)
    if ('error' in result) return { error: result.error }
    revalidatePath('/')
    return { score: result.score }
  } catch (e) {
    return { error: String(e) }
  }
}

export async function updateMatchStatus(jobId: string, status: string): Promise<{ error?: string; applied_at?: string }> {
  const email = await getAuthUserEmail()
  if (!email) return { error: '로그인이 필요합니다.' }

  const profile = await getOrCreateProfile(email)
  if (!profile) return { error: 'Profile not found' }

  const patch: Record<string, unknown> = { status }

  if (status === 'applied') {
    const { data: existing } = await supabaseAdmin
      .from('matches')
      .select('applied_at')
      .eq('job_id', jobId)
      .eq('user_id', profile.id)
      .single()
    if (!existing?.applied_at) {
      patch.applied_at = new Date().toISOString()
    }
  }

  const { error } = await supabaseAdmin
    .from('matches')
    .update(patch)
    .eq('job_id', jobId)
    .eq('user_id', profile.id)

  if (error) return { error: error.message }

  revalidatePath('/')
  return { applied_at: patch.applied_at as string | undefined }
}

export async function updateAppliedAt(jobId: string, appliedAt: string): Promise<{ error?: string }> {
  const email = await getAuthUserEmail()
  if (!email) return { error: '로그인이 필요합니다.' }

  const profile = await getOrCreateProfile(email)
  if (!profile) return { error: 'Profile not found' }

  const { error } = await supabaseAdmin
    .from('matches')
    .update({ applied_at: appliedAt || null })
    .eq('job_id', jobId)
    .eq('user_id', profile.id)

  if (error) return { error: error.message }
  return {}
}

export async function uploadAppliedResume(formData: FormData): Promise<{ text?: string; error?: string }> {
  const email = await getAuthUserEmail()
  if (!email) return { error: '로그인이 필요합니다.' }

  const file = formData.get('resume') as File | null
  const jobId = formData.get('jobId') as string
  if (!file || file.size === 0) return { error: '파일을 선택해주세요.' }
  if (file.size > 5 * 1024 * 1024) return { error: '파일 크기는 5MB 이하여야 합니다.' }
  if (!jobId) return { error: 'Job ID가 없습니다.' }

  const profile = await getOrCreateProfile(email)
  if (!profile) return { error: 'Profile not found' }

  try {
    const text = await parseResumeFile(file)
    if (!text) return { error: '텍스트를 추출할 수 없습니다.' }

    const { error } = await supabaseAdmin
      .from('matches')
      .update({
        applied_resume_text: text,
        applied_resume_filename: file.name,
      })
      .eq('user_id', profile.id)
      .eq('job_id', jobId)

    if (error) return { error: error.message }

    revalidatePath('/')
    return { text }
  } catch (e) {
    return { error: String(e) }
  }
}

export async function updateJobTitle(jobId: string, title: string): Promise<{ error?: string }> {
  return updateJobFields(jobId, { title: title.trim() }, !title.trim() ? '제목을 입력해주세요.' : undefined)
}

export async function updateJobCompany(jobId: string, company: string): Promise<{ error?: string }> {
  return updateJobFields(jobId, { company: company.trim() })
}

export async function updateJobLocation(jobId: string, location: string): Promise<{ error?: string }> {
  return updateJobFields(jobId, { location: location.trim() })
}

// 본인 목록(matches)에 있는 공고의 공유 jobs 필드를 수정 (권한 확인 포함)
async function updateJobFields(
  jobId: string,
  fields: Record<string, string>,
  validationError?: string
): Promise<{ error?: string }> {
  if (validationError) return { error: validationError }

  const email = await getAuthUserEmail()
  if (!email) return { error: '로그인이 필요합니다.' }

  const profile = await getOrCreateProfile(email)
  if (!profile) return { error: 'Profile not found' }

  // 본인 목록에 있는 공고만 수정 허용 (matches 존재 여부로 권한 확인)
  const { data: match } = await supabaseAdmin
    .from('matches')
    .select('job_id')
    .eq('user_id', profile.id)
    .eq('job_id', jobId)
    .maybeSingle()

  if (!match) return { error: '수정 권한이 없습니다.' }

  const { error } = await supabaseAdmin
    .from('jobs')
    .update(fields)
    .eq('id', jobId)

  if (error) return { error: error.message }

  revalidatePath('/')
  return {}
}

// 사용자가 드래그로 정한 목록 순서를 저장 (유저별 matches.position)
export async function reorderJobs(orderedJobIds: string[]): Promise<{ error?: string }> {
  const email = await getAuthUserEmail()
  if (!email) return { error: '로그인이 필요합니다.' }

  const profile = await getOrCreateProfile(email)
  if (!profile) return { error: 'Profile not found' }

  const results = await Promise.all(
    orderedJobIds.map((jobId, index) =>
      supabaseAdmin
        .from('matches')
        .update({ position: index })
        .eq('user_id', profile.id)
        .eq('job_id', jobId)
    )
  )

  const failed = results.find(r => r.error)
  if (failed?.error) return { error: failed.error.message }
  return {}
}

export async function updateJobMemo(jobId: string, memo: string): Promise<{ error?: string }> {
  const email = await getAuthUserEmail()
  if (!email) return { error: '로그인이 필요합니다.' }

  const profile = await getOrCreateProfile(email)
  if (!profile) return { error: 'Profile not found' }

  const { error } = await supabaseAdmin
    .from('matches')
    .upsert(
      { user_id: profile.id, job_id: jobId, memo },
      { onConflict: 'user_id,job_id' }
    )

  if (error) return { error: error.message }
  return {}
}

export async function addJobByUrl(formData: FormData): Promise<{ jobId?: string; duplicate?: boolean; alreadyScraped?: boolean; error?: string }> {
  const email = await getAuthUserEmail()
  if (!email) return { error: '로그인이 필요합니다.' }

  const url = (formData.get('url') as string)?.trim()
  if (!url) return { error: 'URL을 입력해주세요.' }

  try { new URL(url) } catch { return { error: '유효하지 않은 URL입니다.' } }

  const source = detectPlatform(url)

  const profile = await getOrCreateProfile(email)
  if (!profile) return { error: 'Profile not found' }

  // 동일 URL이 이미 있는지 확인
  const { data: existingJob } = await supabaseAdmin
    .from('jobs')
    .select('id, title')
    .eq('url', url)
    .maybeSingle()

  if (existingJob) {
    const { data: existingMatch } = await supabaseAdmin
      .from('matches')
      .select('job_id')
      .eq('user_id', profile.id)
      .eq('job_id', existingJob.id)
      .maybeSingle()

    if (existingMatch) return { duplicate: true }

    // 공고는 있지만 내 목록에 없는 경우 → matches만 등록, 재스크래핑 생략
    await supabaseAdmin
      .from('matches')
      .upsert(
        { user_id: profile.id, job_id: existingJob.id, status: 'new' },
        { onConflict: 'user_id,job_id' }
      )

    revalidatePath('/')
    const alreadyScraped = existingJob.title !== '스크래핑 대기 중...' && existingJob.title !== '스크래핑 실패'
    return { jobId: existingJob.id, alreadyScraped }
  }

  const { data, error } = await supabaseAdmin
    .from('jobs')
    .upsert({
      url,
      source,
      title: '스크래핑 대기 중...',
      company: '',
      location: '',
      scraped_at: new Date().toISOString(),
    }, { onConflict: 'url' })
    .select('id')
    .single()

  if (error) return { error: error.message }

  // 해당 유저의 matches에 등록 (이미 있으면 무시)
  await supabaseAdmin
    .from('matches')
    .upsert(
      { user_id: profile.id, job_id: data.id, status: 'new' },
      { onConflict: 'user_id,job_id' }
    )

  revalidatePath('/')
  return { jobId: data.id }
}

/**
 * 채용공고를 URL 없이 직접 입력해 추가한다.
 * (링크 복사가 막힌 사이트 대응 — 제목/회사/위치/JD를 손으로 입력)
 * description 이 있으면 곧바로 AI 매칭까지 실행한다.
 */
export async function addJobManually(
  formData: FormData
): Promise<{ jobId?: string; matched?: boolean; score?: number; error?: string }> {
  const email = await getAuthUserEmail()
  if (!email) return { error: '로그인이 필요합니다.' }

  const title = (formData.get('title') as string)?.trim()
  const company = (formData.get('company') as string)?.trim() ?? ''
  const location = (formData.get('location') as string)?.trim() ?? ''
  const description = (formData.get('description') as string)?.trim() ?? ''

  if (!title) return { error: '직무명을 입력해주세요.' }

  const profile = await getOrCreateProfile(email)
  if (!profile) return { error: 'Profile not found' }

  // URL 컬럼은 고유·필수이므로 직접 입력 공고에는 합성 URL을 부여한다.
  const syntheticUrl = `manual://${globalThis.crypto.randomUUID()}`

  const { data, error } = await supabaseAdmin
    .from('jobs')
    .insert({
      url: syntheticUrl,
      source: 'other',
      title,
      company,
      location,
      description: description || null,
      scraped_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (error) return { error: error.message }

  await supabaseAdmin
    .from('matches')
    .upsert(
      { user_id: profile.id, job_id: data.id, status: 'new' },
      { onConflict: 'user_id,job_id' }
    )

  // JD 가 있으면 바로 매칭
  let matched = false
  let score: number | undefined
  if (description) {
    const matchRes = await matchSingleJob(data.id)
    if (!matchRes.error && matchRes.score !== undefined) {
      matched = true
      score = matchRes.score
    }
  }

  revalidatePath('/')
  return { jobId: data.id, matched, score }
}

export interface ParsedJobText {
  title?: string
  company?: string
  location?: string
  salary?: string
  description?: string
}

/**
 * 잡 공고 사이트에서 Ctrl+A/C로 복사한 페이지 전문을 Haiku로 분석해
 * 직무명·회사·위치·연봉·정제된 JD를 추출한다. (DB 쓰기 없음 — 분석만)
 */
export async function parseJobText(rawText: string): Promise<{ parsed?: ParsedJobText; error?: string }> {
  const email = await getAuthUserEmail()
  if (!email) return { error: '로그인이 필요합니다.' }

  const text = (rawText ?? '').trim()
  if (text.length < 50) return { error: '내용이 너무 짧아요. 공고 페이지 전체를 복사해서 붙여넣어주세요.' }

  try {
    const { anthropic } = await import('@/lib/claude')
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 3000,
      messages: [{
        role: 'user',
        content: `아래는 채용공고 웹페이지에서 전체 선택(Ctrl+A) 후 복사한 원문입니다. 메뉴·광고·푸터 등 잡음이 섞여 있습니다. 채용공고 핵심 정보만 추출하세요.

## 원문
${text.slice(0, 15000)}

## 추출 규칙
- title: 직무명 (원문 언어 그대로)
- company: 회사명
- location: 근무지 (없으면 빈 문자열)
- salary: 급여 정보 (명시된 경우만, 없으면 빈 문자열)
- description: 채용공고 본문만 정제해 재구성 (주요 업무, 자격 요건, 우대 사항 등. 메뉴/광고/무관한 텍스트 제거. 원문 언어 유지, 최대 2000자)

JSON으로만 응답하세요. 다른 텍스트 금지:
{"title": "...", "company": "...", "location": "...", "salary": "...", "description": "..."}`,
      }],
    })

    const raw = textOf(message)
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return { error: '분석 결과를 해석하지 못했어요. 다시 시도해주세요.' }
    const parsed = JSON.parse(jsonMatch[0]) as ParsedJobText
    if (!parsed.title) return { error: '직무명을 찾지 못했어요. 공고 본문이 포함되게 다시 복사해주세요.' }
    return { parsed }
  } catch (e) {
    console.error('parseJobText error:', e)
    return { error: '분석 중 오류가 발생했어요. 잠시 후 다시 시도해주세요.' }
  }
}

/**
 * 파싱 실패(제목 파싱 불가 등) 공고를 붙여넣은 원문으로 재분석해 보정하고 AI 매칭까지 실행.
 */
export async function fixJobWithText(
  jobId: string,
  rawText: string
): Promise<{ matched?: boolean; score?: number; error?: string }> {
  const email = await getAuthUserEmail()
  if (!email) return { error: '로그인이 필요합니다.' }

  const profile = await getOrCreateProfile(email)
  if (!profile) return { error: 'Profile not found' }

  // 내 지원 목록에 있는 공고만 수정 가능
  const { data: myMatch } = await supabaseAdmin
    .from('matches')
    .select('id')
    .eq('user_id', profile.id)
    .eq('job_id', jobId)
    .maybeSingle()
  if (!myMatch) return { error: '내 지원 목록에 없는 공고입니다.' }

  const res = await parseJobText(rawText)
  if (res.error || !res.parsed) return { error: res.error ?? '분석 실패' }
  const p = res.parsed

  const { error } = await supabaseAdmin
    .from('jobs')
    .update({
      title: p.title,
      company: p.company || null,
      location: p.location || null,
      salary: p.salary || null,
      description: p.description || null,
    })
    .eq('id', jobId)

  if (error) return { error: error.message }

  let matched = false
  let score: number | undefined
  if (p.description) {
    const matchRes = await matchSingleJob(jobId)
    if (!matchRes.error && matchRes.score !== undefined) {
      matched = true
      score = matchRes.score
    }
  }

  revalidatePath('/')
  revalidatePath('/applications')
  revalidatePath('/dashboard')
  return { matched, score }
}

/**
 * 공고별 이력서 최적화 분석.
 * 유저의 영어 이력서(onboarding_en)를 타깃 공고의 JD와 대조해
 * - highlights: JD 요구사항과 부합하는 이력서 문구(원문 그대로의 부분 문자열)
 * - note: 강조 포인트 설명(키워드 + 한국어 본문)
 * 를 생성해 matches.optimization 에 캐싱한다.
 */
export async function generateWorkspaceOptimization(
  jobId: string
): Promise<{ error?: string }> {
  const email = await getAuthUserEmail()
  if (!email) return { error: '로그인이 필요합니다.' }
  if (!jobId) return { error: '공고 정보가 없습니다.' }

  const profile = await getOrCreateProfile(email)
  if (!profile) return { error: 'Profile not found' }

  // 본인 소유 매칭 확인
  const { data: match } = await supabaseAdmin
    .from('matches')
    .select('job_id')
    .eq('user_id', profile.id)
    .eq('job_id', jobId)
    .maybeSingle()
  if (!match) return { error: '내 공고가 아닙니다.' }

  const { data: job } = await supabaseAdmin
    .from('jobs')
    .select('title, company, description')
    .eq('id', jobId)
    .maybeSingle()
  if (!job) return { error: '공고를 찾을 수 없습니다.' }
  if (!job.description?.trim()) {
    return { error: '공고에 JD가 없어 분석할 수 없습니다. 공고 상세에서 JD를 먼저 입력해주세요.' }
  }

  const en = (profile.onboarding_en ?? {}) as {
    experience?: { company?: string; position?: string; description?: string; hidden?: boolean }[]
    skills?: string[]
  }
  // 이력서 경력 문장들(하이라이트 후보) 수집 — 스튜디오에서 제외한 항목은 스킵
  const bullets = (en.experience ?? [])
    .filter((e) => !e.hidden)
    .flatMap((e) => (e.description ?? '').split('\n'))
    .map((l) => l.replace(/^[-•\s]+/, '').trim())
    .filter(Boolean)
  if (bullets.length === 0) {
    return { error: '영어 이력서 경력이 비어 있어 분석할 수 없습니다. 프로필에서 이력서를 먼저 작성해주세요.' }
  }

  const prompt = `당신은 해외 취업 이력서 컨설턴트입니다. 아래 [영어 이력서 문장]을 [채용공고]의 요구사항과 대조해 분석하세요. JSON으로만 응답하세요. 다른 텍스트 금지.

형식:
{
  "highlights": ["채용공고 요구사항과 직접 부합하는 이력서 문장 속 핵심 구절"],
  "note": { "keyword": "'채용공고 핵심 요구 키워드(영문, 작은따옴표 포함)'", "body": "한국어 한 문장 설명" }
}

규칙:
- highlights 의 각 항목은 [영어 이력서 문장] 안에 **그대로 존재하는 부분 문자열**이어야 합니다(철자·대소문자·구두점 동일). 새 문장을 지어내지 마세요.
- highlights 는 2~4개. 공고와 가장 관련 높은 구절만.
- note.keyword 는 공고가 요구하는 핵심 역량을 영문 구절로(예: 'distributed systems'), 작은따옴표 포함.
- note.body 는 한국어 한 문장. **회사명·키워드·"공고의" 를 절대 포함하지 말고**, 곧바로 "요구사항에 맞춰 ○○ 경험을 강조했습니다." 처럼 이어지는 설명만 쓰세요. (렌더 시 "${job.company} 공고의 <keyword>" 가 앞에 자동으로 붙습니다.) 절대 사실을 지어내지 마세요.

[채용공고: ${job.title} @ ${job.company}]
${job.description.slice(0, 4000)}

[영어 이력서 문장]
${bullets.map((b) => `- ${b}`).join('\n')}`

  let parsed: { highlights?: unknown; note?: { keyword?: unknown; body?: unknown } }
  try {
    const { anthropic } = await import('@/lib/claude')
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    })
    const text = textOf(message)
    const m = text.match(/\{[\s\S]*\}/)
    if (!m) throw new Error('JSON 응답을 찾을 수 없습니다.')
    parsed = JSON.parse(m[0])
  } catch (e) {
    console.error('Workspace optimization error:', e)
    return { error: '분석 중 오류가 발생했어요. 잠시 후 다시 시도해주세요.' }
  }

  // highlights 는 실제 이력서 문장에 존재하는 것만 채택(환각 방지)
  const haystack = bullets.join('\n')
  const highlights = (Array.isArray(parsed.highlights) ? parsed.highlights : [])
    .filter((h): h is string => typeof h === 'string' && h.trim().length > 0)
    .filter((h) => haystack.includes(h))
    .slice(0, 4)

  const keyword = typeof parsed.note?.keyword === 'string' ? parsed.note.keyword : ''
  let body = typeof parsed.note?.body === 'string' ? parsed.note.body.trim() : ''
  // 노트는 "<회사> 공고의 <keyword> {body}" 로 렌더되므로,
  // 모델이 body 에 같은 접두("회사 공고의 키워드" 또는 키워드)를 반복하면 제거(중복 방지)
  if (body) {
    const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    if (job.company) {
      body = body.replace(new RegExp(`^${esc(job.company)}\\s*공고의\\s*${esc(keyword)}\\s*`), '')
    }
    body = body.replace(new RegExp(`^${esc(keyword)}\\s*`), '').trim()
  }

  const optimization = {
    highlights,
    note: keyword && body ? { keyword, body } : null,
    generated_at: new Date().toISOString(),
  }

  const { error: updateError } = await supabaseAdmin
    .from('matches')
    .update({ optimization })
    .eq('user_id', profile.id)
    .eq('job_id', jobId)

  if (updateError) return { error: updateError.message }

  revalidatePath('/workspace')
  return {}
}
