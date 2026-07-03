-- ============================================================
-- Migration 015: 구독(유료 플랜) 컬럼 추가
-- Stripe 월 구독 연동 — profiles에 플랜/구독 상태 저장
-- (모두 ADD COLUMN, 기존 데이터 삭제/변경 없음)
-- ============================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS subscription_status TEXT,
  ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer ON profiles (stripe_customer_id);
