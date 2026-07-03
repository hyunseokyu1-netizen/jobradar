import { redirect } from 'next/navigation'

// 공개 랜딩은 루트(/)로 통합. 구 데모 경로는 리다이렉트한다.
export default function MatchdaLandingPage() {
  redirect('/')
}
