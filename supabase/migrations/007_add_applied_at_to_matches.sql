-- Migration 007: matches에 지원 날짜 컬럼 추가
ALTER TABLE matches ADD COLUMN IF NOT EXISTS applied_at TIMESTAMPTZ;
