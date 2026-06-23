-- ============================================================
-- Migration 009: tailored_resumes 한글 번역 캐싱
-- 번역 버튼 클릭 시 결과를 저장해 재방문 시 재번역 없이 표시
-- ============================================================

ALTER TABLE tailored_resumes
  ADD COLUMN IF NOT EXISTS translation TEXT;
