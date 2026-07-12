---
name: post-login-onboarding-redirect
description: postLoginPath() 서버 액션과 auth/callback 리다이렉트가 onboarding_completed 미완료 유저를 /onboarding으로 보내는 패턴
metadata:
  type: project
---

2026-07-12 커밋에서 로그인/가입 직후 라우팅 로직이 추가됨:
- `src/app/auth-actions.ts`의 `postLoginPath()`: `getAuthUserEmail()` → `getOrCreateProfile(email)` → `profile.onboarding_completed`로 `/discover` vs `/onboarding` 분기. 표준 인증 패턴 준수.
- `src/app/auth/callback/route.ts`: OAuth/이메일 인증 콜백에서 `next` 파라미터 미지정 시에도 동일 패턴으로 온보딩 여부 체크 후 target 재설정.
- `src/app/login/LoginForm.tsx`: 로그인 성공 시 `router.push('/discover')` 하드코딩 대신 `postLoginPath()` 동적 사용으로 교체. 디버그용 `localStorage.setItem('__login_debug__', ...)` 코드도 함께 제거됨.
- `onboarding_completed`는 profile 테이블의 기존 필드 — `src/app/layout.tsx`, `dashboard/page.tsx`, `onboarding/page.tsx`, `profile/actions.ts`에서 이미 광범위하게 사용 중인 정착된 필드.

**Why:** 신규 가입자가 프로필(이력서) 없이 `/discover`로 떨어지면 매칭 점수가 무의미해서 활성화율이 낮았음 (docs/ux-review-2026-07-12.md P0 이슈로 지적).

**How to apply:** 향후 로그인/가입/콜백 관련 라우팅 변경을 리뷰할 때 이 3파일이 항상 같이 움직이는지 확인. `postLoginPath()`를 재사용하지 않고 새로 인라인 분기를 만드는 경우 중복 로직으로 플래그.

관련: 온보딩 흐름에 이력서 업로드 숏컷(`ResumeUploadOption.tsx`)이 추가되어 `analyzeResumeFile`(src/app/profile/actions.ts) 서버 액션을 재사용함 — 해당 액션은 이미 `getAuthUserEmail`→`getOrCreateProfile` 표준 패턴을 따름.
