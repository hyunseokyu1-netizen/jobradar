'use server'

import { revalidatePath } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { parseResumeFile } from '@/lib/resume-parser'
import { getAuthUserEmail, getOrCreateProfile } from '@/lib/auth-helpers'

export async function saveProfile(formData: FormData): Promise<{ error?: string }> {
  const email = await getAuthUserEmail()
  if (!email) return { error: '로그인이 필요합니다.' }

  const skillsRaw = formData.get('skills') as string
  const positionsRaw = formData.get('desired_positions') as string
  const locationsRaw = formData.get('desired_locations') as string

  const skills = skillsRaw.split(',').map(s => s.trim()).filter(Boolean)
  const desired_positions = positionsRaw.split(',').map(s => s.trim()).filter(Boolean)
  const desired_locations = locationsRaw.split(',').map(s => s.trim()).filter(Boolean)

  const salary_min = parseInt(formData.get('salary_min') as string) || null
  const salary_max = parseInt(formData.get('salary_max') as string) || null
  const salary_currency = (formData.get('salary_currency') as string) || 'AUD'

  const profile = await getOrCreateProfile(email)
  if (!profile) return { error: 'Profile not found' }

  const { error } = await supabaseAdmin
    .from('profiles')
    .update({
      name: formData.get('name') as string,
      skills,
      desired_positions,
      desired_locations,
      career_summary: formData.get('career_summary') as string,
      preferences: { salary_min, salary_max, salary_currency },
      updated_at: new Date().toISOString(),
    })
    .eq('id', profile.id)

  if (error) {
    console.error('Profile save error:', error)
    return { error: error.message }
  }

  revalidatePath('/profile')
  return {}
}

export async function generateCareerSummary(): Promise<{ summary?: string; error?: string }> {
  const email = await getAuthUserEmail()
  if (!email) return { error: '로그인이 필요합니다.' }

  const profile = await getOrCreateProfile(email)
  if (!profile?.resume_text) return { error: '이력서를 먼저 업로드해주세요.' }

  const { anthropic } = await import('@/lib/claude')
  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 400,
    messages: [{
      role: 'user',
      content: `아래 이력서를 바탕으로 AI 채용 매칭 및 커버레터 생성에 활용될 경력 요약을 영어로 작성해주세요.

요구사항:
- 3~5문장, 150단어 이내
- 총 경력 연수, 핵심 기술 스택, 주요 도메인/산업 포함
- 강점과 차별점 강조
- 평문(plain text)으로만 작성, 마크다운 없이

이력서:
${profile.resume_text.slice(0, 4000)}`,
    }],
  })

  const summary = message.content[0].type === 'text' ? message.content[0].text.trim() : ''
  return { summary }
}

// ── 이력서 섹션 번역 ──────────────────────────────────────────
// 유저가 한국어로 작성 → 섹션별 "번역" → Claude가 구조화·영어 번역.
// 한국어(편집 원본)는 onboarding_ko, 영어(앱이 사용하는 결과)는 onboarding_en에 저장하고
// 매칭/커버레터가 읽는 flat 컬럼(skills, career_summary)도 동기화한다.

export type ResumeSection = 'summary' | 'experience' | 'education' | 'skills'

const SECTION_PROMPT: Record<ResumeSection, (ko: string) => string> = {
  summary: ko => `다음 한국어 경력 요약을 자연스러운 영어로 번역하세요. JSON으로만 응답하세요. 다른 텍스트 금지.
형식: {"en": "<영어 요약, 평문, 마크다운 없이>"}

한국어:
${ko}`,
  skills: ko => `다음 한국어로 적힌 기술/스킬 목록을 표준 영어 표기로 정리하세요. JSON으로만 응답하세요.
형식: {"ko": ["한국어 항목..."], "en": ["English item..."]}
규칙: 쉼표/줄바꿈으로 구분, 각 항목 trim, 중복 제거, 최대 40개, ko와 en은 1:1 대응.

입력:
${ko}`,
  experience: ko => `다음은 구직자가 한국어로 자유롭게 적은 경력입니다. 각 항목을 구조화하고 영어로 번역하세요. JSON으로만 응답하세요.
형식: {"ko": [{"company":"","position":"","period":"","description":""}], "en": [{"company":"","position":"","period":"","description":""}]}
규칙: 빈 줄로 항목을 구분. 정보가 없는 필드는 "". 절대 지어내지 마세요. ko/en은 같은 개수·순서.

입력:
${ko}`,
  education: ko => `다음은 구직자가 한국어로 적은 학력입니다. 각 항목을 구조화하고 영어로 번역하세요. JSON으로만 응답하세요.
형식: {"ko": [{"school":"","major":"","degree":"","period":""}], "en": [{"school":"","major":"","degree":"","period":""}]}
규칙: 빈 줄로 항목을 구분. 정보가 없는 필드는 "". 절대 지어내지 마세요. ko/en은 같은 개수·순서.

입력:
${ko}`,
}

export async function translateResumeSection(
  section: ResumeSection,
  koText: string
): Promise<{ ko?: unknown; en?: unknown; error?: string }> {
  const email = await getAuthUserEmail()
  if (!email) return { error: '로그인이 필요합니다.' }

  const profile = await getOrCreateProfile(email)
  if (!profile) return { error: 'Profile not found' }

  if (!koText.trim()) return { error: '먼저 한국어로 내용을 작성해주세요.' }

  let parsed: { ko?: unknown; en?: unknown }
  try {
    const { anthropic } = await import('@/lib/claude')
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2000,
      messages: [{ role: 'user', content: SECTION_PROMPT[section](koText) }],
    })
    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    const m = text.match(/\{[\s\S]*\}/)
    if (!m) throw new Error('JSON 응답을 찾을 수 없습니다.')
    parsed = JSON.parse(m[0])
  } catch (e) {
    console.error('Resume section translate error:', e)
    return { error: '번역 중 오류가 발생했어요. 잠시 후 다시 시도해주세요.' }
  }

  const koObj = (profile.onboarding_ko ?? {}) as Record<string, unknown>
  const enObj = (profile.onboarding_en ?? {}) as Record<string, unknown>
  const flatPatch: Record<string, unknown> = {}

  let savedKo: unknown
  let savedEn: unknown

  if (section === 'summary') {
    savedKo = koText
    savedEn = typeof parsed.en === 'string' ? parsed.en : ''
    koObj.summary = savedKo
    enObj.summary = savedEn
    flatPatch.career_summary = savedEn
  } else if (section === 'skills') {
    savedKo = Array.isArray(parsed.ko) ? parsed.ko : []
    savedEn = Array.isArray(parsed.en) ? parsed.en : []
    koObj.skills = savedKo
    enObj.skills = savedEn
    flatPatch.skills = savedEn
  } else {
    // experience | education
    savedKo = Array.isArray(parsed.ko) ? parsed.ko : []
    savedEn = Array.isArray(parsed.en) ? parsed.en : []
    koObj[section] = savedKo
    enObj[section] = savedEn
  }

  const { error } = await supabaseAdmin
    .from('profiles')
    .update({
      onboarding_ko: koObj,
      onboarding_en: enObj,
      ...flatPatch,
      updated_at: new Date().toISOString(),
    })
    .eq('id', profile.id)

  if (error) return { error: error.message }

  revalidatePath('/profile')
  revalidatePath('/')
  return { ko: savedKo, en: savedEn }
}

interface ExtractedProfile {
  name?: string
  skills?: string[]
  desired_positions?: string[]
  desired_locations?: string[]
}

export async function uploadResume(formData: FormData): Promise<{
  text?: string
  extracted?: ExtractedProfile
  error?: string
}> {
  const email = await getAuthUserEmail()
  if (!email) return { error: '로그인이 필요합니다.' }

  const file = formData.get('resume') as File | null
  if (!file || file.size === 0) return { error: '파일을 선택해주세요.' }
  if (file.size > 5 * 1024 * 1024) return { error: '파일 크기는 5MB 이하여야 합니다.' }

  try {
    const text = await parseResumeFile(file)
    if (!text) return { error: '텍스트를 추출할 수 없습니다.' }

    const profile = await getOrCreateProfile(email)
    if (!profile) return { error: 'Profile not found' }

    // DOCX 원본 보관 — 양식 유지 맞춤 이력서 생성에 사용
    let resumeFilePath: string | null = null
    if (file.name.toLowerCase().endsWith('.docx')) {
      const buffer = Buffer.from(await file.arrayBuffer())
      const path = `${profile.id}/original.docx`
      const doUpload = () =>
        supabaseAdmin.storage.from('resumes').upload(path, buffer, {
          upsert: true,
          contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        })

      let { error: uploadError } = await doUpload()
      if (uploadError?.message?.includes('Bucket not found')) {
        await supabaseAdmin.storage.createBucket('resumes', { public: false })
        ;({ error: uploadError } = await doUpload())
      }
      if (!uploadError) resumeFilePath = path
      else console.error('Resume file upload error:', uploadError)
    }

    const { anthropic } = await import('@/lib/claude')
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 600,
      messages: [{
        role: 'user',
        content: `아래 이력서에서 정보를 추출해 JSON으로만 응답해주세요. 다른 텍스트는 절대 포함하지 마세요.

JSON 형식:
{
  "name": "영문 full name (없으면 null)",
  "skills": ["기술스택 배열, 최대 20개"],
  "desired_positions": ["지원 가능한 직무 타이틀 배열, 최대 5개, 영문"],
  "desired_locations": ["현재 거주지 또는 이력서에 나온 지역 배열, 최대 3개"]
}

이력서:
${text.slice(0, 5000)}`,
      }],
    })

    let extracted: ExtractedProfile = {}
    if (message.content[0].type === 'text') {
      try {
        const raw = message.content[0].text.trim()
        const jsonMatch = raw.match(/\{[\s\S]*\}/)
        if (jsonMatch) extracted = JSON.parse(jsonMatch[0])
      } catch {
        // 파싱 실패 시 빈 객체로 진행
      }
    }

    const patch: Record<string, unknown> = { resume_text: text, updated_at: new Date().toISOString() }
    if (resumeFilePath) {
      patch.resume_file_path = resumeFilePath
      patch.resume_file_name = file.name
    }

    const { error } = await supabaseAdmin
      .from('profiles')
      .update(patch)
      .eq('id', profile.id)

    if (error) return { error: error.message }

    revalidatePath('/profile')
    return { text, extracted }
  } catch (e) {
    return { error: String(e) }
  }
}
