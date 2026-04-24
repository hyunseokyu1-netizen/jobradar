import type { ScrapedJob } from './seek-url'

// Glassdoor는 Cloudflare로 막혀 fetch 불가 → URL 슬러그에서 파싱
// 예: /job-listing/group-product-manager-deepl-JV_IC5023222_KO0,49_KE50,55.htm
export function parseGlassdoorUrl(url: string): ScrapedJob {
  const pathname = new URL(url).pathname

  // /job-listing/{slug}-JV_... 패턴에서 슬러그 추출
  const slugMatch = pathname.match(/\/job-listing\/(.+?)(?:-JV_|-GD_|\.htm)/i)
  const slug = slugMatch?.[1] ?? ''

  // 슬러그: "group-product-manager-business-acceleration-track-deepl"
  // KE 파라미터 앞까지가 제목+회사 조합
  // 마지막 단어(들)가 회사명인 경우가 많음 — 단순히 마지막 하이픈 이후를 회사로 추정
  const parts = slug.split('-').filter(Boolean)

  // Glassdoor URL에서 회사명은 KO0,N 뒤 KEN,M으로 인코딩됨
  // 슬러그에서는 마지막 1~2개 단어가 회사인 경우가 많음
  // 더 정확한 방법: jl= 파라미터의 jobListingId를 jobListingId로 활용
  const koMatch = pathname.match(/_KO\d+,(\d+)/)
  const keMatch = pathname.match(/_KE(\d+),(\d+)/)
  let title = slug
  let company = ''

  if (koMatch && keMatch) {
    const titleEnd = parseInt(koMatch[1])
    const companyStart = parseInt(keMatch[1])
    const companyEnd = parseInt(keMatch[2])
    title = slug.slice(0, titleEnd).replace(/-/g, ' ')
    company = slug.slice(companyStart, companyEnd).replace(/-/g, ' ')
  } else {
    // fallback: 마지막 단어를 회사로
    company = parts[parts.length - 1] ?? ''
    title = parts.slice(0, -1).join(' ')
  }

  // 위치 코드 (IC 파라미터)
  const icMatch = pathname.match(/IC(\d+)/)
  const locationCode = icMatch?.[1] ?? ''

  return {
    title: toTitleCase(title.trim()) || '제목 파싱 불가',
    company: toTitleCase(company.trim()),
    location: locationCode ? `(Location code: ${locationCode})` : '',
    salary: null,
    description: `[Glassdoor] 페이지 직접 스크래핑 불가 (Cloudflare 차단). 원문: ${url}`,
    posted_at: null,
  }
}

function toTitleCase(str: string): string {
  return str.replace(/\b\w/g, c => c.toUpperCase())
}
