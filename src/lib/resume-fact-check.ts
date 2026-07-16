// AI 이력서 수정 결과의 사실 위험 감지.
// 프롬프트의 "지어내지 마세요" 지시만으로는 보장이 안 되므로, 원본과 결과를 코드 레벨에서
// 비교해 민감한 사실(숫자·회사명·기간·스킬·직함)의 변경을 탐지한다.
// 차단이 아니라 경고 — 저장은 허용하되 사용자가 저장 전에 확인하도록 UI에 표시한다.

import type { StudioResume } from '@/lib/resume'

export interface FactWarning {
  kind: 'number' | 'company' | 'period' | 'skill' | 'title'
  message: string
}

// 텍스트에서 숫자 토큰 추출 — 연도·퍼센트·금액·건수 등. 1자리 숫자는 서수·나열로
// 오탐이 많아 제외하고, 2자리 이상만 사실 신호로 본다.
function numberTokens(text: string): Set<string> {
  const tokens = text.match(/\d[\d,.]*/g) ?? []
  return new Set(
    tokens
      .map(t => t.replace(/[,.]+$/, '').replace(/,/g, ''))
      .filter(t => t.length >= 2)
  )
}

function allText(r: StudioResume): string {
  return [
    r.title,
    r.summary,
    ...r.experience.flatMap(e => [e.company, e.position, e.period, e.description]),
    ...r.education.flatMap(e => [e.school, e.major, e.degree, e.period]),
    ...r.skills,
  ]
    .filter(Boolean)
    .join('\n')
}

const norm = (s: string) => s.trim().toLowerCase()

/** 원본 대비 AI 수정본의 사실 변경 감지. 반환이 비어있으면 민감 필드 변화 없음. */
export function checkResumeFacts(original: StudioResume, revised: StudioResume): FactWarning[] {
  const warnings: FactWarning[] = []

  // 1) 원본 어디에도 없던 숫자가 등장 — 성과 수치 날조의 대표 신호
  const origNums = numberTokens(allText(original))
  const addedNums = [...numberTokens(allText(revised))].filter(n => !origNums.has(n))
  if (addedNums.length) {
    warnings.push({
      kind: 'number',
      message: `원본에 없던 숫자가 추가됐어요: ${addedNums.slice(0, 8).join(', ')}${addedNums.length > 8 ? ' 외' : ''}`,
    })
  }

  // 2) 회사명 변경·추가
  const origCompanies = new Set(original.experience.map(e => norm(e.company)).filter(Boolean))
  const addedCompanies = [...new Set(revised.experience.map(e => e.company.trim()).filter(Boolean))]
    .filter(c => !origCompanies.has(norm(c)))
  if (addedCompanies.length) {
    warnings.push({ kind: 'company', message: `원본에 없던 회사명이 있어요: ${addedCompanies.join(', ')}` })
  }

  // 3) 근무·재학 기간 변경
  const origPeriods = new Set(
    [...original.experience, ...original.education].map(e => norm(e.period)).filter(Boolean)
  )
  const addedPeriods = [
    ...new Set([...revised.experience, ...revised.education].map(e => e.period.trim()).filter(Boolean)),
  ].filter(p => !origPeriods.has(norm(p)))
  if (addedPeriods.length) {
    warnings.push({ kind: 'period', message: `기간 표기가 바뀌었어요: ${addedPeriods.join(', ')}` })
  }

  // 4) 원본에 없던 스킬 추가
  const origSkills = new Set(original.skills.map(norm))
  const addedSkills = revised.skills.filter(s => !origSkills.has(norm(s)))
  if (addedSkills.length) {
    warnings.push({
      kind: 'skill',
      message: `원본에 없던 스킬이 추가됐어요: ${addedSkills.slice(0, 10).join(', ')}${addedSkills.length > 10 ? ' 외' : ''}`,
    })
  }

  // 5) 직함 변경 — 공고 직급에 맞춰 임의로 올리는 것을 감지 (경력의 position 포함)
  const origTitles = new Set(
    [original.title, ...original.experience.map(e => e.position)].map(norm).filter(Boolean)
  )
  const addedTitles = [
    ...new Set([revised.title, ...revised.experience.map(e => e.position)].map(t => t.trim()).filter(Boolean)),
  ].filter(t => !origTitles.has(norm(t)))
  if (addedTitles.length) {
    warnings.push({ kind: 'title', message: `직함이 바뀌었어요: ${addedTitles.join(', ')}` })
  }

  return warnings
}
