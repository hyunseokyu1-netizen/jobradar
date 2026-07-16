// 구조화 이력서(StudioResume) 한→영 번역. DB 영속화는 호출부(서버 액션)에서 각자 처리한다.
// 마스터 이력서 동기화(profile/actions.ts)와 공고별 초안 동기화(workspace/actions.ts)가 공유한다.
// 주의: @/lib/claude를 import하므로 클라이언트 컴포넌트에서 절대 import하지 말 것 (서버 액션 전용).

import { anthropic, textOf } from '@/lib/claude'
import { sanitizeStudio, type StudioResume } from '@/lib/resume'

export async function translateStudioToEnglish(
  input: StudioResume
): Promise<{ en?: StudioResume; error?: string }> {
  const ko = sanitizeStudio(input)

  interface RawEn {
    name?: string; phone?: string; title?: string; summary?: string
    skills?: string[]
    experience?: { company?: string; position?: string; period?: string; description?: string }[]
    education?: { school?: string; major?: string; degree?: string; period?: string }[]
  }
  let raw: RawEn
  try {
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 8000,
      messages: [{
        role: 'user',
        content: `아래는 구조화된 이력서 JSON입니다(한국어 또는 한/영 혼용). 동일한 구조의 자연스러운 영어 버전으로 번역해 JSON으로만 응답하세요. 다른 텍스트는 절대 포함하지 마세요.

규칙:
- 이력서에 있는 사실만 사용하고 절대 지어내지 마세요.
- skills 는 입력과 같은 개수·순서로 1:1 번역 (이미 영문인 항목은 그대로).
- name 은 영문 이력서 표기(로마자)로 변환하세요. 예: "김지민" → "Jimin Kim". 이미 로마자면 그대로.
- phone/period 는 번역하지 않고 원본 표기 유지.
- experience.description 은 줄바꿈(\\n) 구분을 유지하고 줄 수도 동일하게.
- hidden, hidden_skills, design 필드는 출력하지 마세요.

입력:
${JSON.stringify({ name: ko.name, phone: ko.phone, title: ko.title, summary: ko.summary, skills: ko.skills, experience: ko.experience.map(({ hidden: _h, ...e }) => e), education: ko.education.map(({ hidden: _h, ...e }) => e) })}`,
      }],
    })
    const text = textOf(message)
    const m = text.match(/\{[\s\S]*\}/)
    if (!m) throw new Error('JSON 응답을 찾을 수 없습니다.')
    raw = JSON.parse(m[0])
  } catch (e) {
    console.error('Resume EN translate error:', e)
    return { error: '영어 동기화 중 오류가 발생했어요. 잠시 후 다시 시도해주세요.' }
  }

  // hidden 플래그는 인덱스 기준으로 원본에서 복사 (skills 는 1:1 계약)
  const en: StudioResume = {
    name: raw.name || ko.name,
    phone: raw.phone || ko.phone,
    links: ko.links, // URL은 번역 대상이 아니므로 원본 유지
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

  return { en }
}
