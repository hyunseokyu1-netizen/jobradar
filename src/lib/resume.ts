// 이력서 스튜디오/워크스페이스 공통 구조 타입.
// (onboarding_ko / onboarding_en JSONB에 저장되는 형태)

export interface StudioExp {
  company: string
  position: string
  period: string
  description: string
  hidden?: boolean
}
export interface StudioEdu {
  school: string
  major: string
  degree: string
  period: string
  hidden?: boolean
}
export interface StudioDesign {
  template: 'classic' | 'modern'
  font: 'plex' | 'geist' | 'serif'
  lineHeight: number
  accent: string
}
export interface StudioResume {
  name: string
  phone: string
  title: string
  summary: string
  skills: string[]
  hidden_skills: string[]
  experience: StudioExp[]
  education: StudioEdu[]
  design?: StudioDesign
}

// JSONB 원본을 StudioResume로 정규화
export function toStudioResume(raw: unknown, fallbackName = '', fallbackPhone = ''): StudioResume {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  const s = (v: unknown) => (typeof v === 'string' ? v : '')
  const arr = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : [])
  return {
    name: s(r.name) || fallbackName,
    phone: s(r.phone) || fallbackPhone,
    title: s(r.title),
    summary: s(r.summary),
    skills: arr<string>(r.skills).filter(v => typeof v === 'string'),
    hidden_skills: arr<string>(r.hidden_skills).filter(v => typeof v === 'string'),
    experience: arr<StudioExp>(r.experience).map(e => ({
      company: s(e?.company), position: s(e?.position), period: s(e?.period),
      description: s(e?.description), hidden: !!e?.hidden,
    })),
    education: arr<StudioEdu>(r.education).map(e => ({
      school: s(e?.school), major: s(e?.major), degree: s(e?.degree), period: s(e?.period),
      hidden: !!e?.hidden,
    })),
    design: (r.design as StudioDesign | undefined) ?? undefined,
  }
}

import type { ResumeDocumentData } from '@/lib/matchda/types'

// StudioResume → 렌더용 ResumeDocumentData (숨김 항목 제외). 클라이언트에서도 사용 가능.
export function studioToDoc(r: StudioResume, contact: string): ResumeDocumentData {
  const exps = r.experience.filter(e => !e.hidden)
  const edu = r.education.filter(e => !e.hidden)[0]
  return {
    name: r.name,
    title: r.title || exps[0]?.position || '',
    contact,
    experiences: exps.map(e => ({
      org: [e.company, e.position].filter(Boolean).join(' — '),
      period: e.period,
      bullets: e.description.split('\n').map(l => l.replace(/^[-•\s]+/, '').trim()).filter(Boolean).map(text => ({ text })),
    })),
    skills: r.skills.filter(s => !r.hidden_skills.includes(s)),
    education: edu
      ? { org: [edu.school, edu.major || edu.degree].filter(Boolean).join(' — '), period: edu.period }
      : { org: '', period: '' },
  }
}

// 이력서를 평문 텍스트로 직렬화 (TXT/DOCX 다운로드용)
export function studioToText(r: StudioResume, contact: string): string {
  const lines: string[] = []
  lines.push(r.name)
  if (r.title) lines.push(r.title)
  lines.push([contact, r.phone].filter(Boolean).join(' • '))
  if (r.summary) { lines.push('', 'SUMMARY', r.summary) }

  const exps = r.experience.filter(e => !e.hidden)
  if (exps.length) {
    lines.push('', 'EXPERIENCE')
    for (const e of exps) {
      lines.push('', [e.company, e.position].filter(Boolean).join(' — ') + (e.period ? `  (${e.period})` : ''))
      for (const b of e.description.split('\n').map(l => l.replace(/^[-•\s]+/, '').trim()).filter(Boolean)) {
        lines.push(`• ${b}`)
      }
    }
  }

  const skills = r.skills.filter(s => !r.hidden_skills.includes(s))
  if (skills.length) { lines.push('', 'SKILLS', skills.join(', ')) }

  const edu = r.education.filter(e => !e.hidden)
  if (edu.length) {
    lines.push('', 'EDUCATION')
    for (const e of edu) {
      lines.push([e.school, e.major, e.degree].filter(Boolean).join(' · ') + (e.period ? `  (${e.period})` : ''))
    }
  }
  return lines.join('\n')
}
