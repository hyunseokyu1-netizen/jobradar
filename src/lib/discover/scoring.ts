// 수집된 공고의 2단계 경량 매칭.
// 1) 프리필터: 프로필 키워드와 제목을 코드 레벨에서 대조 (토큰 매칭, 무료)
// 2) 스코어링: 통과한 공고만 Claude Haiku로 배치 채점 (제목+메타만, JD 전문 없음)

import { textOf } from '@/lib/claude'
import type { DiscoveredPosting } from './ats'

export interface ScoredPosting extends DiscoveredPosting {
  score: number | null
  reason: string | null
}

interface ProfileLite {
  skills: string[] | null
  desired_positions: string[] | null
  career_summary: string | null
}

// 직급·범용 단어는 매칭 신호가 아니므로 제외
const STOPWORDS = new Set([
  'senior', 'junior', 'lead', 'staff', 'principal', 'intern', 'head',
  'the', 'and', 'for', 'with', 'of', 'to', 'in', 'at',
  'manager', 'specialist', 'associate', 'analyst',
])

function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .split(/[^a-z0-9+#]+/)
    .filter(t => t.length >= 2 && !STOPWORDS.has(t))
}

/** 제목이 목표 포지션·스킬 키워드와 하나라도 겹치면 통과 */
export function prefilterPostings(postings: DiscoveredPosting[], profile: ProfileLite): {
  passed: DiscoveredPosting[]
  filtered: DiscoveredPosting[]
} {
  const keywords = new Set<string>()
  for (const p of profile.desired_positions ?? []) tokenize(p).forEach(t => keywords.add(t))
  for (const s of profile.skills ?? []) tokenize(s).forEach(t => keywords.add(t))

  // 프로필 키워드가 없으면 전부 통과 (필터 불가)
  if (keywords.size === 0) return { passed: postings, filtered: [] }

  const passed: DiscoveredPosting[] = []
  const filtered: DiscoveredPosting[] = []
  for (const posting of postings) {
    const titleTokens = tokenize(posting.title)
    if (titleTokens.some(t => keywords.has(t))) passed.push(posting)
    else filtered.push(posting)
  }
  return { passed, filtered }
}

const BATCH_SIZE = 40

/** Haiku로 제목+메타 기준 배치 채점. JD 전문을 가져오지 않으므로 저비용 */
export async function scorePostings(postings: DiscoveredPosting[], profile: ProfileLite): Promise<ScoredPosting[]> {
  if (postings.length === 0) return []

  const { anthropic } = await import('@/lib/claude')
  const results: ScoredPosting[] = []

  for (let start = 0; start < postings.length; start += BATCH_SIZE) {
    const batch = postings.slice(start, start + BATCH_SIZE)
    const listText = batch
      .map((p, i) => `[${i}] ${p.title}${p.location ? ` · ${p.location}` : ''}${p.department ? ` · ${p.department}` : ''}`)
      .join('\n')

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4000,
      messages: [{
        role: 'user',
        content: `당신은 채용 매칭 전문가입니다. 후보자 프로파일과 공고 목록(제목·위치·부서만 제공)을 보고 각 공고의 적합도를 채점하세요.

## 후보자 프로파일
- 목표 포지션: ${profile.desired_positions?.join(', ') ?? '미입력'}
- 스킬: ${profile.skills?.join(', ') ?? '미입력'}
- 경력 요약: ${profile.career_summary?.slice(0, 500) ?? '미입력'}

## 공고 목록
${listText}

## 채점 기준
- 직무가 목표 포지션·스킬과 정확히 일치: 70~95
- 인접 직무 (스킬 일부 활용 가능): 40~69
- 무관한 직무: 0~39
- 제목만으로 판단하므로 확신이 없으면 중간 점수

JSON으로만 응답하세요. 다른 텍스트 금지:
{"scores": [{"i": 인덱스, "s": 0~100 정수, "r": "한 문장 이유 (한국어)"}]}
모든 인덱스를 빠짐없이 포함하세요.`,
      }],
    })

    const text = textOf(message)
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    const scoreMap = new Map<number, { s: number; r: string }>()
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]) as { scores: { i: number; s: number; r: string }[] }
        for (const item of parsed.scores ?? []) scoreMap.set(item.i, { s: item.s, r: item.r })
      } catch {
        // 파싱 실패 시 해당 배치는 점수 없음으로 저장
      }
    }

    batch.forEach((p, i) => {
      const hit = scoreMap.get(i)
      results.push({ ...p, score: hit?.s ?? null, reason: hit?.r ?? null })
    })
  }

  return results
}
