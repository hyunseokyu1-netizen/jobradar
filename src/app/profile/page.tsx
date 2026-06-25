import Link from 'next/link'
import ProfileForm from './ProfileForm'
import { getAuthUserEmail, getOrCreateProfile } from '@/lib/auth-helpers'
import { redirect } from 'next/navigation'

export default async function ProfilePage() {
  const email = await getAuthUserEmail()
  if (!email) redirect('/login')

  const profile = await getOrCreateProfile(email)

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold">내 프로파일</h1>
        <Link
          href="/onboarding?redo=1"
          className="text-sm font-medium bg-zinc-900 text-white px-4 py-2 rounded-lg hover:bg-zinc-700 transition-colors whitespace-nowrap"
        >
          ✨ AI로 다시 작성
        </Link>
      </div>
      <ProfileForm initialData={profile} />
    </div>
  )
}
