---
name: cron-scrape-sources-background-job
description: /api/cron/scrape-sources 백그라운드 자동 수집 크론 — scrapeSourceCore 공용 로직, 소유권/잠금/스케줄 패턴
metadata:
  type: project
---

2026-07-17 커밋에서 도입. `job_sources`(유저가 등록한 채용페이지)를 Vercel Cron이 매일 자동 수집하는
구조. 핵심 파일:
- `src/lib/discover/scrape-source.ts` — `scrapeSourceCore(source, profile, opts)`: 기존
  `scrapeSourceAction`(수동 수집)의 본문을 추출한 공용 로직. **인증/소유권 확인은 호출부 책임**이라고
  파일 상단에 명시 — 호출부(서버 액션 또는 크론)가 이미 확인한 `source.user_id`를 신뢰하고 모든
  `discovered_jobs`/`job_sources` 쓰기에 `.eq('user_id', source.user_id)`를 일관되게 사용한다.
- `src/app/api/cron/scrape-sources/route.ts` — Bearer `CRON_SECRET` 검증이 함수 최상단(모든 DB 쿼리
  이전)에 위치. 소스 소유자 프로필을 `source.user_id`로 로드해 채점 — 호출자 세션과 무관하므로 유저 간
  데이터 누출 경로 없음. 조건부 `update().eq('id', x).or('scrape_lock_at.is.null,...lt....')` 패턴으로
  잠금 획득 — PostgREST의 단일 UPDATE는 원자적이라 동시 실행 경합에도 안전(compare-and-swap 확인됨).
- `supabase/migrations/024_add_auto_scrape_to_job_sources.sql` — `next_scrape_at`,
  `consecutive_failures`, `auto_scrape_paused`, `scrape_lock_at` 컬럼 추가.

**Why:** 이 구조를 다시 검증할 때는 소유권 필터·잠금 원자성·크론 인증 위치를 매번 처음부터 재분석할
필요 없이 이미 검증된 패턴으로 인정하고, 이후 변경분(diff)에만 집중할 것.

**How to apply:** 이 파일들에 대한 후속 변경(예: MAX_SOURCES_PER_RUN 조정, 백오프 정책 변경)을 검토할
때 소유권 필터·잠금 로직 자체는 매번 재검증하지 말고, 변경된 부분만 확인. 단, `scrapeSourceCore`를
호출하는 새로운 진입점이 추가되면 그 호출부가 인증/소유권을 실제로 확인하는지는 반드시 확인
(이 함수 자체는 신뢰 경계를 강제하지 않음).

**배포 순서 주의:** `scrapeSourceAction`의 select와 `discover/page.tsx`의 select가 마이그레이션 024의
신규 컬럼(`consecutive_failures`, `auto_scrape_paused`)을 참조한다. 마이그레이션이 프로덕션 DB에
적용되기 전에 이 커밋이 배포되면 소스 목록 조회와 수동 "소스 수집" 버튼이 깨진다(컬럼 없음 오류 →
`source`가 null → "소스를 찾을 수 없습니다"). 이후 유사한 "스키마 변경 동반 배포" 검토 시 마이그레이션
적용 시점을 배포 전/직후로 확인할 것.
