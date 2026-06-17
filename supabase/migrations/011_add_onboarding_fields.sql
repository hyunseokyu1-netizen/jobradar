-- ============================================================
-- Migration 011: 온보딩 채팅 플로우용 프로필 컬럼 추가
-- 가입 후 한국어 채팅 입력 → 영어 번역 → ko/en 양쪽 저장
-- ============================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS onboarding_ko        JSONB   NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS onboarding_en        JSONB   NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS phone                TEXT;

-- onboarding_ko / onboarding_en 공통 shape (참고)
-- {
--   "name": "", "phone": "",
--   "education":  [{ "school": "", "major": "", "degree": "", "period": "" }],
--   "experience": [{ "company": "", "position": "", "period": "", "description": "" }],
--   "skills": [],
--   "desired": { "positions": [], "locations": [], "salary_min": null, "salary_max": null, "salary_currency": "AUD" }
-- }
