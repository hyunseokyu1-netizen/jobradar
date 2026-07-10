-- ============================================================
-- Migration 006: seek 소스 공고를 yu.tyson 계정으로 이전
-- hyunseok.yu1 → yu.tyson (matches 레코드 이동)
-- ============================================================

-- 1. yu.tyson 프로파일이 없으면 생성
INSERT INTO profiles (email, name)
VALUES ('yu.tyson@gmail.com', '')
ON CONFLICT (email) DO NOTHING;

-- 2. seek 소스 job의 matches를 tyson 계정으로 복사
--    (이미 있으면 skip)
INSERT INTO matches (user_id, job_id, score, reason, status, memo)
SELECT
  (SELECT id FROM profiles WHERE email = 'yu.tyson@gmail.com'),
  m.job_id,
  m.score,
  m.reason,
  m.status,
  m.memo
FROM matches m
JOIN jobs j ON j.id = m.job_id
WHERE m.user_id = (SELECT id FROM profiles WHERE email = 'hyunseok.yu1@gmail.com')
  AND j.source = 'seek'
ON CONFLICT (user_id, job_id) DO NOTHING;

-- 3. hyunseok 계정에서 seek 소스 matches 삭제
DELETE FROM matches
WHERE user_id = (SELECT id FROM profiles WHERE email = 'hyunseok.yu1@gmail.com')
  AND job_id IN (SELECT id FROM jobs WHERE source = 'seek');

-- 확인용 쿼리 (실행 후 결과 점검)
SELECT
  p.email,
  COUNT(*) AS match_count,
  COUNT(CASE WHEN j.source = 'seek' THEN 1 END) AS seek_count
FROM matches m
JOIN profiles p ON p.id = m.user_id
JOIN jobs j ON j.id = m.job_id
GROUP BY p.email;
