'use server'

import { supabaseAdmin } from '@/lib/supabase-admin'
import { getAuthUserEmail, getOrCreateProfile } from '@/lib/auth-helpers'
import { moderateFeedback } from '@/lib/feedback-moderation'

export interface FeedbackInput {
  rating: number
  content: string
  allowPublic: boolean
  displayName?: string
}

export interface MyFeedback {
  rating: number
  content: string
  allowPublic: boolean
  displayName: string
}

/** 내가 남긴 후기 조회 (없으면 null) — 모달 열 때 기존 내용 프리필용 */
export async function getMyFeedback(): Promise<{ feedback?: MyFeedback | null; error?: string }> {
  const email = await getAuthUserEmail()
  if (!email) return { error: '로그인이 필요합니다.' }

  const profile = await getOrCreateProfile(email)
  if (!profile) return { error: 'Profile not found' }

  const { data } = await supabaseAdmin
    .from('user_feedback')
    .select('rating, content, allow_public, display_name')
    .eq('user_id', profile.id)
    .maybeSingle()

  if (!data) return { feedback: null }
  return {
    feedback: {
      rating: data.rating,
      content: data.content ?? '',
      allowPublic: !!data.allow_public,
      displayName: data.display_name ?? '',
    },
  }
}

/** 후기 저장 — 유저당 1개, 다시 제출하면 수정 */
export async function submitFeedback(input: FeedbackInput): Promise<{ error?: string }> {
  const email = await getAuthUserEmail()
  if (!email) return { error: '로그인이 필요합니다.' }

  const profile = await getOrCreateProfile(email)
  if (!profile) return { error: 'Profile not found' }

  const rating = Math.round(input.rating)
  if (rating < 1 || rating > 5) return { error: '별점을 선택해주세요.' }

  const content = (input.content ?? '').trim().slice(0, 2000)
  const displayName = (input.displayName ?? '').trim().slice(0, 40)

  // 욕설·비방·개인정보 검열 (본문 + 공개 표시 이름을 함께 검사)
  const moderation = await moderateFeedback([content, displayName].filter(Boolean).join('\n'))
  if (moderation.blocked) {
    return { error: moderation.reason ?? '작성 규칙에 맞지 않는 표현이 포함되어 있어요.' }
  }

  const { error } = await supabaseAdmin.from('user_feedback').upsert(
    {
      user_id: profile.id,
      rating,
      content,
      allow_public: !!input.allowPublic,
      display_name: displayName || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  )

  if (error) return { error: error.message }
  return {}
}
