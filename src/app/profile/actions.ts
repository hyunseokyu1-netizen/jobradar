'use server'

import { revalidatePath } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { parseResumeFile } from '@/lib/resume-parser'
import { getAuthUserEmail, getOrCreateProfile } from '@/lib/auth-helpers'

export async function saveProfile(formData: FormData): Promise<{ error?: string }> {
  const email = await getAuthUserEmail()
  if (!email) return { error: '로그인이 필요합니다.' }

  const skillsRaw = formData.get('skills') as string
  const positionsRaw = formData.get('desired_positions') as string
  const locationsRaw = formData.get('desired_locations') as string

  const skills = skillsRaw.split(',').map(s => s.trim()).filter(Boolean)
  const desired_positions = positionsRaw.split(',').map(s => s.trim()).filter(Boolean)
  const desired_locations = locationsRaw.split(',').map(s => s.trim()).filter(Boolean)

  const salary_min = parseInt(formData.get('salary_min') as string) || null
  const salary_max = parseInt(formData.get('salary_max') as string) || null
  const salary_currency = (formData.get('salary_currency') as string) || 'AUD'

  const profile = await getOrCreateProfile(email)
  if (!profile) return { error: 'Profile not found' }

  const { error } = await supabaseAdmin
    .from('profiles')
    .update({
      name: formData.get('name') as string,
      skills,
      desired_positions,
      desired_locations,
      career_summary: formData.get('career_summary') as string,
      preferences: { salary_min, salary_max, salary_currency },
      updated_at: new Date().toISOString(),
    })
    .eq('id', profile.id)

  if (error) {
    console.error('Profile save error:', error)
    return { error: error.message }
  }

  revalidatePath('/profile')
  return {}
}

export async function generateCareerSummary(): Promise<{ summary?: string; error?: string }> {
  const email = await getAuthUserEmail()
  if (!email) return { error: '로그인이 필요합니다.' }

  const profile = await getOrCreateProfile(email)
  if (!profile?.resume_text) return { error: '이력서를 먼저 업로드해주세요.' }

  const { anthropic } = await import('@/lib/claude')
  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 400,
    messages: [{
      role: 'user',
      content: `아래 이력서를 바탕으로 AI 채용 매칭 및 커버레터 생성에 활용될 경력 요약을 영어로 작성해주세요.

요구사항:
- 3~5문장, 150단어 이내
- 총 경력 연수, 핵심 기술 스택, 주요 도메인/산업 포함
- 강점과 차별점 강조
- 평문(plain text)으로만 작성, 마크다운 없이

이력서:
${profile.resume_text.slice(0, 4000)}`,
    }],
  })

  const summary = message.content[0].type === 'text' ? message.content[0].text.trim() : ''
  return { summary }
}

export async function uploadResume(formData: FormData): Promise<{ text?: string; error?: string }> {
  const email = await getAuthUserEmail()
  if (!email) return { error: '로그인이 필요합니다.' }

  const file = formData.get('resume') as File | null
  if (!file || file.size === 0) return { error: '파일을 선택해주세요.' }
  if (file.size > 5 * 1024 * 1024) return { error: '파일 크기는 5MB 이하여야 합니다.' }

  try {
    const text = await parseResumeFile(file)
    if (!text) return { error: '텍스트를 추출할 수 없습니다.' }

    const profile = await getOrCreateProfile(email)
    if (!profile) return { error: 'Profile not found' }

    const { error } = await supabaseAdmin
      .from('profiles')
      .update({ resume_text: text, updated_at: new Date().toISOString() })
      .eq('id', profile.id)

    if (error) return { error: error.message }

    revalidatePath('/profile')
    return { text }
  } catch (e) {
    return { error: String(e) }
  }
}
