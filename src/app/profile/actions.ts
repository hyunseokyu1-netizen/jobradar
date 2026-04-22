'use server'

import { revalidatePath } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function saveProfile(formData: FormData): Promise<{ error?: string }> {
  const skillsRaw = formData.get('skills') as string
  const positionsRaw = formData.get('desired_positions') as string
  const locationsRaw = formData.get('desired_locations') as string
  const sources = formData.getAll('desired_sources') as string[]

  const skills = skillsRaw.split(',').map(s => s.trim()).filter(Boolean)
  const desired_positions = positionsRaw.split(',').map(s => s.trim()).filter(Boolean)
  const desired_locations = locationsRaw.split(',').map(s => s.trim()).filter(Boolean)

  const salary_min = parseInt(formData.get('salary_min') as string) || null
  const salary_max = parseInt(formData.get('salary_max') as string) || null

  const { error } = await supabaseAdmin
    .from('profiles')
    .update({
      name: formData.get('name') as string,
      skills,
      desired_positions,
      desired_sources: sources,
      desired_locations,
      career_summary: formData.get('career_summary') as string,
      preferences: { salary_min, salary_max },
      updated_at: new Date().toISOString(),
    })
    .eq('email', 'hyunseok.yu1@gmail.com')

  if (error) {
    console.error('Profile save error:', error)
    return { error: error.message }
  }

  revalidatePath('/profile')
  return {}
}
