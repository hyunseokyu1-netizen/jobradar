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

// ── 다운로드(PDF/DOCX)용 정규화 렌더 모델 ──────────────────────
export interface RenderResume {
  name: string
  title: string
  contact: string
  summary?: string
  labels: { summary: string; experience: string; skills: string; education: string }
  experiences: { org: string; period: string; bullets: string[] }[]
  skills: string[]
  education: { text: string; period: string }[]
  accent: string
}

const KO_LABELS = { summary: '경력 요약', experience: '경력', skills: '스킬', education: '학력' }
const EN_LABELS = { summary: 'Summary', experience: 'Experience', skills: 'Skills', education: 'Education' }

// StudioResume(한/영) → RenderResume (숨김 항목 제외)
export function studioToRender(
  r: StudioResume,
  contact: string,
  lang: 'ko' | 'en',
  accent = '#046C4E'
): RenderResume {
  const exps = r.experience.filter(e => !e.hidden)
  const edu = r.education.filter(e => !e.hidden)
  return {
    name: r.name,
    title: r.title || exps[0]?.position || '',
    contact,
    summary: r.summary || undefined,
    labels: lang === 'ko' ? KO_LABELS : EN_LABELS,
    experiences: exps.map(e => ({
      org: [e.company, e.position].filter(Boolean).join(' — '),
      period: e.period,
      bullets: e.description.split('\n').map(l => l.replace(/^[-•\s]+/, '').trim()).filter(Boolean),
    })),
    skills: r.skills.filter(s => !r.hidden_skills.includes(s)),
    education: edu.map(e => ({ text: [e.school, e.major, e.degree].filter(Boolean).join(' · '), period: e.period })),
    accent,
  }
}

// ResumeDocumentData(영문 표시 문서) → RenderResume
export function docToRender(doc: ResumeDocumentData, accent = '#046C4E'): RenderResume {
  return {
    name: doc.name,
    title: doc.title,
    contact: doc.contact,
    summary: doc.summary || undefined,
    labels: EN_LABELS,
    experiences: doc.experiences.map(e => ({ org: e.org, period: e.period, bullets: e.bullets.map(b => b.text) })),
    skills: doc.skills,
    education: doc.education.filter(e => e.org).map(e => ({ text: e.org, period: e.period })),
    accent,
  }
}

// RenderResume → 인쇄용 body HTML (download.ts의 printResumeHtml 스타일과 매칭)
export function renderResumeHtml(r: RenderResume): string {
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const parts: string[] = []
  parts.push(`<h1>${esc(r.name)}</h1>`)
  if (r.title) parts.push(`<div class="title">${esc(r.title)}</div>`)
  parts.push(`<div class="contact">${esc(r.contact)}</div>`)
  if (r.summary) parts.push(`<div class="label">${esc(r.labels.summary)}</div><p>${esc(r.summary).replace(/\n/g, '<br>')}</p>`)
  if (r.experiences.length) {
    parts.push(`<div class="label">${esc(r.labels.experience)}</div>`)
    for (const e of r.experiences) {
      parts.push(`<div class="exp"><div class="exp-head"><span>${esc(e.org)}</span><span class="period">${esc(e.period)}</span></div><ul>${e.bullets.map(b => `<li>${esc(b)}</li>`).join('')}</ul></div>`)
    }
  }
  if (r.skills.length) parts.push(`<div class="label">${esc(r.labels.skills)}</div><div>${r.skills.map(s => `<span class="chip">${esc(s)}</span>`).join('')}</div>`)
  if (r.education.length) {
    parts.push(`<div class="label">${esc(r.labels.education)}</div>`)
    for (const e of r.education) parts.push(`<div class="exp-head"><span>${esc(e.text)}</span><span class="period">${esc(e.period)}</span></div>`)
  }
  return parts.join('')
}

// StudioResume → 렌더용 ResumeDocumentData (숨김 항목 제외). 클라이언트에서도 사용 가능.
export function studioToDoc(r: StudioResume, contact: string): ResumeDocumentData {
  const exps = r.experience.filter(e => !e.hidden)
  const edu = r.education.filter(e => !e.hidden)
  return {
    name: r.name,
    title: r.title || exps[0]?.position || '',
    contact,
    summary: r.summary || undefined,
    experiences: exps.map(e => ({
      org: [e.company, e.position].filter(Boolean).join(' — '),
      period: e.period,
      bullets: e.description.split('\n').map(l => l.replace(/^[-•\s]+/, '').trim()).filter(Boolean).map(text => ({ text })),
    })),
    skills: r.skills.filter(s => !r.hidden_skills.includes(s)),
    education: edu.map(e => ({
      org: [e.school, e.major || e.degree].filter(Boolean).join(' — '),
      period: e.period,
    })),
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
