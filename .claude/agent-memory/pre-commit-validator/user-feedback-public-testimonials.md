---
name: user-feedback-public-testimonials
description: user_feedback 테이블 구조와 getPublicTestimonials()의 supabaseAdmin 접근이 user_id 필터 없이도 정당한 이유
metadata:
  type: project
---

`user_feedback` 테이블(migration 020)은 RLS는 켜져 있지만 정책이 없음 — 설계상 service role(`supabaseAdmin`, from `src/lib/supabase-admin.ts`)로만 읽고 쓰도록 되어 있음.

- 쓰기(`src/app/feedback-actions.ts submitFeedback`): 정상 인증 패턴(getAuthUserEmail → getOrCreateProfile → profile.id) 준수, `moderateFeedback()`으로 본문+display_name에 개인정보/욕설 포함 여부를 제출 시점에 검열.
- 자기 후기 조회(`getMyFeedback`): `.eq('user_id', profile.id)` 필터 있음 — 표준 패턴.
- 공개 랜딩용 조회(`src/lib/matchda/data.ts getPublicTestimonials`, 2026-07 추가): `user_id` 필터가 **없는 게 의도된 설계** — `allow_public=true` 필터로 대체(공개 동의 후기만 전체 유저 대상 조회). select 컬럼도 `rating, content, display_name`만 — email이나 user_id는 절대 select하지 않음. 실패 시 빈 배열 반환(랜딩 렌더 안 막음).

**Why:** 이 경로는 "본인 데이터만" 조회하는 게 아니라 "공개 동의한 모든 유저의 비-PII 데이터"를 보여주는 의도적 크로스유저 공개 조회. [[jobs-table-no-user-id]], [[discover-scrape-cache-shared-table]]와 같은 계열의 예외 패턴.

**How to apply:** 앞으로 `user_feedback`에 대한 supabaseAdmin 쿼리를 볼 때, (1) 쓰기/자기조회 경로는 user_id 필터 필수, (2) `allow_public=true` 게이트가 있는 공개 조회 경로는 user_id 필터 없어도 CRITICAL 위반 아님 — 단, email/user_id 컬럼을 select하지 않는지는 반드시 확인할 것.

랜딩 컴포넌트 `TestimonialsSection.tsx`는 실후기가 없을 때 하드코딩 샘플 3개로 폴백하되 반드시 "예시" 배지를 표시함(가짜 후기를 진짜처럼 보이지 않게). 이 배지 로직이 빠지면 FTC/소비자 기만 리스크로 CRITICAL급 이슈.
