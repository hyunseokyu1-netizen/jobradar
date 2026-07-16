import { redirect } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getAuthUserEmail, getOrCreateProfile } from '@/lib/auth-helpers'
import { isAdminEmail } from '@/lib/admin'
import AppShell from '@/components/matchda/AppShell'
import FeedbackRow, { type AdminFeedbackItem } from './FeedbackRow'

export const dynamic = 'force-dynamic'

/** 관리자 전용 — 체험 후기 목록·관리 (ADMIN_EMAILS 환경변수로 접근 제어) */
export default async function AdminFeedbackPage() {
  const email = await getAuthUserEmail()
  if (!email) redirect('/login')
  if (!isAdminEmail(email)) redirect('/dashboard')

  const profile = await getOrCreateProfile(email)

  const { data: rows } = await supabaseAdmin
    .from('user_feedback')
    .select('id, user_id, rating, content, allow_public, display_name, created_at, updated_at')
    .order('updated_at', { ascending: false })

  // 작성자 이메일 매핑
  const userIds = [...new Set((rows ?? []).map(r => r.user_id))]
  const { data: profiles } = userIds.length
    ? await supabaseAdmin.from('profiles').select('id, email').in('id', userIds)
    : { data: [] as { id: string; email: string | null }[] }
  const emailMap = new Map((profiles ?? []).map(p => [p.id, p.email ?? '(이메일 없음)']))

  const items: AdminFeedbackItem[] = (rows ?? []).map(r => ({
    id: r.id,
    rating: r.rating,
    content: r.content ?? '',
    allowPublic: !!r.allow_public,
    displayName: r.display_name,
    userEmail: emailMap.get(r.user_id) ?? '(탈퇴 유저)',
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }))

  const avg = items.length
    ? (items.reduce((s, i) => s + i.rating, 0) / items.length).toFixed(1)
    : '-'
  const publicCount = items.filter(i => i.allowPublic).length

  return (
    <AppShell activeKey="settings" userName={(profile?.name as string) ?? undefined} userEmail={email}>
      <div className="mx-auto max-w-3xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">체험 후기 관리</h1>
          <p className="mt-0.5 text-sm text-[#98A2B3]">
            총 {items.length}건 · 평균 ⭐{avg} · 공개 동의 {publicCount}건
          </p>
        </div>

        {items.length === 0 ? (
          <p className="rounded-xl border border-dashed border-[#ECEEF0] py-16 text-center text-sm text-[#98A2B3]">
            아직 후기가 없습니다.
          </p>
        ) : (
          <ul className="space-y-3">
            {items.map(item => (
              <FeedbackRow key={item.id} item={item} />
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  )
}
