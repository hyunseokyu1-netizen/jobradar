-- ============================================================
-- JobRadar Schema — Multi-user SaaS
-- auth.users는 Supabase Auth가 자동 관리
-- ============================================================


-- ============================================================
-- 1. profiles (유저 프로파일 — auth.users 1:1 연결)
-- ============================================================
CREATE TABLE profiles (
  id                UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email             TEXT,
  name              TEXT,
  skills            TEXT[],
  desired_positions TEXT[],          -- 검색 키워드 ['React Native', 'Fullstack developer']
  desired_sources   TEXT[] DEFAULT ARRAY['indeed'],  -- ['indeed', 'glassdoor']
  desired_locations TEXT[] DEFAULT ARRAY['Sydney NSW'],  -- ['Sydney NSW', 'Melbourne VIC', 'Auckland']
  career_summary    TEXT,
  story             TEXT,            -- 커버레터에 재사용할 커리어 스토리
  resume_text       TEXT,            -- 이력서 파싱 텍스트
  preferences       JSONB,           -- { salary_min, salary_max, company_size }
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- 신규 가입 시 profiles 행 자동 생성
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();


-- ============================================================
-- 2. jobs (채용공고 — 전체 유저 공유 풀)
-- ============================================================
CREATE TABLE jobs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source      TEXT NOT NULL,   -- 'indeed' | 'glassdoor'
  title       TEXT NOT NULL,
  company     TEXT NOT NULL,
  location    TEXT,
  salary      TEXT,
  description TEXT,
  url         TEXT UNIQUE NOT NULL,
  posted_at   TIMESTAMPTZ,
  scraped_at  TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- 3. matches (AI 매칭 결과 — 유저별)
-- ============================================================
CREATE TABLE matches (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id      UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  score       INTEGER CHECK (score >= 0 AND score <= 100),
  reason      TEXT,
  highlights  TEXT[],          -- 매칭 포인트 요약
  status      TEXT NOT NULL DEFAULT 'new', -- 'new' | 'bookmarked' | 'applied' | 'pass'
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, job_id)     -- 유저-잡 쌍 중복 방지
);


-- ============================================================
-- 4. cover_letters (커버레터 — 유저별)
-- ============================================================
CREATE TABLE cover_letters (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id      UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  match_id    UUID REFERENCES matches(id) ON DELETE SET NULL,
  content     TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- 인덱스
-- ============================================================
CREATE INDEX idx_matches_user_id  ON matches (user_id);
CREATE INDEX idx_matches_job_id   ON matches (job_id);
CREATE INDEX idx_matches_status   ON matches (user_id, status);
CREATE INDEX idx_cover_letters_user_id ON cover_letters (user_id);
CREATE INDEX idx_cover_letters_job_id  ON cover_letters (job_id);


-- ============================================================
-- Row Level Security (RLS) — 유저별 데이터 격리
-- ============================================================

ALTER TABLE profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs         ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches      ENABLE ROW LEVEL SECURITY;
ALTER TABLE cover_letters ENABLE ROW LEVEL SECURITY;

-- profiles: 본인 것만 읽기/쓰기
CREATE POLICY "profiles: 본인만 조회" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles: 본인만 수정" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- jobs: 로그인한 유저 전체 읽기, 쓰기는 service role만
CREATE POLICY "jobs: 인증 유저 전체 조회" ON jobs
  FOR SELECT TO authenticated USING (true);

-- matches: 본인 것만
CREATE POLICY "matches: 본인만 조회" ON matches
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "matches: 본인만 삽입" ON matches
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "matches: 본인만 수정" ON matches
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "matches: 본인만 삭제" ON matches
  FOR DELETE USING (auth.uid() = user_id);

-- cover_letters: 본인 것만
CREATE POLICY "cover_letters: 본인만 조회" ON cover_letters
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "cover_letters: 본인만 삽입" ON cover_letters
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "cover_letters: 본인만 수정" ON cover_letters
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "cover_letters: 본인만 삭제" ON cover_letters
  FOR DELETE USING (auth.uid() = user_id);
