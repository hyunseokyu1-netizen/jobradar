import { redirect } from 'next/navigation'

// 대시보드는 /dashboard 로 이전. 구 경로는 리다이렉트한다.
export default function MatchdaDashboardRedirect() {
  redirect('/dashboard')
}
