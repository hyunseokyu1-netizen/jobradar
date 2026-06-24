'use server'

import { revalidatePath } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getAuthUserEmail, getOrCreateProfile } from '@/lib/auth-helpers'
import { detectPlatform } from '@/lib/detect-platform'
import { detectAtsType, scrapeJobSource } from '@/lib/discover/ats'
import { prefilterPostings, scorePostings } from '@/lib/discover/scoring'

export async function addJobSource(formData: FormData): Promise<{ error?: string }> {
  const email = await getAuthUserEmail()
  if (!email) return { error: '로그인이 필요합니다.' }

  const profile = await getOrCreateProfile(email)
  if (!profile) return { error: 'Profile not found' }

  const url = (formData.get('url') as string)?.trim()
  let name = (formData.get('name') as string)?.trim()
  if (!url) return { error: 'URL을 입력해주세요.' }

  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return { error: '유효하지 않은 URL입니다.' }
  }

  const { type, board } = detectAtsType(url)
  if (!name) {
    // 이름 미입력 시 board 식별자 또는 도메인에서 유추
    name = board ?? parsed.hostname.replace(/^(www|careers|jobs)\./, '').split('.')[0]
    name = name.charAt(0).toUpperCase() + name.slice(1)
  }

  const { error } = await supabaseAdmin.from('job_sources').insert({
    user_id: profile.id,
    name,
    url,
    source_type: type,
  })

  if (error) {
    if (error.code === '23505') return { error: '이미 등록된 채용 페이지입니다.' }
    return { error: error.message }
  }

  revalidatePath('/discover')
  return {}
}

// 한 번의 수집에서 Haiku 채점할 신규 공고 상한 (비용 제어)
const MAX_SCORED_PER_SCRAPE = 50

export async function scrapeSourceAction(sourceId: string): Promise<{
  found?: number
  added?: number
  scored?: number
  error?: string
}> {
  const email = await getAuthUserEmail()
  if (!email) return { error: '로그인이 필요합니다.' }

  const profile = await getOrCreateProfile(email)
  if (!profile) return { error: 'Profile not found' }

  const { data: source } = await supabaseAdmin
    .from('job_sources')
    .select('id, url, source_type')
    .eq('id', sourceId)
    .eq('user_id', profile.id)
    .single()

  if (!source) return { error: '소스를 찾을 수 없습니다.' }

  let postings
  try {
    postings = await scrapeJobSource(source.url, source.source_type)
  } catch (e) {
    const message = `수집 실패: ${String(e)}`
    // 실패 상태를 영구 기록 → UI에서 "수집 불가" 표시 (last_scraped_at은 유지)
    await supabaseAdmin
      .from('job_sources')
      .update({ last_scrape_error: message })
      .eq('id', source.id)
      .eq('user_id', profile.id)
    revalidatePath('/discover')
    return { error: message }
  }

  if (postings.length === 0) {
    await supabaseAdmin
      .from('job_sources')
      .update({ last_scraped_at: new Date().toISOString(), last_scrape_error: null })
      .eq('id', source.id)
      .eq('user_id', profile.id)
    revalidatePath('/discover')
    return { found: 0, added: 0, scored: 0 }
  }

  // 이미 수집된 URL은 제외 (재채점 방지)
  const { data: existing } = await supabaseAdmin
    .from('discovered_jobs')
    .select('url')
    .eq('user_id', profile.id)
    .in('url', postings.map(p => p.url))

  const existingUrls = new Set((existing ?? []).map(e => e.url))
  const fresh = postings.filter(p => !existingUrls.has(p.url))

  // 1단계: 키워드 프리필터 (무료) → 2단계: Haiku 배치 채점
  const { passed, filtered } = prefilterPostings(fresh, profile)
  const toScore = passed.slice(0, MAX_SCORED_PER_SCRAPE)
  const overflow = passed.slice(MAX_SCORED_PER_SCRAPE)

  let scored
  try {
    scored = await scorePostings(toScore, profile)
  } catch (e) {
    return { error: `매칭 채점 실패: ${String(e)}` }
  }

  const rows = [
    ...scored.map(p => ({
      user_id: profile.id,
      source_id: source.id,
      title: p.title,
      url: p.url,
      location: p.location ?? null,
      department: p.department ?? null,
      match_score: p.score,
      match_reason: p.reason,
      status: 'new',
    })),
    // 프리필터 탈락·상한 초과분은 점수 없이 저장 (다음 수집 때 중복 채점 방지)
    ...[...overflow, ...filtered].map(p => ({
      user_id: profile.id,
      source_id: source.id,
      title: p.title,
      url: p.url,
      location: p.location ?? null,
      department: p.department ?? null,
      match_score: null,
      match_reason: null,
      status: 'new',
    })),
  ]

  if (rows.length > 0) {
    const { error: insertError } = await supabaseAdmin
      .from('discovered_jobs')
      .upsert(rows, { onConflict: 'user_id,url', ignoreDuplicates: true })
    if (insertError) return { error: insertError.message }
  }

  await supabaseAdmin
    .from('job_sources')
    .update({ last_scraped_at: new Date().toISOString(), last_scrape_error: null })
    .eq('id', source.id)
    .eq('user_id', profile.id)

  revalidatePath('/discover')
  return { found: postings.length, added: fresh.length, scored: scored.length }
}

export async function dismissDiscoveredJob(discoveredJobId: string): Promise<{ error?: string }> {
  const email = await getAuthUserEmail()
  if (!email) return { error: '로그인이 필요합니다.' }

  const profile = await getOrCreateProfile(email)
  if (!profile) return { error: 'Profile not found' }

  const { error } = await supabaseAdmin
    .from('discovered_jobs')
    .update({ status: 'dismissed' })
    .eq('id', discoveredJobId)
    .eq('user_id', profile.id)

  if (error) return { error: error.message }

  revalidatePath('/discover')
  return {}
}

// 탐색 공고를 지원 관리(jobs + matches)로 넘긴다.
// 반환된 jobId로 클라이언트가 기존 JD 스크래핑 → 정밀 매칭 플로우를 이어간다.
export async function addDiscoveredJobToMyList(discoveredJobId: string): Promise<{
  jobId?: string
  alreadyScraped?: boolean
  error?: string
}> {
  const email = await getAuthUserEmail()
  if (!email) return { error: '로그인이 필요합니다.' }

  const profile = await getOrCreateProfile(email)
  if (!profile) return { error: 'Profile not found' }

  const { data: discovered } = await supabaseAdmin
    .from('discovered_jobs')
    .select('id, title, url, location')
    .eq('id', discoveredJobId)
    .eq('user_id', profile.id)
    .single()

  if (!discovered) return { error: '공고를 찾을 수 없습니다.' }

  const { data: existingJob } = await supabaseAdmin
    .from('jobs')
    .select('id, title')
    .eq('url', discovered.url)
    .maybeSingle()

  let jobId: string
  let alreadyScraped = false

  if (existingJob) {
    jobId = existingJob.id
    alreadyScraped = existingJob.title !== '스크래핑 대기 중...' && existingJob.title !== '스크래핑 실패'
  } else {
    const { data: newJob, error: jobError } = await supabaseAdmin
      .from('jobs')
      .upsert({
        url: discovered.url,
        source: detectPlatform(discovered.url),
        title: discovered.title,
        company: '',
        location: discovered.location ?? '',
        scraped_at: new Date().toISOString(),
      }, { onConflict: 'url' })
      .select('id')
      .single()

    if (jobError) return { error: jobError.message }
    jobId = newJob.id
  }

  const { error: matchError } = await supabaseAdmin
    .from('matches')
    .upsert(
      { user_id: profile.id, job_id: jobId, status: 'new' },
      { onConflict: 'user_id,job_id' }
    )
  if (matchError) return { error: matchError.message }

  await supabaseAdmin
    .from('discovered_jobs')
    .update({ status: 'added' })
    .eq('id', discovered.id)
    .eq('user_id', profile.id)

  revalidatePath('/discover')
  revalidatePath('/')
  return { jobId, alreadyScraped }
}

export async function deleteJobSource(sourceId: string): Promise<{ error?: string }> {
  const email = await getAuthUserEmail()
  if (!email) return { error: '로그인이 필요합니다.' }

  const profile = await getOrCreateProfile(email)
  if (!profile) return { error: 'Profile not found' }

  const { error } = await supabaseAdmin
    .from('job_sources')
    .delete()
    .eq('id', sourceId)
    .eq('user_id', profile.id)

  if (error) return { error: error.message }

  revalidatePath('/discover')
  return {}
}
