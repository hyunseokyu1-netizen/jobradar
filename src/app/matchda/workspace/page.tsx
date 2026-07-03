import { redirect } from 'next/navigation'

// 워크스페이스는 /workspace 로 이전. 구 경로는 jobId를 보존해 리다이렉트한다.
export default async function MatchdaWorkspaceRedirect({
  searchParams,
}: {
  searchParams: Promise<{ jobId?: string }>
}) {
  const { jobId } = await searchParams
  redirect(jobId ? `/workspace?jobId=${encodeURIComponent(jobId)}` : '/workspace')
}
