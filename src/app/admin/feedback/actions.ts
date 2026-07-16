'use server'

import { revalidatePath } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getAuthUserEmail } from '@/lib/auth-helpers'
import { isAdminEmail } from '@/lib/admin'

// 모든 액션 공통: 관리자 확인 (미인가 시 에러)
async function requireAdmin(): Promise<{ error?: string }> {
  const email = await getAuthUserEmail()
  if (!email || !isAdminEmail(email)) return { error: '권한이 없습니다.' }
  return {}
}

/** 후기 삭제 — 검열을 우회한 스팸·부적절 후기 제거 */
export async function adminDeleteFeedback(feedbackId: string): Promise<{ error?: string }> {
  const guard = await requireAdmin()
  if (guard.error) return guard

  const { error } = await supabaseAdmin.from('user_feedback').delete().eq('id', feedbackId)
  if (error) return { error: error.message }

  revalidatePath('/admin/feedback')
  return {}
}

/** 공개 게재 동의 해제/복원 — 동의했지만 게재 부적절한 후기 관리 */
export async function adminSetFeedbackPublic(
  feedbackId: string,
  allowPublic: boolean
): Promise<{ error?: string }> {
  const guard = await requireAdmin()
  if (guard.error) return guard

  const { error } = await supabaseAdmin
    .from('user_feedback')
    .update({ allow_public: allowPublic, updated_at: new Date().toISOString() })
    .eq('id', feedbackId)
  if (error) return { error: error.message }

  revalidatePath('/admin/feedback')
  return {}
}
