import Stripe from 'stripe'

// Stripe 서버 클라이언트. STRIPE_SECRET_KEY 가 있어야 실제 결제가 동작한다.
const key = process.env.STRIPE_SECRET_KEY

// apiVersion 은 SDK 기본값 사용 (버전 고정 시 SDK 업그레이드마다 타입 충돌)
export const stripe = key ? new Stripe(key) : null

export function requireStripe(): Stripe {
  if (!stripe) {
    throw new Error('STRIPE_SECRET_KEY 가 설정되지 않았습니다. 결제 기능을 사용하려면 환경변수를 추가해주세요.')
  }
  return stripe
}
