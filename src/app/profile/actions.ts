'use server'

import { revalidatePath } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { parseResumeFile } from '@/lib/resume-parser'
import { getAuthUserEmail, getOrCreateProfile } from '@/lib/auth-helpers'
import type { StudioResume, StudioExp, StudioEdu, StudioDesign } from '@/lib/resume'
export type { StudioResume, StudioExp, StudioEdu, StudioDesign } from '@/lib/resume'

// 매칭 설정 저장 (이름·스킬·경력 요약은 이력서 스튜디오에서 관리)
export async function saveProfile(formData: FormData): Promise<{ error?: string }> {
  const email = await getAuthUserEmail()
  if (!email) return { error: '로그인이 필요합니다.' }

  const positionsRaw = (formData.get('desired_positions') as string) ?? ''
  const locationsRaw = (formData.get('desired_locations') as string) ?? ''

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
      desired_positions,
      desired_locations,
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

// ── 이력서 스튜디오 (섹션 에디터 + 실시간 미리보기) ──────────────

const ACCENT_WHITELIST = ['#046C4E', '#1A56DB', '#1F2A37', '#B45309']

// 클라이언트 입력을 신뢰하지 않고 필드별로 정제 (길이 상한 포함)
function sanitizeStudio(input: StudioResume): StudioResume {
  const s = (v: unknown, max = 200) => (typeof v === 'string' ? v.trim().slice(0, max) : '')
  const arr = <T,>(v: unknown, max: number): T[] => (Array.isArray(v) ? v.slice(0, max) : [])
  const design = input.design
  return {
    name: s(input.name, 100),
    phone: s(input.phone, 50),
    title: s(input.title, 100),
    summary: s(input.summary, 3000),
    skills: arr<string>(input.skills, 60).map(v => s(v, 60)).filter(Boolean),
    hidden_skills: arr<string>(input.hidden_skills, 60).map(v => s(v, 60)).filter(Boolean),
    experience: arr<StudioExp>(input.experience, 20).map(e => ({
      company: s(e?.company), position: s(e?.position), period: s(e?.period, 60),
      description: s(e?.description, 4000), hidden: !!e?.hidden,
    })),
    education: arr<StudioEdu>(input.education, 10).map(e => ({
      school: s(e?.school), major: s(e?.major), degree: s(e?.degree), period: s(e?.period, 60),
      hidden: !!e?.hidden,
    })),
    design: design
      ? {
          template: design.template === 'modern' ? 'modern' : 'classic',
          font: ['plex', 'geist', 'serif'].includes(design.font) ? design.font : 'plex',
          lineHeight: Math.min(2.0, Math.max(1.4, Number(design.lineHeight) || 1.75)),
          accent: ACCENT_WHITELIST.includes(design.accent) ? design.accent : ACCENT_WHITELIST[0],
        }
      : undefined,
  }
}

/** 이력서 스튜디오의 한국어 원본 + 디자인 설정 저장 */
export async function saveResumeStudio(input: StudioResume): Promise<{ error?: string }> {
  const email = await getAuthUserEmail()
  if (!email) return { error: '로그인이 필요합니다.' }

  const profile = await getOrCreateProfile(email)
  if (!profile) return { error: 'Profile not found' }

  const ko = sanitizeStudio(input)
  const koObj = {
    ...((profile.onboarding_ko ?? {}) as Record<string, unknown>),
    ...ko,
  }

  const { error } = await supabaseAdmin
    .from('profiles')
    .update({
      onboarding_ko: koObj,
      ...(ko.name ? { name: ko.name } : {}),
      ...(ko.phone ? { phone: ko.phone } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq('id', profile.id)

  if (error) return { error: error.message }

  revalidatePath('/profile')
  revalidatePath('/')
  return {}
}

/**
 * 스튜디오 원본(한국어/혼용)을 저장하고 영어판(onboarding_en)으로 동기화.
 * 반환된 en으로 클라이언트 미리보기를 즉시 갱신한다.
 */
export async function syncResumeEnglish(
  input: StudioResume
): Promise<{ en?: StudioResume; error?: string }> {
  const email = await getAuthUserEmail()
  if (!email) return { error: '로그인이 필요합니다.' }

  const profile = await getOrCreateProfile(email)
  if (!profile) return { error: 'Profile not found' }

  const ko = sanitizeStudio(input)

  interface RawEn {
    name?: string; phone?: string; title?: string; summary?: string
    skills?: string[]
    experience?: { company?: string; position?: string; period?: string; description?: string }[]
    education?: { school?: string; major?: string; degree?: string; period?: string }[]
  }
  let raw: RawEn
  try {
    const { anthropic } = await import('@/lib/claude')
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 8000,
      messages: [{
        role: 'user',
        content: `아래는 구조화된 이력서 JSON입니다(한국어 또는 한/영 혼용). 동일한 구조의 자연스러운 영어 버전으로 번역해 JSON으로만 응답하세요. 다른 텍스트는 절대 포함하지 마세요.

규칙:
- 이력서에 있는 사실만 사용하고 절대 지어내지 마세요.
- skills 는 입력과 같은 개수·순서로 1:1 번역 (이미 영문인 항목은 그대로).
- name/phone/period 는 번역하지 않고 원본 표기 유지.
- experience.description 은 줄바꿈(\\n) 구분을 유지하고 줄 수도 동일하게.
- hidden, hidden_skills, design 필드는 출력하지 마세요.

입력:
${JSON.stringify({ name: ko.name, phone: ko.phone, title: ko.title, summary: ko.summary, skills: ko.skills, experience: ko.experience.map(({ hidden: _h, ...e }) => e), education: ko.education.map(({ hidden: _h, ...e }) => e) })}`,
      }],
    })
    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    const m = text.match(/\{[\s\S]*\}/)
    if (!m) throw new Error('JSON 응답을 찾을 수 없습니다.')
    raw = JSON.parse(m[0])
  } catch (e) {
    console.error('Resume EN sync error:', e)
    return { error: '영어 동기화 중 오류가 발생했어요. 잠시 후 다시 시도해주세요.' }
  }

  // hidden 플래그는 인덱스 기준으로 원본에서 복사 (skills 는 1:1 계약)
  const en: StudioResume = {
    name: raw.name || ko.name,
    phone: raw.phone || ko.phone,
    title: raw.title ?? '',
    summary: raw.summary ?? '',
    skills: Array.isArray(raw.skills) ? raw.skills.map(v => String(v)) : [],
    hidden_skills: [],
    experience: (raw.experience ?? []).map((e, i) => ({
      company: e.company ?? '', position: e.position ?? '', period: e.period ?? '',
      description: e.description ?? '', hidden: ko.experience[i]?.hidden ?? false,
    })),
    education: (raw.education ?? []).map((e, i) => ({
      school: e.school ?? '', major: e.major ?? '', degree: e.degree ?? '', period: e.period ?? '',
      hidden: ko.education[i]?.hidden ?? false,
    })),
    design: ko.design,
  }
  en.hidden_skills = ko.skills
    .map((s, i) => (ko.hidden_skills.includes(s) ? en.skills[i] : null))
    .filter((v): v is string => !!v)

  const koObj = { ...((profile.onboarding_ko ?? {}) as Record<string, unknown>), ...ko }
  const enObj = { ...((profile.onboarding_en ?? {}) as Record<string, unknown>), ...en }
  const visibleEnSkills = en.skills.filter(s => !en.hidden_skills.includes(s))

  const { error } = await supabaseAdmin
    .from('profiles')
    .update({
      onboarding_ko: koObj,
      onboarding_en: enObj,
      onboarding_completed: true,
      // 매칭/커버레터가 읽는 flat 컬럼 동기화
      ...(ko.name ? { name: ko.name } : {}),
      ...(ko.phone ? { phone: ko.phone } : {}),
      ...(visibleEnSkills.length ? { skills: visibleEnSkills } : {}),
      ...(en.summary ? { career_summary: en.summary } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq('id', profile.id)

  if (error) return { error: error.message }

  revalidatePath('/profile')
  revalidatePath('/')
  revalidatePath('/workspace')
  return { en }
}

/**
 * AI 어시스턴트로 이력서(한국어 원본)를 대화형으로 수정한다.
 * 지시사항에 따라 ko를 재작성 → 영어(en) 재동기화 → 저장 → 갱신된 ko/en 반환.
 * 워크스페이스 하단 채팅에서 호출한다.
 */
export async function chatEditResume(
  instruction: string,
  current: StudioResume,
  jobContext?: { title?: string; company?: string; description?: string }
): Promise<{ ko?: StudioResume; en?: StudioResume; reply?: string; error?: string }> {
  const email = await getAuthUserEmail()
  if (!email) return { error: '로그인이 필요합니다.' }
  if (!instruction.trim()) return { error: '수정 요청을 입력해주세요.' }

  const profile = await getOrCreateProfile(email)
  if (!profile) return { error: 'Profile not found' }

  const ko = sanitizeStudio(current)

  const jobBlock = jobContext?.title
    ? `\n\n[참고: 타깃 공고]\n${jobContext.title}${jobContext.company ? ` @ ${jobContext.company}` : ''}\n${(jobContext.description ?? '').slice(0, 2000)}`
    : ''

  interface RawKo {
    title?: string; summary?: string
    skills?: string[]
    experience?: { company?: string; position?: string; period?: string; description?: string }[]
    education?: { school?: string; major?: string; degree?: string; period?: string }[]
    reply?: string
  }
  let raw: RawKo
  try {
    const { anthropic } = await import('@/lib/claude')
    const message = await anthropic.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 8000,
      thinking: { type: 'adaptive' },
      messages: [{
        role: 'user',
        content: `당신은 해외 취업 이력서 컨설턴트입니다. 아래 구직자의 [현재 이력서(한국어)]를 [수정 요청]에 따라 다시 작성하세요. JSON으로만 응답하세요. 다른 텍스트는 절대 포함하지 마세요.

형식:
{
  "title": "직함",
  "summary": "경력 요약",
  "skills": ["스킬..."],
  "experience": [{"company": "", "position": "", "period": "", "description": "성과를 줄바꿈(\\n)으로 구분"}],
  "education": [{"school": "", "major": "", "degree": "", "period": ""}],
  "reply": "수정 내용을 한국어 한두 문장으로 요약한 답변"
}

규칙:
- 이력서에 있는 사실만 사용하고 경력·수치·회사명을 절대 지어내거나 과장하지 마세요.
- 수정 요청과 무관한 항목은 현재 내용을 그대로 유지하세요.
- 모든 텍스트는 한국어로 작성하세요(회사명·기간·고유명사 제외).
- experience/education의 개수와 순서는 요청이 없으면 유지하세요.
- reply 에는 무엇을 어떻게 바꿨는지 사용자에게 설명하는 한국어 문장을 넣으세요.

[현재 이력서(한국어)]
${JSON.stringify({ title: ko.title, summary: ko.summary, skills: ko.skills, experience: ko.experience.filter(e => !e.hidden).map(({ hidden: _h, ...e }) => e), education: ko.education.filter(e => !e.hidden).map(({ hidden: _h, ...e }) => e) })}

[수정 요청]
${instruction}${jobBlock}`,
      }],
    })
    const textBlock = message.content.find(b => b.type === 'text')
    const text = textBlock?.type === 'text' ? textBlock.text : ''
    const m = text.match(/\{[\s\S]*\}/)
    if (!m) throw new Error('JSON 응답을 찾을 수 없습니다.')
    raw = JSON.parse(m[0])
  } catch (e) {
    console.error('Resume chat edit error:', e)
    return { error: '수정 중 오류가 발생했어요. 잠시 후 다시 시도해주세요.' }
  }

  // 숨김 항목은 보존하고, 보이던 항목만 AI 결과로 교체
  const hiddenExp = ko.experience.filter(e => e.hidden)
  const hiddenEdu = ko.education.filter(e => e.hidden)
  const nextKo: StudioResume = sanitizeStudio({
    ...ko,
    title: raw.title ?? ko.title,
    summary: raw.summary ?? ko.summary,
    skills: Array.isArray(raw.skills) && raw.skills.length ? raw.skills.map(String) : ko.skills,
    experience: [
      ...(raw.experience ?? []).map(e => ({
        company: e.company ?? '', position: e.position ?? '', period: e.period ?? '',
        description: e.description ?? '', hidden: false,
      })),
      ...hiddenExp,
    ],
    education: [
      ...(raw.education ?? []).map(e => ({
        school: e.school ?? '', major: e.major ?? '', degree: e.degree ?? '', period: e.period ?? '',
        hidden: false,
      })),
      ...hiddenEdu,
    ],
  })

  // 저장 + 영어 재동기화 (syncResumeEnglish가 ko/en 모두 저장)
  const sync = await syncResumeEnglish(nextKo)
  if (sync.error) return { error: sync.error }

  return {
    ko: nextKo,
    en: sync.en,
    reply: typeof raw.reply === 'string' && raw.reply.trim() ? raw.reply.trim() : '요청하신 대로 이력서를 수정했어요.',
  }
}

/**
 * 업로드된 이력서 원문(resume_text)을 구조화 이력서(onboarding_ko/en)로 변환한다.
 * 온보딩 채팅을 건너뛴 유저도 워크스페이스(원본↔영문 비교·AI 최적화)를 쓸 수 있게 하는 연결 고리.
 */
export async function structureResumeForWorkspace(): Promise<{ error?: string }> {
  const email = await getAuthUserEmail()
  if (!email) return { error: '로그인이 필요합니다.' }

  const profile = await getOrCreateProfile(email)
  if (!profile) return { error: 'Profile not found' }
  if (!profile.resume_text?.trim()) {
    return { error: '프로필 페이지에서 이력서를 먼저 업로드해주세요.' }
  }

  interface StructuredResume {
    name?: string
    phone?: string
    summary?: string
    skills?: string[]
    experience?: { company?: string; position?: string; period?: string; description?: string }[]
    education?: { school?: string; major?: string; degree?: string; period?: string }[]
  }
  let parsed: { ko?: StructuredResume; en?: StructuredResume; career_summary_en?: string }
  try {
    const { anthropic } = await import('@/lib/claude')
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 8000,
      messages: [{
        role: 'user',
        content: `당신은 이력서 구조화 도우미입니다. 아래 이력서 원문을 구조화하고 한국어/영어 두 버전으로 정리하세요. JSON으로만 응답하세요. 다른 텍스트는 절대 포함하지 마세요.

형식:
{
  "ko": {
    "name": "", "phone": "", "summary": "",
    "skills": [],
    "experience": [{"company": "", "position": "", "period": "", "description": ""}],
    "education": [{"school": "", "major": "", "degree": "", "period": ""}]
  },
  "en": { "...ko와 동일 구조, 영어..." },
  "career_summary_en": ""
}

규칙:
- 이력서에 있는 사실만 사용하고 절대 지어내지 마세요. 정보가 없는 필드는 "" 또는 [].
- experience.description 은 각 성과·업무를 줄바꿈(\\n)으로 구분한 문장들로 정리 (마크다운 기호 없이).
- 이력서가 영어면 en은 원문 표현을 최대한 유지하고 ko는 자연스러운 한국어 번역. 한국어 이력서면 반대.
- 이름(name)·전화번호(phone)·기간(period)은 번역하지 않고 원본 표기 유지.
- skills 는 개별 항목 배열, 최대 40개.
- career_summary_en 은 3~5문장 영어 경력 요약 (평문, 마크다운 없이).

이력서 원문:
${profile.resume_text.slice(0, 8000)}`,
      }],
    })
    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    const m = text.match(/\{[\s\S]*\}/)
    if (!m) throw new Error('JSON 응답을 찾을 수 없습니다.')
    parsed = JSON.parse(m[0])
  } catch (e) {
    console.error('Resume structuring error:', e)
    return { error: '이력서 분석 중 오류가 발생했어요. 잠시 후 다시 시도해주세요.' }
  }

  const ko = parsed.ko ?? {}
  const en = parsed.en ?? {}
  if (!en.experience?.length && !en.skills?.length && !en.summary) {
    return { error: '이력서에서 경력 정보를 찾지 못했어요. 프로필에서 이력서를 확인해주세요.' }
  }

  // 기존 onboarding 데이터가 일부 있으면 보존하며 병합 (이번 추출이 비어있는 키는 덮지 않음)
  const koObj = { ...((profile.onboarding_ko ?? {}) as Record<string, unknown>) }
  const enObj = { ...((profile.onboarding_en ?? {}) as Record<string, unknown>) }
  for (const [target, src] of [[koObj, ko], [enObj, en]] as const) {
    if (src.summary) target.summary = src.summary
    if (src.skills?.length) target.skills = src.skills
    if (src.experience?.length) target.experience = src.experience
    if (src.education?.length) target.education = src.education
    if (src.name) target.name = src.name
    if (src.phone) target.phone = src.phone
  }

  const { error } = await supabaseAdmin
    .from('profiles')
    .update({
      onboarding_ko: koObj,
      onboarding_en: enObj,
      onboarding_completed: true,
      // 매칭/커버레터가 읽는 flat 컬럼 동기화 (기존 값이 있으면 유지)
      skills: profile.skills?.length ? profile.skills : (en.skills ?? []),
      career_summary: profile.career_summary?.trim()
        ? profile.career_summary
        : (parsed.career_summary_en ?? ''),
      updated_at: new Date().toISOString(),
    })
    .eq('id', profile.id)

  if (error) return { error: error.message }

  revalidatePath('/')
  revalidatePath('/profile')
  revalidatePath('/workspace')
  return {}
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
