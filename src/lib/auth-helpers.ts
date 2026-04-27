import { createSupabaseServerClient } from './supabase-server'
import { supabaseAdmin } from './supabase-admin'

export async function getAuthUserEmail(): Promise<string | null> {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user?.email ?? null
}

// 로그인 유저의 프로파일 조회 (없으면 자동 생성)
export async function getOrCreateProfile(email: string) {
  const { data: existing } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('email', email)
    .single()

  if (existing) return existing

  // 첫 로그인 시 빈 프로파일 자동 생성
  const { data: created } = await supabaseAdmin
    .from('profiles')
    .insert({ email, name: '' })
    .select()
    .single()

  return created
}
