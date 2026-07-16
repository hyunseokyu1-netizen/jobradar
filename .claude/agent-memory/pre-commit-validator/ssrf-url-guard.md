---
name: ssrf-url-guard
description: src/lib/url-guard.ts SSRF 방어 설계 — 커버 범위, 알려진 잔여 리스크, 검증 시 확인 포인트
metadata:
  type: project
---

`src/lib/url-guard.ts`(2026-07-16 도입)는 유저가 등록한 채용페이지 URL을 서버가 fetch(`fetch-html.ts`)·
헤드리스 브라우저(`fetch-html-browser.ts`)·리더 프록시(`reader.ts`)로 요청하기 전 SSRF를 막는 공통 가드다.
등록 액션(`src/app/actions.ts`의 addJobByUrl, `src/app/discover/actions.ts`의 addPresetSource/addJobSource)은
`findUrlViolationWithDns`(DNS 포함 풀 체크)로 등록 시점에 막고, 실제 요청 3곳은 각각 요청 직전(및 fetch-html.ts는
리다이렉트 홉마다) `assertPublicUrl`을 다시 호출한다 — 등록 시점과 스크래핑 시점 사이 DNS가 바뀌는 TOCTOU까지 의도적으로
방어하는 좋은 설계.

**핵심 안전장치 확인됨 (재검증 불필요, node로 직접 테스트 완료):**
- WHATWG URL 파서(`new URL()`)가 `127.1`/`2130706433`(10진)/`0x7f000001`(16진)/`017700000001`(8진) 같은
  IPv4 난독화 표기를 전부 `127.0.0.1` 형태로 정규화한 뒤 `hostname`에 노출한다 — 즉 `findUrlPolicyViolation`이
  `url.hostname`으로 검사하는 한 이 클래스의 SSRF 우회는 원천 차단된다 (Node 20 기준, Chromium도 동일 WHATWG 스펙 사용).
- `findUrlViolationWithDns`는 `dns.lookup(host, {all:true})`로 반환되는 **모든** 주소를 검사(`some`)하므로
  멀티 A레코드(공개 IP + 사설 IP 혼합) 우회도 막는다.
- IPv4 사설대역 커버리지 양호: 0.0.0.0/8, 10/8, 127/8, 100.64.0.0/10(CGNAT, 알리바바 메타데이터 100.100.100.200 포함),
  169.254/16, 172.16/12, 192.0.0.0/24, 192.168/16, 198.18-19(벤치마크), 224+(멀티캐스트/예약/브로드캐스트) 전부 포함.

**알려진 잔여 리스크 (커밋 차단 사유는 아님, 후속 개선 후보):**
1. `fetch-html-browser.ts`의 `page.route('**/*', ...)` 콜백은 [[synchronous-only-policy-check-gap]] —
   `findUrlPolicyViolation`(동기, DNS 없음)만 쓴다. IP 리터럴 난독화는 URL 정규화 덕에 막히지만, **호스트명이 DNS로
   사설 IP에 매핑되는 경우**(예: 공격자가 `evil.com` A레코드를 169.254.169.254로 설정)는 서브리소스 요청에서
   못 막는다 — 최초 `page.goto` 내비게이션만 `assertPublicUrl`(DNS 포함)로 보호되고, 페이지 내 JS가 유발하는
   이후 요청은 무방비. Playwright의 `route()` 핸들러는 async도 지원하므로 기술적 제약은 아니고 "매 요청 DNS 조회
   지연" 트레이드오프로 인한 의도적 선택. 리스크 낮음(악성/변조된 채용페이지가 브라우저 폴백 경로를 타야 함) — 완화하려면
   짧은 DNS 캐시 + 타임박스(예: 300ms) 비동기 체크를 권장.
2. DNS 리바인딩 TOCTOU: `assertPublicUrl`(dns.lookup)과 실제 `fetch()`/브라우저 연결의 실제 DNS 재조회 사이에
   미세한 시간차가 있다 — TTL=0으로 응답을 바꾸는 능동적 공격자는 이론상 우회 가능. 완전 방어는 소켓 레벨 IP
   pinning(예: undici Agent의 custom lookup)이 필요. 업계 표준적으로 흔한 수준의 방어이며 현재 구현은 창을
   최소화(체크 직후 바로 fetch)하는 합리적 절충으로 판단.
3. `isPrivateIpv6`의 IPv4-mapped 정규식(`^::ffff:(\d+\.\d+\.\d+\.\d+)$`)은 사실상 도달 불가능한 데드코드다 —
   `new URL()`이 `[::ffff:1.2.3.4]`를 항상 16진 그룹 형태(`[::ffff:102:304]`)로 정규화해버려서 점-십진 표기가
   `url.hostname`에 남지 않는다. 대신 우연히 첫 non-empty 세그먼트가 "ffff"라 멀티캐스트(`ff`) 접두사 검사에
   걸려 IPv4-mapped 주소는 공개/사설 무관하게 전부 차단된다(fail-closed, 보안 문제 아님 — `::ffff:8.8.8.8` 같은
   합법 공개 주소를 오탐 차단하는 정도의 아주 낮은 실사용 영향 buglet).
4. `fetch-html.ts`의 에러 즉시-실패 판정이 한국어 에러 메시지 부분 문자열 매칭(`'주소는'|'주소를'|'리다이렉트가'`)에
   의존한다 — 예: `findUrlPolicyViolation`의 자격증명 포함 URL 에러("...URL은 등록할 수 없어요")나 "유효하지
   않은 URL입니다"는 이 패턴에 안 걸려 불필요하게 재시도된다. 보안 우회는 아님(재시도해도 같은 URL부터 다시 시작이라
   결과 동일, 그냥 낭비). 타입드 에러 클래스(예: `SsrfViolationError`)로 바꾸면 더 견고해짐 — 리뷰 시 제안 가능.

**How to apply:** 이 가드 관련 diff를 다시 리뷰할 때 위 1~4번은 이미 알려진/받아들여진 리스크이니 최초 발견인 것처럼
CRITICAL로 재플래그하지 말 것. 단, 새로운 사용자-URL fetch 경로가 추가되는데 `assertPublicUrl`/`findUrlViolationWithDns`
호출이 빠져있으면 CRITICAL로 플래그. `src/lib/discover/ats.ts`의 `fetchJson`(Greenhouse/Lever/Ashby/SmartRecruiters/
Apple)은 호스트가 하드코딩된 신뢰 도메인이고 `board`는 path segment로만 쓰이므로 SSRF 대상 아님 — 가드 누락으로
보지 말 것.
