-- ============================================================
-- Migration 021: 개인 공고 비공개 처리
-- 지원 현황에서 유저가 URL을 붙여넣거나 직접 입력해 추가한 공고는
-- (예: 특정 회사 지원 링크, 손으로 타이핑한 사내 공고) 다른 유저의
-- "잡 탐색 · 전체 수집 공고" 공유 풀에 노출하지 않는다.
-- 채용페이지 수집(discover) 파이프라인으로 들어온 공고만 계속 공유된다.
-- ============================================================

ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS is_personal BOOLEAN NOT NULL DEFAULT false;

-- 과거 데이터: URL 없이 손으로 입력한 공고(synthetic manual:// URL)는 소급 비공개 처리
UPDATE jobs SET is_personal = true WHERE url LIKE 'manual://%';
