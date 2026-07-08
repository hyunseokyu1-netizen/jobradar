import { Paddle, Environment } from '@paddle/paddle-node-sdk'

// Paddle 서버 클라이언트. PADDLE_API_KEY 가 있어야 실제 결제가 동작한다.
const apiKey = process.env.PADDLE_API_KEY
const environment = process.env.PADDLE_ENVIRONMENT === 'production' ? Environment.production : Environment.sandbox

export const paddle = apiKey ? new Paddle(apiKey, { environment }) : null

export function requirePaddle(): Paddle {
  if (!paddle) {
    throw new Error('PADDLE_API_KEY 가 설정되지 않았습니다. 결제 기능을 사용하려면 환경변수를 추가해주세요.')
  }
  return paddle
}
