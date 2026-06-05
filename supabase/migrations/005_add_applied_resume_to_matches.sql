-- Migration 005: matches에 제출 이력서 저장 컬럼 추가
ALTER TABLE matches ADD COLUMN IF NOT EXISTS applied_resume_text TEXT;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS applied_resume_filename TEXT;
