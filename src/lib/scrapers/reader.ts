// 리더 프록시(r.jina.ai) 우회 fetcher.
// Seek 등 봇 차단이 강한 사이트는 데이터센터 IP는 물론 로컬 IP에서도 403을 반환한다.
// 리더 프록시는 자체 브라우저 팜에서 페이지를 렌더링해 마크다운으로 돌려주므로,
// 직접 fetch·헤드리스 브라우저가 모두 막혔을 때 최후의 우회 수단으로 사용한다.

import type { ScrapedJob } from './seek-url'

export async function fetchReaderMarkdown(url: string): Promise<string> {
  const headers: Record<string, string> = { 'X-Return-Format': 'markdown' }
  // 키가 있으면 요청 한도가 크게 늘어난다 (없어도 저빈도 사용은 동작)
  if (process.env.JINA_API_KEY) headers.Authorization = `Bearer ${process.env.JINA_API_KEY}`

  const res = await fetch(`https://r.jina.ai/${url}`, {
    headers,
    cache: 'no-store',
    signal: AbortSignal.timeout(45_000),
  })
  if (!res.ok) throw new Error(`리더 프록시 실패: ${res.status}`)

  const text = await res.text()
  // 차단·에러 페이지가 그대로 변환된 경우 방어 (정상 공고면 본문이 이보다 길다)
  if (text.trim().length < 200) throw new Error('리더 프록시가 빈 내용을 반환했습니다.')
  return text
}

// 리더 프록시 마크다운에서 Haiku로 공고 필드를 구조화 추출한다.
export async function scrapeJobViaReader(url: string): Promise<ScrapedJob> {
  const markdown = await fetchReaderMarkdown(url)

  const { anthropic } = await import('@/lib/claude')
  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 3000,
    messages: [{
      role: 'user',
      content: `아래는 채용공고 페이지를 마크다운으로 변환한 것입니다. 공고 정보를 추출해 JSON으로만 응답하세요. 다른 텍스트는 절대 포함하지 마세요.

형식: {"title": "직무명", "company": "회사명", "location": "근무지", "salary": "급여(없으면 null)", "description": "JD 본문 전체(평문, 원어 유지)", "posted_at": "게시일 ISO 날짜(없으면 null)"}

규칙:
- description 은 자격 요건·주요 업무 등 JD 본문을 최대한 온전히 담을 것 (네비게이션·푸터·추천 공고 제외)
- JD 본문이 없더라도 문서 상단의 "Title:" 줄에서 직무명·근무지를 알 수 있으면 title/location 을 채우고 description 은 "" 로 둘 것 (예: "Senior Engineer Job in Sydney NSW - SEEK" → title: "Senior Engineer", location: "Sydney NSW")
- 채용공고와 무관한 페이지면 {"title": ""} 만 출력

마크다운:
${markdown.slice(0, 40_000)}`,
    }],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('리더 폴백: AI 응답을 해석하지 못했습니다.')

  let parsed: Partial<ScrapedJob>
  try {
    parsed = JSON.parse(jsonMatch[0])
  } catch {
    throw new Error('리더 폴백: AI 응답을 해석하지 못했습니다.')
  }
  if (!parsed.title?.trim()) throw new Error('리더 폴백: 공고 정보를 찾을 수 없습니다.')

  return {
    title: parsed.title.trim(),
    company: parsed.company?.trim() ?? '',
    location: parsed.location?.trim() ?? '',
    salary: parsed.salary?.toString().trim() || null,
    description: parsed.description?.trim() ?? '',
    posted_at: parsed.posted_at || null,
  }
}
