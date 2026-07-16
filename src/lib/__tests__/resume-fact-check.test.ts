import { describe, it, expect } from 'vitest'
import { checkResumeFacts } from '@/lib/resume-fact-check'
import type { StudioResume } from '@/lib/resume'

const base: StudioResume = {
  name: '김지민',
  phone: '010-1234-5678',
  links: '',
  title: '백엔드 개발자',
  summary: 'Node.js 기반 API를 3년간 개발했습니다.',
  skills: ['Node.js', 'TypeScript'],
  hidden_skills: [],
  experience: [
    { company: 'ABC테크', position: '백엔드 개발자', period: '2020-2023', description: '결제 시스템 개발\nAPI 서버 운영' },
  ],
  education: [{ school: '서울대학교', major: '컴퓨터공학', degree: '학사', period: '2016-2020' }],
}

const clone = (): StudioResume => JSON.parse(JSON.stringify(base))
const kinds = (r: StudioResume) => checkResumeFacts(base, r).map(w => w.kind).sort()

describe('checkResumeFacts — AI 수정본의 사실 변경 감지', () => {
  it('변경 없음 → 경고 없음', () => {
    expect(kinds(clone())).toEqual([])
  })

  it('표현만 수정(사실 동일) → 경고 없음 (오탐 방지)', () => {
    const r = clone()
    r.summary = '3년간 Node.js 기반 API 서버를 설계·개발한 경험이 있습니다.'
    expect(kinds(r)).toEqual([])
  })

  it('스킬 순서만 변경 → 경고 없음 (오탐 방지)', () => {
    const r = clone()
    r.skills = ['TypeScript', 'Node.js']
    expect(kinds(r)).toEqual([])
  })

  it('원본에 없던 숫자 날조("40% 개선") → number 경고 + 해당 숫자 명시', () => {
    const r = clone()
    r.experience[0].description += '\n응답 속도 40% 개선'
    const warnings = checkResumeFacts(base, r)
    expect(warnings.map(w => w.kind)).toEqual(['number'])
    expect(warnings[0].message).toContain('40')
  })

  it('회사명 변경 → company 경고', () => {
    const r = clone()
    r.experience[0].company = 'XYZ컴퍼니'
    expect(kinds(r)).toEqual(['company'])
  })

  it('기간 변경 → period 경고 (+새 연도는 number)', () => {
    const r = clone()
    r.experience[0].period = '2019-2023'
    expect(kinds(r)).toEqual(['number', 'period'])
  })

  it('새 스킬 추가 → skill 경고', () => {
    const r = clone()
    r.skills.push('Kubernetes')
    expect(kinds(r)).toEqual(['skill'])
  })

  it('직함 상향("시니어") → title 경고', () => {
    const r = clone()
    r.title = '시니어 백엔드 개발자'
    expect(kinds(r)).toEqual(['title'])
  })
})
