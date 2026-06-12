-- ============================================================
-- Migration 010: 잡 탐색 (Discover)
-- job_sources     — 유저가 등록한 회사 채용 페이지
-- discovered_jobs — 채용 페이지에서 수집된 공고 + 경량 매칭 점수
-- ============================================================

CREATE TABLE IF NOT EXISTS job_sources (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,              -- 표시 이름 (예: "Spotify")
  url              TEXT NOT NULL,              -- 등록한 채용 페이지 URL
  source_type      TEXT NOT NULL DEFAULT 'generic',  -- greenhouse / lever / ashby / smartrecruiters / generic
  last_scraped_at  TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, url)
);

CREATE INDEX IF NOT EXISTS idx_job_sources_user_id ON job_sources (user_id);

ALTER TABLE job_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "job_sources: 본인만 조회" ON job_sources FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "job_sources: 본인만 삽입" ON job_sources FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "job_sources: 본인만 수정" ON job_sources FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "job_sources: 본인만 삭제" ON job_sources FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS discovered_jobs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_id     UUID NOT NULL REFERENCES job_sources(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  url           TEXT NOT NULL,
  location      TEXT,
  department    TEXT,
  match_score   INT,                           -- 경량 매칭 점수 (0~100), 프리필터 탈락 시 NULL
  match_reason  TEXT,
  status        TEXT NOT NULL DEFAULT 'new',   -- new / added / dismissed
  scraped_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, url)
);

CREATE INDEX IF NOT EXISTS idx_discovered_jobs_user_id   ON discovered_jobs (user_id);
CREATE INDEX IF NOT EXISTS idx_discovered_jobs_source_id ON discovered_jobs (source_id);

ALTER TABLE discovered_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "discovered_jobs: 본인만 조회" ON discovered_jobs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "discovered_jobs: 본인만 삽입" ON discovered_jobs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "discovered_jobs: 본인만 수정" ON discovered_jobs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "discovered_jobs: 본인만 삭제" ON discovered_jobs FOR DELETE USING (auth.uid() = user_id);
