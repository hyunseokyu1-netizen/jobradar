'use server'

import { revalidatePath } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { parseResumeFile } from '@/lib/resume-parser'

export async function saveProfile(formData: FormData): Promise<{ error?: string }> {
  const skillsRaw = formData.get('skills') as string
  const positionsRaw = formData.get('desired_positions') as string
  const locationsRaw = formData.get('desired_locations') as string
  const sources = formData.getAll('desired_sources') as string[]

  const skills = skillsRaw.split(',').map(s => s.trim()).filter(Boolean)
  const desired_positions = positionsRaw.split(',').map(s => s.trim()).filter(Boolean)
  const desired_locations = locationsRaw.split(',').map(s => s.trim()).filter(Boolean)

  const salary_min = parseInt(formData.get('salary_min') as string) || null
  const salary_max = parseInt(formData.get('salary_max') as string) || null

  const { error } = await supabaseAdmin
    .from('profiles')
    .update({
      name: formData.get('name') as string,
      skills,
      desired_positions,
      desired_sources: sources,
      desired_locations,
      career_summary: formData.get('career_summary') as string,
      preferences: { salary_min, salary_max },
      updated_at: new Date().toISOString(),
    })
    .eq('email', 'hyunseok.yu1@gmail.com')

  if (error) {
    console.error('Profile save error:', error)
    return { error: error.message }
  }

  revalidatePath('/profile')
  return {}
}

export async function uploadResume(formData: FormData): Promise<{ text?: string; error?: string }> {
  const file = formData.get('resume') as File | null
  if (!file || file.size === 0) return { error: '파일을 선택해주세요.' }
  if (file.size > 5 * 1024 * 1024) return { error: '파일 크기는 5MB 이하여야 합니다.' }

  try {
    const text = await parseResumeFile(file)
    if (!text) return { error: '텍스트를 추출할 수 없습니다.' }

    const { error } = await supabaseAdmin
      .from('profiles')
      .update({ resume_text: text, updated_at: new Date().toISOString() })
      .eq('email', 'hyunseok.yu1@gmail.com')

    if (error) return { error: error.message }

    revalidatePath('/profile')
    return { text }
  } catch (e) {
    return { error: String(e) }
  }
}
