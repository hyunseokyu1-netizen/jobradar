-- ============================================================
-- Migration 012: matches에 사용자 정렬 순서(position) 컬럼 추가
-- 채용공고 목록을 드래그로 직접 정렬한 순서를 유저별로 저장
-- ============================================================

ALTER TABLE matches
  ADD COLUMN IF NOT EXISTS position INTEGER;
