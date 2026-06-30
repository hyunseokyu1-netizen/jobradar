-- ============================================================
-- Migration 014: matches에 공고별 이력서 최적화 결과 캐싱
-- 워크스페이스에서 AI가 분석한 하이라이트/최적화 노트를 저장.
-- 형태: { "highlights": ["..."], "note": { "keyword": "'...'", "body": "..." }, "generated_at": "ISO" }
-- ============================================================

ALTER TABLE matches
  ADD COLUMN IF NOT EXISTS optimization JSONB;
