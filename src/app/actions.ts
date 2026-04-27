'use server'

import { revalidatePath } from 'next/cache'
import { runMatching } from '@/lib/matching'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { detectPlatform } from '@/lib/detect-platform'

export async function triggerMatching() {
  try {
    const result = await runMatching()
    return result
  } catch (e) {
    return { error: String(e), matched: 0, errors: 0, firstError: '' }
  }
}

export async function generateCoverLetter(jobId: string): Promise<{ content?: string; error?: string }> {
  const { data: job } = await supabaseAdmin
    .from('jobs')
    .select('title, company, location, description')
    .eq('id', jobId)
    .single()

  if (!job) return { error: 'Job not found' }

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('name, skills, career_summary, resume_text, desired_positions')
    .eq('email', 'hyunseok.yu1@gmail.com')
    .single()

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

  // cover_letters 테이블에 저장
  await supabaseAdmin.from('cover_letters').upsert({
    job_id: jobId,
    content,
  }, { onConflict: 'job_id' })

  return { content }
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

export async function updateMatchStatus(jobId: string, status: string): Promise<{ error?: string }> {
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('email', 'hyunseok.yu1@gmail.com')
    .single()

  if (!profile) return { error: 'Profile not found' }

  const { error } = await supabaseAdmin
    .from('matches')
    .update({ status })
    .eq('job_id', jobId)
    .eq('user_id', profile.id)

  if (error) return { error: error.message }

  revalidatePath('/')
  return {}
}

export async function updateJobMemo(jobId: string, memo: string): Promise<{ error?: string }> {
  const { error } = await supabaseAdmin
    .from('jobs')
    .update({ memo })
    .eq('id', jobId)

  if (error) return { error: error.message }
  return {}
}

export async function addJobByUrl(formData: FormData): Promise<{ jobId?: string; error?: string }> {
  const url = (formData.get('url') as string)?.trim()
  if (!url) return { error: 'URL을 입력해주세요.' }

  try { new URL(url) } catch { return { error: '유효하지 않은 URL입니다.' } }

  const source = detectPlatform(url)

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

  revalidatePath('/')
  return { jobId: data.id }
}
