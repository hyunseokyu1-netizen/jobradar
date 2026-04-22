import { supabaseAdmin } from '@/lib/supabase-admin'
import ProfileForm from './ProfileForm'

export default async function ProfilePage() {
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('email', 'hyunseok.yu1@gmail.com')
    .single()

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">내 프로파일</h1>
      <ProfileForm initialData={profile} />
    </div>
  )
}
