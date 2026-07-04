import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // 로그인 페이지는 인증 불필요
  if (pathname.startsWith('/login')) {
    // 이미 로그인된 경우 대시보드로
    if (user) return NextResponse.redirect(new URL('/dashboard', request.url))
    return supabaseResponse
  }

  // 루트(/)와 소개·요금제·약관·정책·고객센터 페이지는 공개 (로그인 여부와 무관)
  const PUBLIC_PATHS = ['/', '/about', '/pricing', '/terms', '/privacy', '/support', '/forgot-password', '/reset-password']
  if (PUBLIC_PATHS.includes(pathname)) {
    return supabaseResponse
  }

  // MatchDa 디자인 화면(/matchda/*)은 목 데이터 기반 데모 — 공개
  if (pathname.startsWith('/matchda')) {
    return supabaseResponse
  }

  // 나머지 페이지는 로그인 필요
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api|auth/callback).*)'],
}
