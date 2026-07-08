import Anthropic from '@anthropic-ai/sdk'

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

/**
 * 응답에서 텍스트 블록을 안전하게 추출한다.
 * thinking이 켜진 모델(adaptive thinking 등)은 content[0]이 thinking 블록이라
 * content[0].type === 'text' 직접 접근은 빈 문자열이 된다 — 반드시 이 헬퍼를 쓸 것.
 */
export function textOf(message: { content: { type: string; text?: string }[] }): string {
  const block = message.content.find(b => b.type === 'text')
  return typeof block?.text === 'string' ? block.text.trim() : ''
}
