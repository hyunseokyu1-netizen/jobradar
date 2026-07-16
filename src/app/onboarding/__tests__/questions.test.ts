import { describe, it, expect } from 'vitest'
import { answersFromOnboardingKo, EMPTY_ANSWERS } from '../questions'

describe('answersFromOnboardingKo — 저장된 프로필의 채팅 답변 역변환', () => {
  it('null/비객체는 빈 답변으로 방어', () => {
    expect(answersFromOnboardingKo(null)).toEqual(EMPTY_ANSWERS)
    expect(answersFromOnboardingKo('broken')).toEqual(EMPTY_ANSWERS)
  })

  it('정상 구조화 프로필을 답변 형태로 변환', () => {
    const answers = answersFromOnboardingKo({
      name: '김지민',
      phone: '010-1234-5678',
      skills: ['Node.js', 'React'],
      education: [{ school: '서울대학교', major: '컴퓨터공학', degree: '학사', period: '2016-2020' }],
      experience: [{ company: 'ABC테크', position: '개발자', period: '2020-2023', description: 'API 개발' }],
      desired: {
        positions: ['백엔드 개발자'],
        locations: ['시드니'],
        salary_min: 90000,
        salary_max: 150000,
        salary_currency: 'USD',
      },
    })
    expect(answers.name).toBe('김지민')
    expect(answers.skills).toBe('Node.js, React')
    expect(answers.education[0]).toContain('서울대학교')
    expect(answers.experience[0]).toContain('ABC테크')
    expect(answers.positions).toBe('백엔드 개발자')
    expect(answers.salary).toBe('USD 90,000 ~ 150,000')
  })

  it('번역 실패로 raw 답변이 저장된 경우도 복원', () => {
    const raw = { ...EMPTY_ANSWERS, name: '김지민', skills: 'Node.js, React' }
    const answers = answersFromOnboardingKo(raw)
    expect(answers.name).toBe('김지민')
    expect(answers.skills).toBe('Node.js, React')
  })

  it('연봉 최소값만 있어도 표기', () => {
    const answers = answersFromOnboardingKo({
      desired: { positions: [], locations: [], salary_min: 90000, salary_max: null, salary_currency: 'USD' },
    })
    expect(answers.salary).toBe('USD 90,000')
  })
})
