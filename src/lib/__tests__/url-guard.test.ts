import { describe, it, expect, vi, beforeEach } from 'vitest'

// DNS 조회는 모킹 — 실제 네트워크 없이 리바인딩 도메인 시나리오를 재현한다
const lookupMock = vi.fn()
vi.mock('node:dns/promises', () => ({
  lookup: (...args: unknown[]) => lookupMock(...args),
}))

const { findUrlPolicyViolation, findUrlViolationWithDns, isPrivateIp, UrlGuardError, assertPublicUrl } =
  await import('@/lib/url-guard')

describe('isPrivateIp', () => {
  it.each([
    ['8.8.8.8', false],
    ['1.1.1.1', false],
    ['2606:4700::1111', false],
    ['10.0.0.1', true],
    ['127.0.0.1', true],
    ['169.254.169.254', true],   // 클라우드 메타데이터
    ['172.16.0.1', true],
    ['192.168.1.1', true],
    ['100.64.0.1', true],        // CGNAT
    ['192.0.2.1', true],         // IETF 예약
    ['198.18.0.1', true],        // 벤치마크
    ['255.255.255.255', true],
    ['0.0.0.0', true],
    ['::1', true],
    ['fe80::1', true],           // 링크로컬
    ['fd00::1', true],           // ULA
  ])('%s → private=%s', (ip, expected) => {
    expect(isPrivateIp(ip)).toBe(expected)
  })
})

describe('findUrlPolicyViolation (동기 정책)', () => {
  // 작업 계획 문서 시나리오 F의 URL 전부 포함
  it.each([
    'http://localhost',
    'http://127.0.0.1',
    'http://169.254.169.254',
    'http://10.0.0.1',
    'http://[::1]',
    'http://[::ffff:127.0.0.1]',  // IPv4-mapped IPv6
    'http://[::ffff:a00:1]',       // IPv4-mapped 16진 그룹 (10.0.0.1)
    'ftp://example.com',           // 비허용 프로토콜
    'https://user:pass@example.com', // credentials
    'http://db.internal',
    'http://intranet',             // 점 없는 호스트
  ])('차단: %s', url => {
    expect(findUrlPolicyViolation(url)).not.toBeNull()
  })

  it.each([
    'https://boards.greenhouse.io/stripe',
    'https://jobs.lever.co/spotify',
    'https://www.seek.com.au/job/1234',
    'http://[::ffff:808:808]', // IPv4-mapped이지만 공개(8.8.8.8)
  ])('허용: %s', url => {
    expect(findUrlPolicyViolation(url)).toBeNull()
  })
})

describe('findUrlViolationWithDns (DNS 해석 포함)', () => {
  beforeEach(() => {
    lookupMock.mockReset()
  })

  it('공개 IP로 풀리는 도메인은 허용', async () => {
    lookupMock.mockResolvedValue([{ address: '104.16.0.1', family: 4 }])
    expect(await findUrlViolationWithDns('https://example.com/jobs')).toBeNull()
  })

  it('사설 IP로 풀리는 도메인(리바인딩)은 차단', async () => {
    lookupMock.mockResolvedValue([{ address: '127.0.0.1', family: 4 }])
    expect(await findUrlViolationWithDns('http://localtest.example.com')).toContain('내부 네트워크')
  })

  it('공개+사설 혼합 A레코드도 차단', async () => {
    lookupMock.mockResolvedValue([
      { address: '104.16.0.1', family: 4 },
      { address: '169.254.169.254', family: 4 },
    ])
    expect(await findUrlViolationWithDns('https://mixed.example.com')).toContain('내부 네트워크')
  })

  it('DNS 해석 실패는 사용자용 메시지로 차단', async () => {
    // mockRejectedValue는 Vitest 4에서 미처리 rejection으로 감지될 수 있어 구현으로 대체
    lookupMock.mockImplementation(async () => {
      throw new Error('ENOTFOUND')
    })
    expect(await findUrlViolationWithDns('https://no-such-domain.example')).toContain('주소를 찾을 수 없어요')
  })

  it('리터럴 IP는 DNS 조회 없이 판정', async () => {
    expect(await findUrlViolationWithDns('http://10.0.0.1')).not.toBeNull()
    expect(lookupMock).not.toHaveBeenCalled()
  })
})

describe('assertPublicUrl', () => {
  it('위반 시 UrlGuardError를 던진다 (호출부의 즉시 실패 판정용)', async () => {
    await expect(assertPublicUrl('http://127.0.0.1')).rejects.toBeInstanceOf(UrlGuardError)
  })
})
