# Supabase — 스키마 & 백업 가이드

## 파일 구조

| 파일 | 용도 |
|------|------|
| `schema.sql` | **전체 프로덕션 스키마 (Single Source of Truth)**. 빈 프로젝트에 이 파일 하나만 실행하면 전체 DB가 생성된다. 스키마가 바뀌면 이 파일을 최신 상태로 갱신한다. |
| `migrations/` | 과거 변경 이력(적용 순서 기록). 새 DB를 만들 때는 재적용할 필요 없음 — 역사 보존용. |

> `002_seed_*`, `006_migrate_*` 같은 데이터 시드/이전 스크립트는 **스키마가 아니라 일회성 데이터 작업**이므로 `schema.sql`에 포함하지 않는다. 실제 계정/데이터 복구는 아래 데이터 백업에서 처리한다.

## 새 프로젝트에 DB 생성하기

```bash
# 방법 A) psql
psql "$DATABASE_URL" -f supabase/schema.sql

# 방법 B) Supabase 대시보드 → SQL Editor 에 schema.sql 내용을 붙여넣고 Run
```

`schema.sql`은 멱등(idempotent)하게 작성되어 있어(`CREATE TABLE IF NOT EXISTS`, `DROP POLICY IF EXISTS` 등) 부분 적용된 DB에 다시 실행해도 안전하다.

## 백업 계획

### 1. 스키마 백업 (코드로 관리)
- `schema.sql`이 곧 스키마 백업이다. 커밋 = 백업.
- 스키마를 변경하면: ① 대시보드/psql로 프로덕션에 적용 → ② `schema.sql`을 동일하게 갱신 → ③ 커밋. (드리프트 방지)
- 검증: 아래로 실제 DB와 `schema.sql`이 일치하는지 주기적으로 대조한다.
  ```bash
  # Supabase CLI (권장): 실제 DB의 스키마를 덤프해 비교
  supabase db dump --schema public > /tmp/live_schema.sql
  # diff 로 schema.sql 과 대조 (형식 차이는 있을 수 있음)
  ```

### 2. 데이터 백업 (정기)
Supabase 플랜 기본 자동 백업 외에, 직접 덤프를 보관하는 것을 권장한다.

```bash
# 전체(스키마+데이터) 논리 백업 — 복구가 가장 확실
pg_dump "$DATABASE_URL" --no-owner --no-privileges -Fc -f backup_$(date +%Y%m%d).dump

# 데이터만 (public 스키마)
pg_dump "$DATABASE_URL" --data-only --schema=public -f data_$(date +%Y%m%d).sql
```

- **주기**: 최소 주 1회, 배포 전에는 수동으로 1회.
- **보관**: 로컬 + 외부 저장소(예: 클라우드 스토리지) 2곳. 최근 4주치 롤링 보관.
- **주의**: `DATABASE_URL`(DB 접속 문자열)과 `SUPABASE_SERVICE_ROLE_KEY`는 절대 커밋하지 않는다. 덤프 파일에는 유저 개인정보가 들어가므로 리포에 커밋 금지(`.gitignore`로 차단).

### 3. Supabase 관리형 백업
- **PITR(Point-in-Time Recovery)**: 유료 플랜에서 지원. 프로젝트 설정 → Database → Backups 에서 활성화. 특정 시점으로 복구 가능하므로 프로덕션에서는 켜두는 것을 강력 권장.
- 대시보드의 daily 백업은 플랜별 보관 기간이 제한적이므로, 위 2번 수동 덤프와 병행한다.

### 4. auth.users / Storage
- `auth.users`(로그인 계정)는 Supabase Auth가 관리한다. `pg_dump`의 전체 덤프에는 포함되나, 복구 시 `auth` 스키마째 복원해야 로그인 정보가 유지된다.
- `resumes` Storage 버킷의 파일은 DB 덤프에 포함되지 않는다. 필요하면 Storage API/CLI로 별도 백업한다.

## 복구 절차 (요약)

1. 새 Supabase 프로젝트 생성.
2. `schema.sql` 실행으로 구조 생성.
3. 데이터 덤프 복원:
   ```bash
   pg_restore --no-owner --no-privileges -d "$DATABASE_URL" backup_YYYYMMDD.dump
   ```
4. `.env.local`의 `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY`를 새 프로젝트 값으로 교체.
5. Storage `resumes` 버킷 파일 복원(있는 경우).

## 앞으로 스키마 변경 방식

1. 변경용 SQL을 `migrations/NNN_설명.sql`로 추가하고 프로덕션에 적용.
2. **동시에** `schema.sql`을 최종 상태로 갱신(신규 컬럼/테이블/정책 반영).
3. 두 파일을 함께 커밋. → migrations는 "어떻게 바뀌었나", schema.sql은 "지금 상태가 무엇인가"를 각각 보증한다.
