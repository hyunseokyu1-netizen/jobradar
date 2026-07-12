import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { getAuthUserEmail, getOrCreateProfile } from '@/lib/auth-helpers'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // 비밀번호 재설정 등 목적지 지정 진입 (open redirect 방지: 내부 경로만 허용)
  const next = searchParams.get('next')
  let target = next && next.startsWith('/') && !next.startsWith('//') ? next : '/discover'

  if (code) {
    const supabase = await createSupabaseServerClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  // 목적지 미지정 진입(가입 인증·소셜 로그인): 온보딩 미완료면 이력서 작성부터
  if (!next) {
    const email = await getAuthUserEmail()
    if (email) {
      const profile = await getOrCreateProfile(email)
      if (profile && !profile.onboarding_completed) target = '/onboarding'
    }
  }

  return NextResponse.redirect(`${origin}${target}`)
}
