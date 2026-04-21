-- 채용공고
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT,              -- 'indeed' | 'glassdoor'
  title TEXT,
  company TEXT,
  location TEXT,
  salary TEXT,
  description TEXT,
  url TEXT UNIQUE,
  posted_at TIMESTAMPTZ,
  scraped_at TIMESTAMPTZ DEFAULT NOW()
);

-- 매칭 결과
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  score INTEGER,            -- 0~100
  reason TEXT,
  status TEXT DEFAULT 'new', -- 'new' | 'bookmarked' | 'applied' | 'pass'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 내 프로파일
CREATE TABLE my_profile (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skills TEXT[],
  career_summary TEXT,
  story TEXT,
  resume_text TEXT,
  preferences JSONB,        -- { salary, location, company_size }
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 커버레터
CREATE TABLE cover_letters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
