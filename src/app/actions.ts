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
