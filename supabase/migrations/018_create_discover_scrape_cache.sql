-- ============================================================
-- Migration 018: 잡 탐색 공유 스크래핑 캐시
-- 같은 채용페이지 URL을 여러 유저가 수집할 때, 첫 수집 결과(공고 원본 목록)를
-- 공유해 재스크래핑(네트워크·헤드리스 브라우저·AI 추출)을 생략한다.
-- 매칭 점수는 유저별이므로 여기엔 저장하지 않는다 (discovered_jobs가 담당).
-- ============================================================

CREATE TABLE IF NOT EXISTS discover_scrape_cache (
  source_url   TEXT PRIMARY KEY,                     -- 정규화된 채용페이지 URL
  source_type  TEXT NOT NULL DEFAULT 'generic',      -- greenhouse / lever / ashby / smartrecruiters / apple / generic
  postings     JSONB NOT NULL DEFAULT '[]'::jsonb,   -- DiscoveredPosting[] (title/url/location/department)
  scraped_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 서버 액션(service role)에서만 읽고 쓴다.
-- RLS를 켜고 정책을 만들지 않으면 anon/authenticated 키로는 접근 불가.
ALTER TABLE discover_scrape_cache ENABLE ROW LEVEL SECURITY;
