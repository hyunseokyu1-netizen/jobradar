-- ============================================================
-- Migration 009: profiles에 원본 이력서 파일(Storage 경로) 컬럼 추가
-- DOCX 양식 유지 맞춤 이력서 생성에 사용
-- ============================================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS resume_file_path TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS resume_file_name TEXT;
