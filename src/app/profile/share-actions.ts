'use server'

import { revalidatePath } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getAuthUserEmail, getOrCreateProfile } from '@/lib/auth-helpers'

// 공개 URL 식별자용 슬러그 (소문자+숫자 10자, 추측 어렵게 랜덤)
function genSlug(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  const bytes = globalThis.crypto.getRandomValues(new Uint8Array(10))
  return Array.from(bytes, b => chars[b % chars.length]).join('')
}

export interface PublicResumeState {
  enabled: boolean
  slug: string | null
}

export async function getPublicResumeState(): Promise<PublicResumeState> {
  const email = await getAuthUserEmail()
  if (!email) return { enabled: false, slug: null }

  const profile = await getOrCreateProfile(email)
  if (!profile) return { enabled: false, slug: null }

  return {
    enabled: !!(profile as { public_resume_enabled?: boolean }).public_resume_enabled,
    slug: (profile as { public_slug?: string | null }).public_slug ?? null,
  }
}

/**
 * 공개 이력서 공유를 켜거나 끈다.
 * 켤 때 슬러그가 없으면 생성한다(유일성 충돌 시 재시도). 슬러그는 한 번 생기면 유지한다.
 */
export async function setPublicResume(
  enable: boolean
): Promise<{ enabled?: boolean; slug?: string | null; error?: string }> {
  const email = await getAuthUserEmail()
  if (!email) return { error: '로그인이 필요합니다.' }

  const profile = await getOrCreateProfile(email)
  if (!profile) return { error: 'Profile not found' }

  // 공개하려면 영문 이력서에 최소한의 내용이 있어야 함
  if (enable) {
    const en = (profile.onboarding_en ?? {}) as { experience?: unknown[]; skills?: unknown[]; summary?: string }
    const hasContent = !!(en.summary || (en.skills?.length ?? 0) > 0 || (en.experience?.length ?? 0) > 0)
    if (!hasContent) {
      return { error: '공개할 영문 이력서가 없습니다. 먼저 이력서를 작성하고 "영어로 동기화"를 눌러주세요.' }
    }
  }

  let slug = (profile as { public_slug?: string | null }).public_slug ?? null

  // 켜는데 슬러그가 없으면 생성 (유일성 보장 위해 몇 회 재시도)
  if (enable && !slug) {
    for (let attempt = 0; attempt < 6; attempt++) {
      const candidate = genSlug()
      const { error } = await supabaseAdmin
        .from('profiles')
        .update({ public_slug: candidate, public_resume_enabled: true, updated_at: new Date().toISOString() })
        .eq('id', profile.id)
      if (!error) {
        slug = candidate
        break
      }
      // 23505 = unique_violation → 다른 슬러그로 재시도
      if (error.code !== '23505') return { error: error.message }
    }
    if (!slug) return { error: '공유 링크 생성에 실패했습니다. 잠시 후 다시 시도해주세요.' }
  } else {
    const { error } = await supabaseAdmin
      .from('profiles')
      .update({ public_resume_enabled: enable, updated_at: new Date().toISOString() })
      .eq('id', profile.id)
    if (error) return { error: error.message }
  }

  revalidatePath('/profile')
  if (slug) revalidatePath(`/r/${slug}`)
  return { enabled: enable, slug }
}
