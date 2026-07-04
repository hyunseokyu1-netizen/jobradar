import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { getOrCreateProfile } from '@/lib/auth-helpers'
import AppShell from '@/components/matchda/AppShell'
import { PersonalInfoForm, PasswordForm } from './SettingsForms'

export const dynamic = 'force-dynamic'

const PROVIDER_LABEL: Record<string, string> = {
  email: '이메일 · 비밀번호',
  google: 'Google 소셜 로그인',
  github: 'GitHub 소셜 로그인',
  kakao: '카카오 소셜 로그인',
}

function Card({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[16px] border border-[#ECEEF0] bg-white p-6">
      <h2 className="text-[16px] font-bold text-[#1F2A37]">{title}</h2>
      {desc && <p className="mt-1 text-[13px] text-[#98A2B3]">{desc}</p>}
      <div className="mt-5">{children}</div>
    </section>
  )
}

export default async function SettingsPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) redirect('/login')

  const profile = await getOrCreateProfile(user.email)
  if (!profile) redirect('/login')

  const provider = (user.app_metadata?.provider as string) ?? 'email'
  const providerLabel = PROVIDER_LABEL[provider] ?? provider
  const joinedAt = user.created_at
    ? new Date(user.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
    : '-'

  return (
    <AppShell activeKey="settings" userName={(profile.name as string) ?? undefined} userEmail={user.email}>
      <div className="mx-auto max-w-3xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">설정</h1>
          <p className="mt-0.5 text-sm text-[#98A2B3]">로그인 정보와 개인정보를 관리하세요.</p>
        </div>

        <div className="space-y-5">
          {/* 로그인 정보 */}
          <Card title="로그인 정보">
            <dl className="space-y-3">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center">
                <dt className="w-32 shrink-0 text-[13px] font-medium text-[#667085]">이메일</dt>
                <dd className="text-[14px] text-[#1F2A37]">{user.email}</dd>
              </div>
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center">
                <dt className="w-32 shrink-0 text-[13px] font-medium text-[#667085]">로그인 방식</dt>
                <dd className="text-[14px] text-[#1F2A37]">{providerLabel}</dd>
              </div>
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center">
                <dt className="w-32 shrink-0 text-[13px] font-medium text-[#667085]">가입일</dt>
                <dd className="text-[14px] text-[#1F2A37]">{joinedAt}</dd>
              </div>
            </dl>
          </Card>

          {/* 비밀번호 변경 */}
          <Card
            title="비밀번호 변경"
            desc={
              provider === 'email'
                ? '현재 비밀번호를 확인한 뒤 새 비밀번호로 변경합니다.'
                : undefined
            }
          >
            {provider === 'email' ? (
              <PasswordForm />
            ) : (
              <p className="rounded-lg bg-[#F4F6F8] px-4 py-3 text-[13px] text-[#667085]">
                {providerLabel} 계정은 별도 비밀번호가 없습니다. 해당 서비스의 계정 설정에서 관리하세요.
              </p>
            )}
          </Card>

          {/* 개인정보 */}
          <Card title="개인정보" desc="이력서와 프로필에 사용되는 기본 정보입니다.">
            <PersonalInfoForm
              name={(profile.name as string) ?? ''}
              phone={(profile.phone as string) ?? ''}
            />
          </Card>

          {/* 데이터 관리 */}
          <Card title="데이터 관리">
            <p className="text-[13px] leading-relaxed text-[#667085]">
              계정 삭제 또는 데이터 내보내기가 필요하시면 우측 하단 고객센터 챗봇이나{' '}
              <a href="mailto:support@matchda.com" className="font-medium text-[#046C4E] hover:underline">
                support@matchda.com
              </a>
              으로 요청해주세요. 요청 확인 후 처리해드립니다.
            </p>
          </Card>
        </div>
      </div>
    </AppShell>
  )
}
