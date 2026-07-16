'use server'

// 공고별 이력서 초안 저장/동기화 — 워크스페이스에서만 쓰인다.
// 마스터 이력서(profiles.onboarding_ko/en)는 절대 건드리지 않는다. 저장 대상은
// tailored_resumes(user_id, job_id)의 content_ko/content_en(JSONB)이다.
// (기존 "맞춤 이력서" 평문 모달이 쓰는 content/translation 컬럼과는 별개 — 같은 행을
//  upsert해도 payload에 없는 컬럼은 건드리지 않으므로 두 기능이 공존할 수 있다.)

import { revalidatePath } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getAuthUserEmail, getOrCreateProfile } from '@/lib/auth-helpers'
import { sanitizeStudio, toStudioResume, type StudioResume } from '@/lib/resume'
import { translateStudioToEnglish } from '@/lib/resume-translate'

interface OwnedProfile {
  id: string
  error?: never
}
interface OwnershipError {
  id?: never
  error: string
}

// 로그인 + 해당 공고(matches)가 본인 소유인지 확인
async function authorizeJobAccess(jobId: string): Promise<OwnedProfile | OwnershipError> {
  const email = await getAuthUserEmail()
  if (!email) return { error: '로그인이 필요합니다.' }

  const profile = await getOrCreateProfile(email)
  if (!profile) return { error: 'Profile not found' }

  const { data: match } = await supabaseAdmin
    .from('matches')
    .select('job_id')
    .eq('user_id', profile.id)
    .eq('job_id', jobId)
    .maybeSingle()
  if (!match) return { error: '공고를 찾을 수 없습니다.' }

  return { id: profile.id }
}

/** 공고별 초안(한국어) 저장. 처음 저장하는 순간의 마스터 기준 시각을 base_resume_synced_at으로 고정한다. */
export async function saveJobResumeDraft(
  jobId: string,
  input: StudioResume
): Promise<{ error?: string; baseResumeSyncedAt?: string }> {
  const auth = await authorizeJobAccess(jobId)
  if (auth.error) return { error: auth.error }

  const ko = sanitizeStudio(input)

  const { data: existing } = await supabaseAdmin
    .from('tailored_resumes')
    .select('base_resume_synced_at')
    .eq('user_id', auth.id)
    .eq('job_id', jobId)
    .maybeSingle()

  const baseResumeSyncedAt = existing?.base_resume_synced_at ?? new Date().toISOString()

  const { error } = await supabaseAdmin.from('tailored_resumes').upsert(
    {
      user_id: auth.id,
      job_id: jobId,
      content_ko: ko,
      base_resume_synced_at: baseResumeSyncedAt,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,job_id' }
  )
  if (error) return { error: error.message }

  revalidatePath('/workspace')
  return { baseResumeSyncedAt }
}

/** 공고별 초안(한국어)을 영어로 동기화 — 결과를 content_en에 저장 */
export async function syncJobResumeEnglish(
  jobId: string,
  input: StudioResume
): Promise<{ en?: StudioResume; error?: string }> {
  const auth = await authorizeJobAccess(jobId)
  if (auth.error) return { error: auth.error }

  const ko = sanitizeStudio(input)
  const translated = await translateStudioToEnglish(ko)
  if (translated.error || !translated.en) return { error: translated.error ?? '영어 동기화 중 오류가 발생했어요.' }

  const { data: existing } = await supabaseAdmin
    .from('tailored_resumes')
    .select('base_resume_synced_at')
    .eq('user_id', auth.id)
    .eq('job_id', jobId)
    .maybeSingle()
  const baseResumeSyncedAt = existing?.base_resume_synced_at ?? new Date().toISOString()

  const { error } = await supabaseAdmin.from('tailored_resumes').upsert(
    {
      user_id: auth.id,
      job_id: jobId,
      content_ko: ko,
      content_en: translated.en,
      base_resume_synced_at: baseResumeSyncedAt,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,job_id' }
  )
  if (error) return { error: error.message }

  revalidatePath('/workspace')
  return { en: translated.en }
}

/**
 * 마스터 이력서 최신 내용을 공고별 초안으로 다시 가져온다 (명시적 사용자 액션).
 * 기존 공고별 초안은 덮어써지므로 호출 전 클라이언트에서 확인을 받는다.
 */
export async function resyncJobResumeFromMaster(
  jobId: string
): Promise<{ ko?: StudioResume; baseResumeSyncedAt?: string; error?: string }> {
  const auth = await authorizeJobAccess(jobId)
  if (auth.error) return { error: auth.error }

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('onboarding_ko, name, phone, resume_updated_at')
    .eq('id', auth.id)
    .single()
  if (!profile) return { error: 'Profile not found' }

  const ko = toStudioResume(profile.onboarding_ko, (profile.name as string) ?? '', (profile.phone as string) ?? '')
  // 이 시점 마스터 내용을 기준으로 다시 스냅샷 — 이후 마스터가 또 바뀌기 전까지는 "최신"으로 취급
  const baseResumeSyncedAt = (profile.resume_updated_at as string | null) ?? new Date().toISOString()

  const { error } = await supabaseAdmin.from('tailored_resumes').upsert(
    {
      user_id: auth.id,
      job_id: jobId,
      content_ko: ko,
      content_en: null, // 원본이 바뀌었으므로 기존 영문 초안은 무효화 — 다시 동기화 필요
      base_resume_synced_at: baseResumeSyncedAt,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,job_id' }
  )
  if (error) return { error: error.message }

  revalidatePath('/workspace')
  return { ko, baseResumeSyncedAt }
}
