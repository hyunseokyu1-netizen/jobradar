---
name: landing-demo-data-not-pii
description: src/components/matchda/landing/* 의 하드코딩된 회사명·도시·연봉·매치율은 정책 위반 아님
metadata:
  type: project
---

`GlobalConnectGraphic.tsx`, `ApplicationsShowcase.tsx` 등 랜딩 페이지 쇼케이스 컴포넌트는
마케팅용 가짜 데모 데이터(회사명, 도시, 연봉 범위, 매치율 등)를 하드코딩한다.

**Why:** CLAUDE.md의 "하드코딩된 이메일/ID 금지" 규칙은 실제 유저 신원(이메일·UUID·user_id)이
`getAuthUserEmail()`/`getOrCreateProfile()` 우회로 코드에 박히는 것을 막기 위함이다.
랜딩 데모의 회사명·도시명(예: Atlassian, Canva, Xero, 시드니, 멜번)은 실존 유저 데이터가 아니라
정적 마케팅 콘텐츠이므로 이 규칙의 대상이 아니다.

**How to apply:** `src/components/matchda/landing/` 하위 컴포넌트에서 회사/도시/이름 등 데모 값이
바뀌어도 CRITICAL 위반으로 플래그하지 말 것. 단, 실제 이메일 주소나 UUID 형태 문자열이 등장하면
여전히 위반으로 처리한다. 2026-07-13 검증에서 시드니/멜번/브리즈번/오클랜드 + Atlassian/Canva/Xero/
Culture Amp/SafetyCulture 로 교체된 건은 PASS 처리됨.
