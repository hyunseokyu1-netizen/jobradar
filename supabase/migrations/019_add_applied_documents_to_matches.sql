-- ============================================================
-- Migration 019: 제출 서류 다중 파일
-- matches.applied_documents — 공고별 제출 서류 목록 (최대 5개, 코드 레벨 제한)
-- 파일 원본은 Storage 'application-docs' 버킷(비공개)에 저장하고,
-- 여기엔 메타데이터만 저장한다: [{ name, path, size, uploadedAt }]
-- 기존 applied_resume_text/filename(이력서 텍스트 추출)은 그대로 유지.
-- ============================================================

ALTER TABLE matches
  ADD COLUMN IF NOT EXISTS applied_documents JSONB NOT NULL DEFAULT '[]'::jsonb;
