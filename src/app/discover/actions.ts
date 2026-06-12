'use server'

import { revalidatePath } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getAuthUserEmail, getOrCreateProfile } from '@/lib/auth-helpers'
import { detectAtsType } from '@/lib/discover/ats'

export async function addJobSource(formData: FormData): Promise<{ error?: string }> {
  const email = await getAuthUserEmail()
  if (!email) return { error: '로그인이 필요합니다.' }

  const profile = await getOrCreateProfile(email)
  if (!profile) return { error: 'Profile not found' }

  const url = (formData.get('url') as string)?.trim()
  let name = (formData.get('name') as string)?.trim()
  if (!url) return { error: 'URL을 입력해주세요.' }

  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return { error: '유효하지 않은 URL입니다.' }
  }

  const { type, board } = detectAtsType(url)
  if (!name) {
    // 이름 미입력 시 board 식별자 또는 도메인에서 유추
    name = board ?? parsed.hostname.replace(/^(www|careers|jobs)\./, '').split('.')[0]
    name = name.charAt(0).toUpperCase() + name.slice(1)
  }

  const { error } = await supabaseAdmin.from('job_sources').insert({
    user_id: profile.id,
    name,
    url,
    source_type: type,
  })

  if (error) {
    if (error.code === '23505') return { error: '이미 등록된 채용 페이지입니다.' }
    return { error: error.message }
  }

  revalidatePath('/discover')
  return {}
}

export async function deleteJobSource(sourceId: string): Promise<{ error?: string }> {
  const email = await getAuthUserEmail()
  if (!email) return { error: '로그인이 필요합니다.' }

  const profile = await getOrCreateProfile(email)
  if (!profile) return { error: 'Profile not found' }

  const { error } = await supabaseAdmin
    .from('job_sources')
    .delete()
    .eq('id', sourceId)
    .eq('user_id', profile.id)

  if (error) return { error: error.message }

  revalidatePath('/discover')
  return {}
}
