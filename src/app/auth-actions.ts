'use server'

import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function signOut() {
  const supabase = await createSupabaseServerClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function getAuthUser() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

/**
 * 로그인 직후 목적지 결정.
 * 온보딩(이력서 프로필) 미완료 유저는 매칭이 무의미하므로 온보딩으로 보낸다.
 */
export async function postLoginPath(): Promise<string> {
  const { getAuthUserEmail, getOrCreateProfile } = await import('@/lib/auth-helpers')
  const email = await getAuthUserEmail()
  if (!email) return '/login'
  const profile = await getOrCreateProfile(email)
  return profile?.onboarding_completed ? '/discover' : '/onboarding'
}

/**
 * 회원가입 전 이메일 중복 검사.
 * 주의: GoTrue admin API의 email 쿼리 필터는 무시되므로(전체 반환),
 * 반드시 페이지네이션 순회 후 로컬에서 정확히 매칭한다.
 */
export async function emailExists(email: string): Promise<boolean> {
  const { supabaseAdmin } = await import('@/lib/supabase-admin')
  const target = email.trim().toLowerCase()
  if (!target) return false

  let page = 1
  // 유저 수가 커져도 안전하도록 상한을 둔 페이지 순회
  while (page <= 20) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 200 })
    if (error) return false // 판단 불가 시 가입 흐름을 막지 않음 (identities 폴백이 2차 방어)
    if (data.users.some(u => u.email?.toLowerCase() === target)) return true
    if (data.users.length < 200) return false
    page++
  }
  return false
}
