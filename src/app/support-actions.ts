'use server'

import { SUPPORT_KNOWLEDGE } from '@/lib/support/knowledge'

export interface SupportMessage {
  role: 'user' | 'assistant'
  content: string
}

/**
 * 고객센터 사용법 안내 챗봇. MatchDa 지식 베이스를 바탕으로 사용법·FAQ를 응대한다.
 * DB를 조회하지 않으며, 서비스 사용법 범위 안에서만 답한다.
 */
export async function askSupportBot(
  history: SupportMessage[]
): Promise<{ reply?: string; error?: string }> {
  const msgs = (history ?? [])
    .filter(m => (m.role === 'user' || m.role === 'assistant') && m.content?.trim())
    .slice(-12)
  if (!msgs.length) return { error: '메시지가 비어 있습니다.' }

  try {
    const { anthropic } = await import('@/lib/claude')
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 700,
      system: `당신은 "MatchDa" 서비스의 친절한 고객센터 도우미입니다. 아래 지식 베이스를 바탕으로 사용자의 사용법·기능 질문에 한국어로 답하세요.

규칙:
- 아래 지식에 근거해 정확하고 간결하게 답합니다 (보통 2~5문장, 필요하면 단계로).
- 특정 페이지를 안내할 땐 이름과 경로를 함께 말합니다 (예: "잡 탐색(/discover)").
- 지식에 없는 것은 추측하지 말고, 모른다고 하거나 관련 기능으로 안내합니다.
- 계정의 개인 데이터(내 공고 수 등)는 조회할 수 없으니, 해당 질문은 어디서 확인하는지 안내합니다.
- MatchDa와 무관한 요청(코드 작성, 일반 상식 등)은 정중히 사용법 도우미임을 밝히고 범위를 벗어난다고 안내합니다.
- 답변은 항상 한국어로, 친근하고 명확하게.

# 지식 베이스
${SUPPORT_KNOWLEDGE}`,
      messages: msgs.map(m => ({ role: m.role, content: m.content })),
    })
    const reply = message.content[0]?.type === 'text' ? message.content[0].text.trim() : ''
    return { reply: reply || '죄송해요, 답변을 만들지 못했어요. 다시 한 번 물어봐 주세요.' }
  } catch (e) {
    console.error('Support bot error:', e)
    return { error: '일시적인 오류예요. 잠시 후 다시 시도해주세요.' }
  }
}
