-- ============================================================
-- Migration 023: 매칭 점수 신뢰 수준 구분
-- matches.score_type — 점수가 어떤 근거로 계산됐는지 기록한다.
--   'jd_analysis'    : JD 전문 기반 정밀 분석
--   'title_estimate' : JD가 없어 제목·회사만으로 추정 (신뢰도 낮음)
--   NULL             : 이 컬럼 도입 전에 계산된 과거 점수
-- 함께: 분석 실패를 score=0으로 저장하던 것을 NULL로 바꾸므로,
-- 과거에 '분석 실패'/'매칭 실패' 사유로 0점이 된 행을 소급해 NULL 처리한다.
-- ============================================================

ALTER TABLE matches
  ADD COLUMN IF NOT EXISTS score_type TEXT;

-- 과거 분석 실패 행: 실제 0점이 아니라 실패였으므로 미채점(NULL)으로 정정
UPDATE matches
SET score = NULL
WHERE score = 0
  AND (reason LIKE '분석 실패%' OR reason LIKE '매칭 실패%');
