import ProfileForm from './ProfileForm'
import { getAuthUserEmail, getOrCreateProfile } from '@/lib/auth-helpers'
import { redirect } from 'next/navigation'

export default async function ProfilePage() {
  const email = await getAuthUserEmail()
  if (!email) redirect('/login')

  const profile = await getOrCreateProfile(email)

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">내 프로파일</h1>
      <ProfileForm initialData={profile} />
    </div>
  )
}
