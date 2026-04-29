-- ============================================================
-- Migration 003: 사용자별 데이터 분리 수정
-- - jobs.memo → matches.memo 이동 (공유 필드 → 유저별 필드)
-- - cover_letters에 UNIQUE (user_id, job_id) 추가
-- ============================================================

-- 1. matches에 memo 컬럼 추가
ALTER TABLE matches ADD COLUMN IF NOT EXISTS memo TEXT;

-- 2. jobs.memo 데이터를 matches로 이전 (매칭된 job에 한해)
UPDATE matches m
SET memo = j.memo
FROM jobs j
WHERE m.job_id = j.id AND j.memo IS NOT NULL;

-- 3. jobs.memo 컬럼 제거
ALTER TABLE jobs DROP COLUMN IF EXISTS memo;

-- 4. cover_letters에 UNIQUE (user_id, job_id) 추가
--    (기존 중복 rows가 있을 경우 최신 것만 남기고 제거)
DELETE FROM cover_letters
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id, job_id) id
  FROM cover_letters
  ORDER BY user_id, job_id, created_at DESC
);

ALTER TABLE cover_letters
  ADD CONSTRAINT cover_letters_user_id_job_id_key UNIQUE (user_id, job_id);
