-- ============================================================
-- MatchDa (JobRadar) — 프로덕션 전체 스키마 (Single Source of Truth)
-- ============================================================
-- 이 파일 하나로 빈 Supabase 프로젝트에 전체 DB를 생성한다.
-- migrations/ 폴더는 과거 이력(적용 순서 기록)이며, 새 프로젝트를 만들 때는
-- 이 파일만 실행하면 된다 (migrations 재적용 불필요).
--
-- 실행 방법:
--   Supabase 대시보드 → SQL Editor 에 붙여넣고 실행, 또는
--   psql "$DATABASE_URL" -f supabase/schema.sql
--
-- 멱등성: CREATE TABLE IF NOT EXISTS / DROP POLICY IF EXISTS 로 작성되어
--         부분 적용된 DB에 다시 실행해도 안전하다.
-- auth.users, storage.* 스키마는 Supabase가 관리한다.
-- ============================================================

-- 필요한 확장 (gen_random_uuid, crypt 등)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- 1. profiles — 유저 프로파일 (auth.users 1:1)
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id                     UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email                  TEXT UNIQUE,                       -- getOrCreateProfile 이 email 로 단일 조회
  name                   TEXT,
  phone                  TEXT,
  skills                 TEXT[],
  desired_positions      TEXT[],
  desired_sources        TEXT[] DEFAULT ARRAY['indeed'],
  desired_locations      TEXT[] DEFAULT ARRAY['Sydney NSW'],
  career_summary         TEXT,
  story                  TEXT,                              -- (레거시, 현재 코드 미사용)
  resume_text            TEXT,
  resume_file_path       TEXT,                              -- Storage 'resumes' 버킷 내 원본 DOCX 경로
  resume_file_name       TEXT,
  preferences            JSONB,                             -- { salary_min, salary_max, salary_currency }
  onboarding_completed   BOOLEAN NOT NULL DEFAULT false,
  onboarding_ko          JSONB   NOT NULL DEFAULT '{}'::jsonb,
  onboarding_en          JSONB   NOT NULL DEFAULT '{}'::jsonb,
  -- 구독(Stripe)
  plan                   TEXT NOT NULL DEFAULT 'free',      -- 'free' | 'premium'
  stripe_customer_id     TEXT,
  stripe_subscription_id TEXT,
  subscription_status    TEXT,
  current_period_end     TIMESTAMPTZ,
  created_at             TIMESTAMPTZ DEFAULT NOW(),
  updated_at             TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer ON profiles (stripe_customer_id);

-- 신규 가입 시 profiles 행 자동 생성
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();


-- ============================================================
-- 2. jobs — 채용공고 (공유 풀)
-- ============================================================
CREATE TABLE IF NOT EXISTS jobs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source      TEXT NOT NULL,                                -- seek / indeed / glassdoor / apple / other / manual ...
  title       TEXT NOT NULL,
  company     TEXT NOT NULL,
  location    TEXT,
  salary      TEXT,
  description TEXT,
  url         TEXT UNIQUE NOT NULL,                         -- 직접 입력 공고는 manual://<uuid>
  posted_at   TIMESTAMPTZ,
  scraped_at  TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- 3. matches — AI 매칭 결과 + 지원 관리 (유저별)
-- ============================================================
CREATE TABLE IF NOT EXISTS matches (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id                  UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  score                   INTEGER CHECK (score >= 0 AND score <= 100),
  reason                  TEXT,
  highlights              TEXT[],
  status                  TEXT NOT NULL DEFAULT 'new',      -- new / applied / interview / accepted / rejected ...
  memo                    TEXT,
  position                INTEGER,                          -- 사용자 지정 정렬 순서
  applied_at              TIMESTAMPTZ,
  applied_resume_text     TEXT,
  applied_resume_filename TEXT,
  optimization            JSONB,                            -- 워크스페이스 하이라이트/노트 캐시
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, job_id)
);

CREATE INDEX IF NOT EXISTS idx_matches_user_id ON matches (user_id);
CREATE INDEX IF NOT EXISTS idx_matches_job_id  ON matches (job_id);
CREATE INDEX IF NOT EXISTS idx_matches_status  ON matches (user_id, status);


-- ============================================================
-- 4. cover_letters — 커버레터 (유저별)
-- ============================================================
CREATE TABLE IF NOT EXISTS cover_letters (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id      UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  match_id    UUID REFERENCES matches(id) ON DELETE SET NULL,
  content     TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, job_id)
);

CREATE INDEX IF NOT EXISTS idx_cover_letters_user_id ON cover_letters (user_id);
CREATE INDEX IF NOT EXISTS idx_cover_letters_job_id  ON cover_letters (job_id);


-- ============================================================
-- 5. tailored_resumes — JD 맞춤 이력서 (유저별)
-- ============================================================
CREATE TABLE IF NOT EXISTS tailored_resumes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id      UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  content     TEXT,
  translation TEXT,                                         -- 한국어 번역 캐시
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, job_id)
);

CREATE INDEX IF NOT EXISTS idx_tailored_resumes_user_id ON tailored_resumes (user_id);
CREATE INDEX IF NOT EXISTS idx_tailored_resumes_job_id  ON tailored_resumes (job_id);


-- ============================================================
-- 6. job_sources — 잡 탐색: 등록한 회사 채용 페이지 (유저별)
-- ============================================================
CREATE TABLE IF NOT EXISTS job_sources (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  url               TEXT NOT NULL,
  source_type       TEXT NOT NULL DEFAULT 'generic',        -- greenhouse / lever / ashby / smartrecruiters / generic
  last_scraped_at   TIMESTAMPTZ,
  last_scrape_error TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, url)
);

CREATE INDEX IF NOT EXISTS idx_job_sources_user_id ON job_sources (user_id);


-- ============================================================
-- 7. discovered_jobs — 잡 탐색: 수집된 공고 + 경량 매칭 (유저별)
-- ============================================================
CREATE TABLE IF NOT EXISTS discovered_jobs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_id     UUID NOT NULL REFERENCES job_sources(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  url           TEXT NOT NULL,
  location      TEXT,
  department    TEXT,
  match_score   INT,                                        -- 0~100, 프리필터 탈락/상한 초과 시 NULL
  match_reason  TEXT,
  status        TEXT NOT NULL DEFAULT 'new',                -- new / added / dismissed
  scraped_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, url)
);

CREATE INDEX IF NOT EXISTS idx_discovered_jobs_user_id   ON discovered_jobs (user_id);
CREATE INDEX IF NOT EXISTS idx_discovered_jobs_source_id ON discovered_jobs (source_id);


-- ============================================================
-- Row Level Security (RLS)
-- ============================================================
-- 원칙: 각 유저는 본인 데이터(user_id = auth.uid())만 접근.
-- jobs 는 공유 풀이라 인증 유저 전체 조회만 허용하고,
-- 쓰기(INSERT/UPDATE/DELETE)는 서버 액션의 service role 로만 수행한다.
-- (service role 은 RLS 를 우회하므로 앱 코드에서 user_id 필터를 반드시 명시)

ALTER TABLE profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs             ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches          ENABLE ROW LEVEL SECURITY;
ALTER TABLE cover_letters    ENABLE ROW LEVEL SECURITY;
ALTER TABLE tailored_resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_sources      ENABLE ROW LEVEL SECURITY;
ALTER TABLE discovered_jobs  ENABLE ROW LEVEL SECURITY;

-- profiles (INSERT/DELETE 는 트리거·service role 전용)
DROP POLICY IF EXISTS "profiles: 본인만 조회" ON profiles;
DROP POLICY IF EXISTS "profiles: 본인만 수정" ON profiles;
CREATE POLICY "profiles: 본인만 조회" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles: 본인만 수정" ON profiles FOR UPDATE USING (auth.uid() = id);

-- jobs
DROP POLICY IF EXISTS "jobs: 인증 유저 전체 조회" ON jobs;
CREATE POLICY "jobs: 인증 유저 전체 조회" ON jobs FOR SELECT TO authenticated USING (true);

-- matches
DROP POLICY IF EXISTS "matches: 본인만 조회" ON matches;
DROP POLICY IF EXISTS "matches: 본인만 삽입" ON matches;
DROP POLICY IF EXISTS "matches: 본인만 수정" ON matches;
DROP POLICY IF EXISTS "matches: 본인만 삭제" ON matches;
CREATE POLICY "matches: 본인만 조회" ON matches FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "matches: 본인만 삽입" ON matches FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "matches: 본인만 수정" ON matches FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "matches: 본인만 삭제" ON matches FOR DELETE USING (auth.uid() = user_id);

-- cover_letters
DROP POLICY IF EXISTS "cover_letters: 본인만 조회" ON cover_letters;
DROP POLICY IF EXISTS "cover_letters: 본인만 삽입" ON cover_letters;
DROP POLICY IF EXISTS "cover_letters: 본인만 수정" ON cover_letters;
DROP POLICY IF EXISTS "cover_letters: 본인만 삭제" ON cover_letters;
CREATE POLICY "cover_letters: 본인만 조회" ON cover_letters FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "cover_letters: 본인만 삽입" ON cover_letters FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "cover_letters: 본인만 수정" ON cover_letters FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "cover_letters: 본인만 삭제" ON cover_letters FOR DELETE USING (auth.uid() = user_id);

-- tailored_resumes
DROP POLICY IF EXISTS "tailored_resumes: 본인만 조회" ON tailored_resumes;
DROP POLICY IF EXISTS "tailored_resumes: 본인만 삽입" ON tailored_resumes;
DROP POLICY IF EXISTS "tailored_resumes: 본인만 수정" ON tailored_resumes;
DROP POLICY IF EXISTS "tailored_resumes: 본인만 삭제" ON tailored_resumes;
CREATE POLICY "tailored_resumes: 본인만 조회" ON tailored_resumes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "tailored_resumes: 본인만 삽입" ON tailored_resumes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "tailored_resumes: 본인만 수정" ON tailored_resumes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "tailored_resumes: 본인만 삭제" ON tailored_resumes FOR DELETE USING (auth.uid() = user_id);

-- job_sources
DROP POLICY IF EXISTS "job_sources: 본인만 조회" ON job_sources;
DROP POLICY IF EXISTS "job_sources: 본인만 삽입" ON job_sources;
DROP POLICY IF EXISTS "job_sources: 본인만 수정" ON job_sources;
DROP POLICY IF EXISTS "job_sources: 본인만 삭제" ON job_sources;
CREATE POLICY "job_sources: 본인만 조회" ON job_sources FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "job_sources: 본인만 삽입" ON job_sources FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "job_sources: 본인만 수정" ON job_sources FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "job_sources: 본인만 삭제" ON job_sources FOR DELETE USING (auth.uid() = user_id);

-- discovered_jobs
DROP POLICY IF EXISTS "discovered_jobs: 본인만 조회" ON discovered_jobs;
DROP POLICY IF EXISTS "discovered_jobs: 본인만 삽입" ON discovered_jobs;
DROP POLICY IF EXISTS "discovered_jobs: 본인만 수정" ON discovered_jobs;
DROP POLICY IF EXISTS "discovered_jobs: 본인만 삭제" ON discovered_jobs;
CREATE POLICY "discovered_jobs: 본인만 조회" ON discovered_jobs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "discovered_jobs: 본인만 삽입" ON discovered_jobs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "discovered_jobs: 본인만 수정" ON discovered_jobs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "discovered_jobs: 본인만 삭제" ON discovered_jobs FOR DELETE USING (auth.uid() = user_id);


-- ============================================================
-- 8. Storage — 원본 이력서(DOCX) 버킷
-- ============================================================
-- 앱은 service role 로 업로드/다운로드하지만(RLS 우회), 심층 방어로
-- 유저가 본인 폴더(<user_id>/...)에만 접근하도록 정책을 건다.
INSERT INTO storage.buckets (id, name, public)
VALUES ('resumes', 'resumes', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "resumes: 본인 폴더만 접근" ON storage.objects;
CREATE POLICY "resumes: 본인 폴더만 접근" ON storage.objects
  FOR ALL TO authenticated
  USING      (bucket_id = 'resumes' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'resumes' AND (storage.foldername(name))[1] = auth.uid()::text);
