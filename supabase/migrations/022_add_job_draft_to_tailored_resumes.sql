-- ============================================================
-- Migration 022: 공고별 이력서 초안 — 마스터 이력서와 완전 분리
-- 지금까지 워크스페이스의 "저장"·"AI 번역"은 profiles.onboarding_ko/en(마스터 이력서)을
-- 직접 덮어썼다. 공고 A에서 저장하면 공고 B 작업 때도 그 내용이 남고, 서로의 편집을
-- 덮어쓸 수 있는 데이터 무결성 버그였다.
--
-- 이제 워크스페이스의 저장·번역은 여기 새 컬럼(content_ko/content_en, 구조화 JSONB)에만
-- 쓰고, 마스터는 /profile 에서만 수정된다. 기존 content/translation(평문, 별도 "맞춤 이력서"
-- 모달 기능)은 그대로 유지 — 같은 행을 공유하지만 서로 다른 컬럼이라 충돌하지 않는다.
--
-- base_resume_synced_at: 이 초안이 마스터의 어느 시점 내용을 기준으로 만들어졌는지 기록.
-- profiles.updated_at 과 비교해 "마스터가 이후 바뀌었는지"를 감지하는 데 쓰인다.
-- ============================================================

ALTER TABLE tailored_resumes
  ADD COLUMN IF NOT EXISTS content_ko JSONB,
  ADD COLUMN IF NOT EXISTS content_en JSONB,
  ADD COLUMN IF NOT EXISTS base_resume_synced_at TIMESTAMPTZ;

-- profiles.updated_at은 매칭 설정(desired_positions 등) 변경에도 갱신되어 "마스터가 바뀜"
-- 감지 기준으로 쓰기엔 오탐이 생긴다. 이력서 내용(onboarding_ko/en)이 실제로 바뀔 때만
-- 갱신되는 전용 컬럼을 별도로 둔다.
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS resume_updated_at TIMESTAMPTZ;
