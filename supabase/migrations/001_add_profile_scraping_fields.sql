-- profiles 테이블에 스크래핑 설정 필드 추가
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS name              TEXT,
  ADD COLUMN IF NOT EXISTS desired_positions TEXT[],
  ADD COLUMN IF NOT EXISTS desired_sources   TEXT[] DEFAULT ARRAY['indeed'],
  ADD COLUMN IF NOT EXISTS desired_locations TEXT[] DEFAULT ARRAY['Sydney NSW'];

-- preferences JSONB에서 locations, keywords 제거 (새 컬럼으로 이관)
-- 기존 데이터가 있다면 아래 주석 해제 후 실행:
-- UPDATE profiles
--   SET desired_locations = ARRAY(SELECT jsonb_array_elements_text(preferences->'locations')),
--       desired_positions = ARRAY(SELECT jsonb_array_elements_text(preferences->'keywords'))
--   WHERE preferences IS NOT NULL;
