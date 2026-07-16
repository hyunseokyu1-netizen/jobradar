// 사용자 입력 URL의 SSRF 방어.
// 유저가 등록한 채용페이지/공고 URL을 서버가 fetch·헤드리스 브라우저·리더 프록시로
// 요청하므로, 내부 네트워크(로컬호스트·사설망·클라우드 메타데이터)로의 요청을 차단한다.
// 사용처: URL 등록 액션(진입 검증) + fetch 직전·리다이렉트 홉마다(assertPublicUrl).

import { lookup } from 'node:dns/promises'
import { isIP } from 'node:net'

/** SSRF 정책 위반 전용 에러 — 재시도해도 결과가 같으므로 호출부에서 즉시 실패 처리한다 */
export class UrlGuardError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'UrlGuardError'
  }
}

/** 차단 대상 IP인지 판별 (IPv4/IPv6 리터럴). 공개 인터넷 주소만 false. */
export function isPrivateIp(ip: string): boolean {
  const version = isIP(ip)
  if (version === 4) return isPrivateIpv4(ip)
  if (version === 6) return isPrivateIpv6(ip)
  return true // IP가 아니면 판단 불가 — 호출부에서 DNS 해석 후 다시 검사
}

function isPrivateIpv4(ip: string): boolean {
  const parts = ip.split('.').map(Number)
  if (parts.length !== 4 || parts.some(n => !Number.isInteger(n) || n < 0 || n > 255)) return true
  const [a, b] = parts
  return (
    a === 0 ||                          // 0.0.0.0/8 (this-network)
    a === 10 ||                         // 10.0.0.0/8 사설
    a === 127 ||                        // 127.0.0.0/8 루프백
    (a === 100 && b >= 64 && b <= 127) || // 100.64.0.0/10 CGNAT
    (a === 169 && b === 254) ||         // 169.254.0.0/16 링크로컬 (클라우드 메타데이터 포함)
    (a === 172 && b >= 16 && b <= 31) ||  // 172.16.0.0/12 사설
    (a === 192 && b === 0) ||           // 192.0.0.0/24 IETF 예약 등
    (a === 192 && b === 168) ||         // 192.168.0.0/16 사설
    (a === 198 && (b === 18 || b === 19)) || // 198.18.0.0/15 벤치마크
    a >= 224                            // 224.0.0.0/4 멀티캐스트 + 240.0.0.0/4 예약 + 브로드캐스트
  )
}

function isPrivateIpv6(ip: string): boolean {
  const lower = ip.toLowerCase()
  // IPv4-mapped — 점-십진(::ffff:1.2.3.4)과 URL 정규화 후의 16진 그룹(::ffff:102:304) 모두 처리.
  // (new URL()은 점-십진 표기를 16진 그룹으로 정규화하므로 두 형태 다 들어올 수 있다)
  const dotted = lower.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/)
  if (dotted) return isPrivateIpv4(dotted[1])
  const hex = lower.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/)
  if (hex) {
    const hi = parseInt(hex[1], 16)
    const lo = parseInt(hex[2], 16)
    return isPrivateIpv4(`${hi >> 8}.${hi & 0xff}.${lo >> 8}.${lo & 0xff}`)
  }
  const head = lower.split(':').find(Boolean) ?? ''
  return (
    lower === '::1' || lower === '::' ||       // 루프백·미지정
    head.startsWith('fc') || head.startsWith('fd') || // fc00::/7 ULA
    head.startsWith('fe8') || head.startsWith('fe9') ||
    head.startsWith('fea') || head.startsWith('feb') || // fe80::/10 링크로컬
    head.startsWith('ff')                      // ff00::/8 멀티캐스트
  )
}

/**
 * 동기 정책 검사 — 프로토콜·인증정보·호스트명 수준에서 걸러낸다.
 * 위반 시 사용자용 메시지를 반환, 통과 시 null.
 */
export function findUrlPolicyViolation(raw: string): string | null {
  let url: URL
  try {
    url = new URL(raw.trim())
  } catch {
    return '유효하지 않은 URL입니다.'
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return 'http/https 주소만 등록할 수 있어요.'
  }
  if (url.username || url.password) {
    return '사용자 정보(아이디:비밀번호)가 포함된 URL은 등록할 수 없어요.'
  }

  const host = url.hostname.toLowerCase().replace(/\.$/, '')
  // IPv6 리터럴은 URL에서 대괄호로 감싸짐 — 제거 후 검사
  const bare = host.replace(/^\[|\]$/g, '')

  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') || host.endsWith('.internal')) {
    return '내부 네트워크 주소는 등록할 수 없어요.'
  }
  if (isIP(bare) && isPrivateIp(bare)) {
    return '내부 네트워크 주소는 등록할 수 없어요.'
  }
  // 점 없는 단일 호스트명(intranet 등)은 공개 도메인이 아님
  if (!isIP(bare) && !host.includes('.')) {
    return '유효한 공개 도메인이 아니에요.'
  }
  return null
}

/**
 * 전체 검사 — 동기 정책 + DNS 해석 결과의 사설 IP 여부.
 * fetch 직전과 리다이렉트 홉마다 호출한다. 통과 시 null, 위반 시 사용자용 메시지.
 */
export async function findUrlViolationWithDns(raw: string): Promise<string | null> {
  const policyError = findUrlPolicyViolation(raw)
  if (policyError) return policyError

  const host = new URL(raw.trim()).hostname.replace(/^\[|\]$/g, '')
  if (isIP(host)) return null // 리터럴 IP는 위에서 이미 검사됨

  try {
    const addrs = await lookup(host, { all: true, verbatim: true })
    if (addrs.some(a => isPrivateIp(a.address))) {
      return '내부 네트워크로 연결되는 주소는 사용할 수 없어요.'
    }
  } catch {
    return '주소를 찾을 수 없어요. URL을 확인해주세요.'
  }
  return null
}

/** 위반 시 UrlGuardError를 throw하는 편의 래퍼 (fetch 경로용) */
export async function assertPublicUrl(raw: string): Promise<void> {
  const violation = await findUrlViolationWithDns(raw)
  if (violation) throw new UrlGuardError(violation)
}
