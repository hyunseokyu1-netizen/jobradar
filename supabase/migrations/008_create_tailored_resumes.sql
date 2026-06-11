-- ============================================================
-- Migration 008: tailored_resumes (JD 맞춤 이력서 — 유저별)
-- cover_letters와 동일한 구조
-- ============================================================

CREATE TABLE IF NOT EXISTS tailored_resumes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id      UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  content     TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, job_id)
);

CREATE INDEX IF NOT EXISTS idx_tailored_resumes_user_id ON tailored_resumes (user_id);
CREATE INDEX IF NOT EXISTS idx_tailored_resumes_job_id  ON tailored_resumes (job_id);

ALTER TABLE tailored_resumes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tailored_resumes: 본인만 조회" ON tailored_resumes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "tailored_resumes: 본인만 삽입" ON tailored_resumes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "tailored_resumes: 본인만 수정" ON tailored_resumes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "tailored_resumes: 본인만 삭제" ON tailored_resumes FOR DELETE USING (auth.uid() = user_id);
