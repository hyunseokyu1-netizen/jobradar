import { describe, it, expect } from 'vitest'
import {
  toStudioResume, sanitizeStudio, contactLine, studioToDoc, structuredResumeText,
  type StudioResume,
} from '@/lib/resume'

describe('toStudioResume — JSONB 원본 정규화', () => {
  it('null/비객체 입력도 안전한 빈 이력서로', () => {
    for (const raw of [null, undefined, 'string', 42, []]) {
      const r = toStudioResume(raw)
      expect(r.name).toBe('')
      expect(r.skills).toEqual([])
      expect(r.experience).toEqual([])
    }
  })

  it('폴백 이름·전화번호 적용', () => {
    const r = toStudioResume({}, '김지민', '010-1111-2222')
    expect(r.name).toBe('김지민')
    expect(r.phone).toBe('010-1111-2222')
  })

  it('배열 필드에 섞인 비문자열 항목 제거', () => {
    const r = toStudioResume({ skills: ['Node.js', 42, null, 'React'] })
    expect(r.skills).toEqual(['Node.js', 'React'])
  })

  it('경력 항목의 누락 필드는 빈 문자열, hidden은 boolean으로 강제', () => {
    const r = toStudioResume({ experience: [{ company: 'ABC', hidden: 1 }] })
    expect(r.experience[0]).toEqual({ company: 'ABC', position: '', period: '', description: '', hidden: true })
  })
})

describe('sanitizeStudio — 클라이언트 입력 정제', () => {
  const valid: StudioResume = {
    name: '김지민', phone: '', links: '', title: '개발자', summary: '요약',
    skills: ['Node.js'], hidden_skills: [],
    experience: [], education: [],
  }

  it('길이 상한 강제 (name 100자)', () => {
    const r = sanitizeStudio({ ...valid, name: 'A'.repeat(500) })
    expect(r.name.length).toBe(100)
  })

  it('배열 개수 상한 (experience 20개)', () => {
    const exps = Array.from({ length: 50 }, (_, i) => ({
      company: `회사${i}`, position: '', period: '', description: '',
    }))
    const r = sanitizeStudio({ ...valid, experience: exps })
    expect(r.experience.length).toBe(20)
  })

  it('디자인 accent는 화이트리스트 밖이면 기본값으로 (스타일 인젝션 방지)', () => {
    const r = sanitizeStudio({
      ...valid,
      design: { template: 'modern', font: 'plex', lineHeight: 1.75, accent: 'javascript:alert(1)' },
    })
    expect(r.design?.accent).toBe('#046C4E')
  })

  it('lineHeight 범위 강제 (1.4~2.0)', () => {
    const r = sanitizeStudio({
      ...valid,
      design: { template: 'classic', font: 'plex', lineHeight: 99, accent: '#046C4E' },
    })
    expect(r.design?.lineHeight).toBe(2.0)
  })
})

describe('contactLine', () => {
  it('빈 값은 건너뛰고 · 로 연결', () => {
    expect(contactLine('a@b.com', '', 'github.com/x')).toBe('a@b.com · github.com/x')
    expect(contactLine('a@b.com')).toBe('a@b.com')
  })
})

describe('studioToDoc — 렌더 문서 변환', () => {
  it('hidden 경력·스킬은 문서에서 제외', () => {
    const r: StudioResume = {
      name: 'A', phone: '', links: '', title: 'T', summary: '',
      skills: ['공개스킬', '숨김스킬'], hidden_skills: ['숨김스킬'],
      experience: [
        { company: '보임', position: 'P', period: '2020', description: '한 일' },
        { company: '숨김', position: 'P', period: '2021', description: '비밀', hidden: true },
      ],
      education: [],
    }
    const doc = studioToDoc(r, 'a@b.com')
    expect(doc.skills).toEqual(['공개스킬'])
    expect(doc.experiences).toHaveLength(1)
    expect(doc.experiences[0].org).toContain('보임')
  })

  it('description의 불릿 기호·빈 줄 정리', () => {
    const r: StudioResume = {
      name: 'A', phone: '', links: '', title: '', summary: '',
      skills: [], hidden_skills: [],
      experience: [{ company: 'C', position: 'P', period: '', description: '- 첫 줄\n\n• 둘째 줄\n   ' }],
      education: [],
    }
    const doc = studioToDoc(r, 'a@b.com')
    expect(doc.experiences[0].bullets.map(b => b.text)).toEqual(['첫 줄', '둘째 줄'])
  })
})

describe('structuredResumeText — AI 프롬프트용 평문 조립', () => {
  it('hidden 경력 제외, 섹션 라벨 포함', () => {
    const text = structuredResumeText({
      name: 'Jimin Kim',
      summary: 'Backend engineer',
      skills: ['Node.js'],
      experience: [
        { company: 'ABC', position: 'Dev', period: '2020', description: 'built api' },
        { company: 'SECRET', position: 'X', period: '2021', description: 'hidden', hidden: true },
      ],
    })
    expect(text).toContain('EXPERIENCE')
    expect(text).toContain('ABC')
    expect(text).not.toContain('SECRET')
  })

  it('비객체 입력은 빈 문자열', () => {
    expect(structuredResumeText(null)).toBe('')
  })
})
