-- Migration 004: matches.status에 interview, accepted, rejected 추가
-- (status는 TEXT 타입이라 CHECK constraint가 없으면 변경 불필요)
-- 기존 CHECK constraint가 있는 경우 아래를 실행

-- status 컬럼에 check constraint가 있다면 제거 후 재생성
-- (현재 스키마에는 없으므로 이 파일은 참고용)
-- ALTER TABLE matches DROP CONSTRAINT IF EXISTS matches_status_check;
