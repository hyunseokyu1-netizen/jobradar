'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@supabase/supabase-js'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getAuthUserEmail, getOrCreateProfile } from '@/lib/auth-helpers'

/** 이름·전화번호 등 개인정보 수정 */
export async function updatePersonalInfo(formData: FormData): Promise<{ error?: string }> {
  const email = await getAuthUserEmail()
  if (!email) return { error: '로그인이 필요합니다.' }

  const profile = await getOrCreateProfile(email)
  if (!profile) return { error: 'Profile not found' }

  const name = ((formData.get('name') as string) ?? '').trim()
  const phone = ((formData.get('phone') as string) ?? '').trim()

  const { error } = await supabaseAdmin
    .from('profiles')
    .update({ name, phone: phone || null, updated_at: new Date().toISOString() })
    .eq('id', profile.id)

  if (error) return { error: error.message }

  revalidatePath('/settings')
  revalidatePath('/dashboard')
  return {}
}

/**
 * 비밀번호 변경 (이메일 가입 유저 전용).
 * 현재 비밀번호를 anon 클라이언트 signInWithPassword로 검증한 뒤 admin API로 교체한다.
 */
export async function changePassword(formData: FormData): Promise<{ error?: string }> {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return { error: '로그인이 필요합니다.' }

  const provider = user.app_metadata?.provider ?? 'email'
  if (provider !== 'email') {
    return { error: `${provider} 소셜 로그인 계정은 비밀번호가 없습니다. ${provider} 계정 설정에서 관리하세요.` }
  }

  const currentPassword = (formData.get('currentPassword') as string) ?? ''
  const newPassword = (formData.get('newPassword') as string) ?? ''
  const confirmPassword = (formData.get('confirmPassword') as string) ?? ''

  if (newPassword.length < 8) return { error: '새 비밀번호는 8자 이상이어야 합니다.' }
  if (newPassword !== confirmPassword) return { error: '새 비밀번호가 서로 일치하지 않습니다.' }
  if (newPassword === currentPassword) return { error: '현재 비밀번호와 다른 비밀번호를 사용해주세요.' }

  // 현재 비밀번호 검증 (세션 쿠키에 영향 없는 일회용 anon 클라이언트)
  const verifier = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
  const { error: verifyError } = await verifier.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  })
  if (verifyError) return { error: '현재 비밀번호가 올바르지 않습니다.' }

  const { error } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
    password: newPassword,
  })
  if (error) return { error: `비밀번호 변경 실패: ${error.message}` }

  return {}
}
