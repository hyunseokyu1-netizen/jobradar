-- ============================================================
-- Migration 017: Stripe → Paddle 결제 전환
-- 한국은 Stripe 계정 국가 선택지에 없어(미국 KYC/정산 불가) Paddle로 교체.
-- 기존 stripe_customer_id/stripe_subscription_id는 삭제하지 않고 레거시로 보존.
-- plan/subscription_status/current_period_end는 provider 중립 컬럼이라 그대로 재사용.
-- ============================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS paddle_customer_id     TEXT,
  ADD COLUMN IF NOT EXISTS paddle_subscription_id TEXT;

CREATE INDEX IF NOT EXISTS idx_profiles_paddle_customer ON profiles (paddle_customer_id);
