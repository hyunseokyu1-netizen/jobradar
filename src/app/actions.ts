'use server'

import { revalidatePath } from 'next/cache'
import { runMatching } from '@/lib/matching'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { detectPlatform } from '@/lib/detect-platform'
import { getAuthUserEmail, getOrCreateProfile } from '@/lib/auth-helpers'
import { parseResumeFile } from '@/lib/resume-parser'

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

  const content = message.content[0].type === 'text' ? message.content[0].text.trim() : ''

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

  const reviewed = message.content[0].type === 'text' ? message.content[0].text.trim() : content

  await supabaseAdmin.from('cover_letters').upsert(
    { user_id: profile.id, job_id: jobId, content: reviewed },
    { onConflict: 'user_id,job_id' }
  )

  return { content: reviewed }
}

export async function translateCoverLetter(content: string): Promise<{ translation?: string; error?: string }> {
  const { anthropic } = await import('@/lib/claude')

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1500,
    messages: [{
      role: 'user',
      content: `아래 영문 커버레터를 자연스러운 한국어로 번역해주세요. 번역문만 출력하고 다른 설명은 쓰지 마세요.\n\n${content}`,
    }],
  })

  const translation = message.content[0].type === 'text' ? message.content[0].text.trim() : ''
  return { translation }
}

export async function generateTailoredResume(jobId: string): Promise<{ content?: string; error?: string }> {
  const email = await getAuthUserEmail()
  if (!email) return { error: '로그인이 필요합니다.' }

  const profile = await getOrCreateProfile(email)
  if (!profile) return { error: 'Profile not found' }
  if (!profile.resume_text) return { error: '프로필 페이지에서 이력서를 먼저 업로드해주세요.' }

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
      content: `당신은 전문 이력서 컨설턴트입니다. 아래 지원자의 원본 이력서를 채용공고(JD)에 맞춰 재구성한 맞춤 이력서를 영어로 작성해주세요.

## 지원 포지션
- 직책: ${job.title}
- 회사: ${job.company}
- 위치: ${job.location ?? ''}

## 채용공고 (JD)
${(job.description ?? `${job.title} at ${job.company}`).slice(0, 3000)}

## 원본 이력서
${profile.resume_text.slice(0, 6000)}

## 작성 요구사항
- 원본 이력서에 있는 사실만 사용할 것. 경력, 스킬, 수치, 회사명을 절대 지어내거나 과장하지 말 것
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
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id,job_id' })

  if (error) return { error: error.message }

  return { content }
}

export async function getTailoredResume(jobId: string): Promise<{ content?: string }> {
  const email = await getAuthUserEmail()
  if (!email) return {}

  const profile = await getOrCreateProfile(email)
  if (!profile) return {}

  const { data } = await supabaseAdmin
    .from('tailored_resumes')
    .select('content')
    .eq('job_id', jobId)
    .eq('user_id', profile.id)
    .single()
  return { content: data?.content ?? undefined }
}

export async function saveTailoredResume(jobId: string, content: string): Promise<{ error?: string }> {
  const email = await getAuthUserEmail()
  if (!email) return { error: '로그인이 필요합니다.' }

  const profile = await getOrCreateProfile(email)
  if (!profile) return { error: 'Profile not found' }

  const { error } = await supabaseAdmin
    .from('tailored_resumes')
    .upsert(
      { user_id: profile.id, job_id: jobId, content, updated_at: new Date().toISOString() },
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
  const { error } = await supabaseAdmin
    .from('jobs')
    .update({ description })
    .eq('id', jobId)
  if (error) return { error: error.message }
  return {}
}

export async function deleteJob(jobId: string): Promise<{ error?: string }> {
  await supabaseAdmin.from('matches').delete().eq('job_id', jobId)
  const { error } = await supabaseAdmin.from('jobs').delete().eq('id', jobId)
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
  const email = await getAuthUserEmail()
  if (!email) return { error: '로그인이 필요합니다.' }

  const profile = await getOrCreateProfile(email)
  if (!profile) return { error: 'Profile not found' }

  const trimmed = title.trim()
  if (!trimmed) return { error: '제목을 입력해주세요.' }

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
    .update({ title: trimmed })
    .eq('id', jobId)

  if (error) return { error: error.message }

  revalidatePath('/')
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
