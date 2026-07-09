// 맞춤 이력서 RAG 검색 헬퍼.
// 임베딩·벡터DB 없이 키워드 겹침 점수로 유저 본인의 과거 맞춤 이력서 코퍼스에서
// 이번 JD와 관련된 항목을 찾아 "표현·강조 참고용" 컨텍스트로 반환한다.
// (설계 배경: docs/rag-tailored-resume.md)
import { supabaseAdmin } from '@/lib/supabase-admin'

const RAG_STOPWORDS = new Set([
  'the', 'and', 'for', 'with', 'you', 'our', 'are', 'will', 'that', 'this', 'have', 'has',
  'from', 'your', 'who', 'all', 'any', 'can', 'not', 'but', 'they', 'their', 'been', 'were',
  'about', 'into', 'more', 'other', 'such', 'than', 'then', 'them', 'these', 'those', 'work',
  'role', 'team', 'job', 'per', 'via', 'etc', 'a', 'an', 'to', 'of', 'in', 'on', 'as', 'at', 'is', 'be', 'or', 'we',
])
function ragKeywords(text: string): Set<string> {
  const words = text.toLowerCase().match(/[a-z][a-z+#.-]{2,}/g) ?? []
  return new Set(words.filter(w => !RAG_STOPWORDS.has(w)))
}
function ragScore(text: string, kws: Set<string>): number {
  const words = text.toLowerCase().match(/[a-z][a-z+#.-]{2,}/g) ?? []
  let s = 0
  for (const w of words) if (kws.has(w)) s++
  return s
}

/**
 * RAG 검색: 사용자의 과거 맞춤 이력서 코퍼스에서 이번 JD에 가장 관련된 항목을 골라
 * 표현·강조 참고용 컨텍스트로 반환한다. (현재 공고는 제외, 상위 3건)
 */
export async function retrievePastResumes(profileId: string, jobId: string, jd: string): Promise<string> {
  const { data: past } = await supabaseAdmin
    .from('tailored_resumes')
    .select('job_id, content')
    .eq('user_id', profileId)
    .neq('job_id', jobId)
    .not('content', 'is', null)
    .limit(30)
  if (!past?.length) return ''

  // 관련 공고 제목 매핑
  const jobIds = past.map(p => p.job_id)
  const { data: jobRows } = await supabaseAdmin
    .from('jobs')
    .select('id, title, company')
    .in('id', jobIds)
  const titleMap = new Map((jobRows ?? []).map(j => [j.id, `${j.title}${j.company ? ` @ ${j.company}` : ''}`]))

  const kws = ragKeywords(jd)
  const ranked = past
    .map(p => ({ ...p, score: ragScore(p.content ?? '', kws) }))
    .sort((a, b) => b.score - a.score)
    .filter(p => p.score > 0)
    .slice(0, 3)
  if (!ranked.length) return ''

  return ranked
    .map((p, i) => `### 참고 이력서 ${i + 1} — 유사 공고 "${titleMap.get(p.job_id) ?? '이전 공고'}"에 작성했던 버전\n${(p.content ?? '').slice(0, 2500)}`)
    .join('\n\n')
}

/** retrievePastResumes()의 반환 문자열에서 실제 참고된 건수를 센다 */
export function ragSourceCount(pastContext: string): number {
  return pastContext ? pastContext.split('### 참고 이력서').length - 1 : 0
}
