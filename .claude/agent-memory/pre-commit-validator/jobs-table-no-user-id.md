---
name: jobs-table-no-user-id
description: jobs 테이블은 유저별 필드가 없는 전역 공유 카탈로그 — supabaseAdmin 필터 규칙의 예외
metadata:
  type: project
---

`jobs` 테이블은 유저별 데이터가 아니라 스크래핑된 채용공고 원본을 담는 전역 공유 카탈로그다.
`supabase/migrations/003_fix_user_data_isolation.sql`에서 `jobs.memo`(유저별 필드)를 `matches.memo`로
이전하고 `jobs`에서 컬럼을 제거했다 — 즉 유저별 데이터는 이미 `matches`/`cover_letters`/`tailored_resumes`/
`notes` 등 `user_id` 컬럼이 있는 연결 테이블로 분리되어 있고, `jobs` 자체는 의도적으로 user_id가 없다.

**Why:** `src/app/api/scrape-url/route.ts`, `src/lib/discover/ats.ts` 등에서 `supabaseAdmin.from('jobs').select(...).eq('id', jobId)`처럼
user_id 필터 없이 조회/갱신하는 코드는 CLAUDE.md의 "supabaseAdmin은 반드시 user_id 필터 필요" 규칙을 어긴 것처럼 보이지만
실제로는 아키텍처상 의도된 설계다. `git log`로 확인한 결과 이 패턴은 여러 커밋 전부터 존재했다.

**How to apply:** `jobs` 테이블에 대한 supabaseAdmin 쿼리는 `.eq('id', jobId)`만 있어도 CRITICAL 위반으로 판정하지 말 것.
반대로 `matches`, `cover_letters`, `tailored_resumes`, `notes`, `job_notes` 등 user_id 컬럼이 있는 테이블에서
supabaseAdmin을 쓰면서 `.eq('user_id', profile.id)`가 빠진 경우는 여전히 CRITICAL로 플래그해야 한다.
새 테이블/기능을 검증할 때는 관련 마이그레이션 파일에서 해당 테이블에 user_id 컬럼이 있는지 먼저 확인해서 판단할 것.
