import { anthropic, textOf } from '@/lib/claude'

// 체험 후기 검열 — nogari 프로젝트의 2단계 검열(정규식 → LLM)을 매치다 후기 컨텍스트로 이식.
// 원칙: 서비스에 대한 비판·불만은 후기의 목적이므로 반드시 허용, 욕설·인신공격·스팸만 차단.

export interface ModerationDecision {
  blocked: boolean
  reason?: string
}

// 개인정보 패턴 — 매칭 시 LLM 호출 없이 즉시 차단 (공개 게재될 수 있는 텍스트라 보호 목적)
const PII_PATTERNS: { pattern: RegExp; reason: string }[] = [
  {
    pattern: /\d{6}[-\s]?[1-4]\d{6}/,
    reason: '주민등록번호로 추정되는 정보가 포함되어 있어요. 개인정보는 빼고 작성해주세요.',
  },
  {
    pattern: /01[016789][-\s]?\d{3,4}[-\s]?\d{4}/,
    reason: '전화번호로 추정되는 정보가 포함되어 있어요. 개인정보는 빼고 작성해주세요.',
  },
  {
    pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/,
    reason: '이메일 주소가 포함되어 있어요. 개인정보는 빼고 작성해주세요.',
  },
]

// 명백한 욕설/비속어 (초성·로마자 우회 포함) — 즉시 차단, 애매한 변형은 LLM이 판단
const PROFANITY_PATTERNS: RegExp[] = [
  /씨\s*발/i,
  /시\s*발/i,
  /병\s*신/i,
  /좆\s*같/i,
  /좆\s*또/i,
  /개\s*새\s*끼/i,
  /지\s*랄/i,
  /니\s*기\s*미/i,
  /ㅅㅂ/i,
  /ㅂㅅ/i,
  /sib+al/i,
  /sip+al/i,
  /byeong\s*sin/i,
  /ssibal/i,
]

const PROFANITY_REASON = '욕설·비속어가 포함되어 있어요. 불편했던 점은 좋지만, 표현은 부드럽게 부탁드려요.'

function checkPii(content: string): ModerationDecision | null {
  for (const { pattern, reason } of PII_PATTERNS) {
    if (pattern.test(content)) return { blocked: true, reason }
  }
  return null
}

function checkProfanity(content: string): ModerationDecision | null {
  for (const pattern of PROFANITY_PATTERNS) {
    if (pattern.test(content)) return { blocked: true, reason: PROFANITY_REASON }
  }
  return null
}

// 2차: 정규식을 통과한 텍스트만 Haiku로 판단 (변형 욕설·인신공격·스팸)
async function moderateWithLlm(content: string): Promise<ModerationDecision> {
  try {
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 256,
      system:
        '너는 커리어 서비스 "매치다"의 체험 후기 검수 담당자다. JSON으로만 응답해라: {"blocked": boolean, "reason": string}\n' +
        '차단 대상: 욕설·비속어(변형·초성·로마자 표기 포함), 특정인에 대한 인신공격·비방, 살해·폭력 협박, 광고·스팸·무관한 홍보 링크.\n' +
        '허용 대상: 서비스에 대한 비판·불만·실망 표현은 후기의 목적이므로 아무리 부정적이어도 욕설이 없으면 반드시 통과시켜라. ' +
        '"별로예요", "돈 아깝다", "기대 이하", "추천 안 함" 같은 표현은 전부 통과다. ' +
        '욕설 단어가 하나라도 섞여 있으면 나머지가 정상적인 비판이어도 차단해라.',
      messages: [{ role: 'user', content }],
    })
    const raw = textOf(message)
    const m = raw.match(/\{[\s\S]*\}/)
    if (!m) return { blocked: false }
    const parsed = JSON.parse(m[0]) as { blocked?: boolean; reason?: string }
    return { blocked: !!parsed.blocked, reason: parsed.reason }
  } catch (e) {
    // LLM 장애 시 통과(fail-open) — 어차피 운영자가 전수 확인하고, 후기 제출을 막는 게 더 큰 손해
    console.error('Feedback moderation LLM error (fail-open):', e)
    return { blocked: false }
  }
}

/** 후기 본문·공개 표시 이름 검열. 1차 정규식(무료) → 2차 LLM(Haiku) */
export async function moderateFeedback(content: string): Promise<ModerationDecision> {
  const text = content.trim()
  if (!text) return { blocked: false }

  const piiHit = checkPii(text)
  if (piiHit) return piiHit

  const profanityHit = checkProfanity(text)
  if (profanityHit) return profanityHit

  return moderateWithLlm(text)
}
