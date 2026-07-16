-- ============================================================
-- Migration 024: 채용페이지 백그라운드 자동 수집
-- job_sources에 자동 수집 스케줄·실패 백오프·동시 실행 잠금 상태를 추가한다.
--   next_scrape_at        : 다음 자동 수집 예정 시각 (NULL = 등록 직후, 다음 크론에서 처리)
--   consecutive_failures  : 연속 실패 횟수 (성공 시 0으로 리셋, 지수 백오프 계산에 사용)
--   auto_scrape_paused    : 반복 실패로 자동 수집 일시중지 (수동 수집 성공 시 해제)
--   scrape_lock_at        : 크론 동시/중복 실행 방지 잠금 (15분 지나면 무시 — 죽은 잠금 회수)
-- ============================================================

ALTER TABLE job_sources
  ADD COLUMN IF NOT EXISTS next_scrape_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS consecutive_failures INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS auto_scrape_paused BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS scrape_lock_at TIMESTAMPTZ;

-- 크론의 due 소스 선정 쿼리용
CREATE INDEX IF NOT EXISTS idx_job_sources_next_scrape
  ON job_sources (next_scrape_at)
  WHERE auto_scrape_paused = false;
