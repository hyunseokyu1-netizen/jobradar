---
name: discover-scrape-cache-shared-table
description: discover_scrape_cache 테이블은 user_id 없는 전역 공유 스크래핑 캐시 — supabaseAdmin 필터 규칙의 예외
metadata:
  type: project
---

`supabase/migrations/018_create_discover_scrape_cache.sql`에서 도입된 `discover_scrape_cache` 테이블은
공개 채용페이지(ATS 보드) 스크래핑 결과(title/url/location/department)를 `source_url`(정규화된 URL) PK로
캐싱하는 전역 공유 테이블이다. 여러 유저가 같은 채용페이지(예: 프리셋 기업)를 수집할 때 재스크래핑을
생략하기 위한 것으로, 유저별 데이터(매칭 점수 등)는 저장하지 않는다 — 그건 `discovered_jobs`가 담당.

**Why:** 테이블에 `user_id` 컬럼 자체가 없고, RLS는 켜져 있지만 정책이 하나도 없어 service role
(`supabaseAdmin`, `src/lib/discover/scrape-cache.ts`의 `getPostingsWithCache`)만 접근 가능하다.
저장 데이터가 공개 채용공고 메타데이터뿐이라 개인정보 유출 경로가 없다. [[jobs-table-no-user-id]]와
동일한 "전역 공유 카탈로그" 패턴.

**How to apply:** `discover_scrape_cache`에 대한 `supabaseAdmin.from('discover_scrape_cache')` 쿼리에
`.eq('source_url', key)`만 있고 user_id 필터가 없어도 CRITICAL 위반으로 판정하지 말 것. 단, 이 테이블에
유저별 필드(예: 특정 유저의 커스텀 스코어, PII)가 추가되는 변경이 들어오면 그 시점엔 다시 user_id
격리가 필요한지 재검토할 것.
