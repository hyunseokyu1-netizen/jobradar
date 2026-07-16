'use server'

import { revalidatePath } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { anthropic, textOf } from '@/lib/claude'
import { getAuthUserEmail, getOrCreateProfile } from '@/lib/auth-helpers'
import type { OnboardingAnswers } from './questions'

// 구조화된 프로필 (ko/en 공통 shape)
interface StructuredProfile {
  name: string
  phone: string
  education: { school: string; major: string; degree: string; period: string }[]
  experience: { company: string; position: string; period: string; description: string }[]
  skills: string[]
  desired: {
    positions: string[]
    locations: string[]
    salary_min: number | null
    salary_max: number | null
    salary_currency: string
  }
}

interface TranslationResult {
  ko: StructuredProfile
  en: StructuredProfile
  career_summary_en: string
}

const PROMPT = (answers: OnboardingAnswers) => `당신은 채용 프로필 정리 도우미입니다.
아래는 구직자가 한국어로 자유롭게 답한 온보딩 답변입니다. 이를 구조화하고 영어로 번역해주세요.

[입력 답변]
이름: ${answers.name || '(없음)'}
전화번호: ${answers.phone || '(없음)'}
학력:
${answers.education.map((e, i) => `  ${i + 1}. ${e}`).join('\n') || '  (없음)'}
경력:
${answers.experience.map((e, i) => `  ${i + 1}. ${e}`).join('\n') || '  (없음)'}
스킬: ${answers.skills || '(없음)'}
희망 포지션: ${answers.positions || '(없음)'}
희망 지역: ${answers.locations || '(없음)'}
희망 연봉: ${answers.salary || '(없음)'}

[요구사항]
- 아래 JSON 스키마에 정확히 맞춰 출력하세요. JSON 외 다른 텍스트는 절대 포함하지 마세요.
- "ko"는 한국어로 정리, "en"은 자연스러운 영어로 번역합니다. 두 객체의 구조는 동일해야 합니다.
- 전화번호(phone)는 번역하지 않고 ko/en 모두 원본 그대로 둡니다.
- 정보가 없는 필드는 빈 문자열 "" 또는 빈 배열 []로 둡니다. 절대 지어내지 마세요.
- 학력/경력은 자유 텍스트를 school/major/degree/period 또는 company/position/period/description으로 분리합니다.
- skills는 개별 항목 배열로 분리합니다.
- 희망 연봉에서 숫자 범위와 통화를 추출해 salary_min, salary_max(정수, 없으면 null), salary_currency(예: "USD", "AUD", "KRW")로 넣습니다.
- "career_summary_en"은 경력·스킬을 바탕으로 AI 채용 매칭과 커버레터에 활용할 3~5문장 영어 경력 요약입니다(평문, 마크다운 없이).

[JSON 스키마]
{
  "ko": {
    "name": "", "phone": "",
    "education": [{ "school": "", "major": "", "degree": "", "period": "" }],
    "experience": [{ "company": "", "position": "", "period": "", "description": "" }],
    "skills": [],
    "desired": { "positions": [], "locations": [], "salary_min": null, "salary_max": null, "salary_currency": "USD" }
  },
  "en": { "...ko와 동일 구조, 영어..." },
  "career_summary_en": ""
}`

function extractJson(text: string): TranslationResult {
  // ```json ... ``` 또는 본문 내 첫 { ~ 마지막 } 사이를 파싱
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  const raw = fenced ? fenced[1] : text
  const start = raw.indexOf('{')
  const end = raw.lastIndexOf('}')
  if (start === -1 || end === -1) throw new Error('JSON을 찾을 수 없습니다.')
  return JSON.parse(raw.slice(start, end + 1))
}

export async function completeOnboarding(
  answers: OnboardingAnswers
): Promise<{ error?: string }> {
  const email = await getAuthUserEmail()
  if (!email) return { error: '로그인이 필요합니다.' }

  const profile = await getOrCreateProfile(email)
  if (!profile) return { error: 'Profile not found' }

  let result: TranslationResult
  try {
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2000,
      messages: [{ role: 'user', content: PROMPT(answers) }],
    })
    const text = textOf(message)
    result = extractJson(text)
  } catch (e) {
    console.error('Onboarding translation error:', e)
    // 번역 실패 시 한국어 raw 원본만이라도 보존하고 재시도 안내
    await supabaseAdmin
      .from('profiles')
      .update({ onboarding_ko: answers, updated_at: new Date().toISOString() })
      .eq('id', profile.id)
    return { error: '프로필 정리 중 오류가 발생했어요. 입력 내용은 저장됐으니 잠시 후 다시 시도해주세요.' }
  }

  const en = result.en
  const { error } = await supabaseAdmin
    .from('profiles')
    .update({
      onboarding_ko: result.ko,
      onboarding_en: en,
      onboarding_completed: true,
      // 기존 매칭/커버레터 로직(영어 기반)과 호환되도록 평면 컬럼에 영어 데이터 매핑
      name: en.name || profile.name,
      phone: en.phone || null,
      skills: en.skills ?? [],
      desired_positions: en.desired?.positions ?? [],
      desired_locations: en.desired?.locations ?? [],
      career_summary: result.career_summary_en || '',
      preferences: {
        salary_min: en.desired?.salary_min ?? null,
        salary_max: en.desired?.salary_max ?? null,
        salary_currency: en.desired?.salary_currency || 'USD',
      },
      updated_at: new Date().toISOString(),
    })
    .eq('id', profile.id)

  if (error) {
    console.error('Onboarding save error:', error)
    return { error: error.message }
  }

  revalidatePath('/profile')
  revalidatePath('/')
  return {}
}
