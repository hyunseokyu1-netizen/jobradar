import { describe, it, expect, vi } from 'vitest'

// scorePostings는 Claude를 호출하므로 anthropic만 모킹 — 프롬프트 파싱·실패 처리를 검증
const createMock = vi.fn()
vi.mock('@/lib/claude', () => ({
  anthropic: { messages: { create: (...args: unknown[]) => createMock(...args) } },
  textOf: (m: { content: { type: string; text?: string }[] }) =>
    m.content.find(b => b.type === 'text')?.text ?? '',
}))

const { prefilterPostings, scorePostings } = await import('@/lib/discover/scoring')

const profile = {
  skills: ['Node.js', 'TypeScript'],
  desired_positions: ['백엔드 개발자', 'Backend Engineer'],
  career_summary: 'Backend engineer with Node.js experience',
}

describe('prefilterPostings — 키워드 프리필터 (무료 1차)', () => {
  it('목표 포지션·스킬 키워드와 겹치는 제목만 통과', () => {
    const { passed, filtered } = prefilterPostings(
      [
        { title: 'Senior Backend Engineer', url: 'https://a.com/1' },
        { title: 'Node.js Developer', url: 'https://a.com/2' },
        { title: 'Marketing Manager', url: 'https://a.com/3' },
      ],
      profile
    )
    expect(passed.map(p => p.url)).toEqual(['https://a.com/1', 'https://a.com/2'])
    expect(filtered.map(p => p.url)).toEqual(['https://a.com/3'])
  })

  it('프로필 키워드가 없으면 전부 통과 (필터 불가)', () => {
    const { passed, filtered } = prefilterPostings(
      [{ title: 'Anything', url: 'https://a.com/1' }],
      { skills: null, desired_positions: null, career_summary: null }
    )
    expect(passed).toHaveLength(1)
    expect(filtered).toHaveLength(0)
  })

  it('직급 불용어(senior 등)만 겹치는 것은 통과시키지 않음', () => {
    const { passed } = prefilterPostings(
      [{ title: 'Senior Accountant', url: 'https://a.com/1' }],
      { skills: [], desired_positions: ['Senior Backend Engineer'], career_summary: null }
    )
    expect(passed).toHaveLength(0)
  })
})

describe('scorePostings — Haiku 배치 채점 파싱·실패 처리', () => {
  it('정상 JSON 응답을 인덱스별 점수로 매핑', async () => {
    createMock.mockResolvedValueOnce({
      content: [{ type: 'text', text: '{"scores": [{"i": 0, "s": 85, "r": "적합"}, {"i": 1, "s": 30, "r": "무관"}]}' }],
    })
    const results = await scorePostings(
      [
        { title: 'Backend Engineer', url: 'https://a.com/1' },
        { title: 'Designer', url: 'https://a.com/2' },
      ],
      profile
    )
    expect(results[0]).toMatchObject({ score: 85, reason: '적합' })
    expect(results[1]).toMatchObject({ score: 30, reason: '무관' })
  })

  it('JSON 파싱 실패 시 해당 배치는 점수 null (0점으로 위장하지 않음)', async () => {
    createMock.mockResolvedValueOnce({ content: [{ type: 'text', text: 'not json at all' }] })
    const results = await scorePostings([{ title: 'Backend Engineer', url: 'https://a.com/1' }], profile)
    expect(results[0].score).toBeNull()
    expect(results[0].reason).toBeNull()
  })

  it('응답에서 누락된 인덱스도 null 처리', async () => {
    createMock.mockResolvedValueOnce({
      content: [{ type: 'text', text: '{"scores": [{"i": 0, "s": 70, "r": "ok"}]}' }],
    })
    const results = await scorePostings(
      [
        { title: 'A', url: 'https://a.com/1' },
        { title: 'B', url: 'https://a.com/2' },
      ],
      profile
    )
    expect(results[0].score).toBe(70)
    expect(results[1].score).toBeNull()
  })

  it('빈 입력은 API 호출 없이 빈 배열', async () => {
    createMock.mockClear()
    expect(await scorePostings([], profile)).toEqual([])
    expect(createMock).not.toHaveBeenCalled()
  })
})
