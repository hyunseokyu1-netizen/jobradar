-- ============================================================
-- Migration 016: 공개 이력서 공유 링크
-- 유저가 자신의 영문 이력서를 공개 URL(/r/<slug>)로 공유할 수 있게 한다.
-- (바이럴 루프 — 공유 페이지 하단에 "매치다로 제작" 노출)
-- ============================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS public_slug            TEXT,
  ADD COLUMN IF NOT EXISTS public_resume_enabled  BOOLEAN NOT NULL DEFAULT false;

-- 슬러그는 전역 유일 (공개 URL 식별자)
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_public_slug
  ON profiles (public_slug)
  WHERE public_slug IS NOT NULL;
