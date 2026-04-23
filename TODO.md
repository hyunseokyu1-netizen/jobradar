# JobRadar — TODO

> 상태: `[ ]` 미완료 · `[x]` 완료 · `[-]` 진행중 · `[~]` 보류

---

## ⚠️ 방향 전환 (2026-04-23)
자동 스크래핑 → **URL 붙여넣기 방식**으로 변경.  
Week 1~2 완료 항목은 그대로 유지. 이후 계획은 재설계.

---

## ✅ Week 1 — 프로젝트 세팅 + 스크래퍼 (완료)

### 프로젝트 초기 세팅
- [x] Next.js 프로젝트 생성 (TypeScript + Tailwind + ESLint + App Router)
- [x] GitHub 레포 생성 및 연결
- [x] `.gitignore` 설정 (`.env.local` 포함)
- [x] `.env.example` 파일 작성
- [x] `PLAN.md` 루트에 추가
- [x] `CLAUDE.md` 작성 (프로젝트 컨텍스트, 규칙)
- [x] Vercel 프로젝트 연결

### Supabase 세팅
- [x] Supabase 프로젝트 생성
- [x] `jobs` 테이블 스키마 생성
- [x] `matches` 테이블 스키마 생성
- [x] `profiles` 테이블 스키마 생성 (멀티유저 SaaS 구조 + RLS)
- [x] `cover_letters` 테이블 스키마 생성
- [x] Supabase 클라이언트 연결 (`/src/lib/supabase.ts`)
- [x] Supabase Admin 클라이언트 연결 (`/src/lib/supabase-admin.ts`, service role)
- [x] 환경변수 설정 (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`)

### ~~스크래퍼 (자동화 방식)~~ — 🚫 제외 (방향 전환)
> Playwright 봇 차단·Lambda 제약으로 방향 전환. 코드는 유지하되 더 이상 개발하지 않음.
- [x] ~~Indeed 스크래퍼 구현~~ (봇 차단으로 실용성 한계)
- [x] ~~Seek 스크래퍼 구현~~ (38개 공고 수집 확인)
- [x] ~~Vercel Cron 설정~~ (매일 22:00 UTC)
- [x] ~~Vercel 리전 시드니(syd1)로 변경~~
- [~] ~~자동 스크래핑 안정화~~

---

## ✅ Week 2 — AI 매칭 엔진 (완료)

### 내 프로파일
- [x] 프로파일 입력 UI 페이지 (`/profile`)
- [x] 스킬 목록 입력/저장
- [x] 경력 요약 입력/저장
- [x] 선호 조건 입력/저장 (연봉, 위치, 소스)
- [x] Supabase `profiles` 테이블 저장 (Server Action)
- [x] 이력서 PDF/DOCX 업로드 + 텍스트 파싱

### Claude API 연동
- [x] Anthropic SDK 설치 (`@anthropic-ai/sdk`)
- [x] Claude 클라이언트 설정 (`/src/lib/claude.ts`)
- [x] 환경변수 설정 (`ANTHROPIC_API_KEY`)

### 매칭 엔진
- [x] JD 분석 프롬프트 작성
- [x] 매칭 점수 계산 로직 (0~100)
- [x] 매칭 근거 텍스트 생성
- [x] 매칭 API (`/api/match/route.ts`)
- [x] Supabase `matches` 테이블 저장
- [ ] 전체 플로우 테스트 (API 크레딧 충전 후)

---

## 🔄 Phase 1 — URL 입력 + JD 스크래핑 (재설계) ← 현재

- [x] URL 입력 UI (대시보드 상단 입력창)
- [x] 플랫폼 자동 감지 유틸 (seek / indeed / linkedin / 기타)
- [x] 플랫폼별 뱃지 색상 (Seek 파랑 / Indeed 주황 / LinkedIn 하늘 / Other 회색)
- [x] URL 추가 시 jobs 테이블 저장
- [ ] cheerio 기반 JD 스크래퍼
  - [ ] Seek 파서
  - [ ] Indeed 파서
  - [ ] 범용 fallback 파서 (Open Graph + meta 태그)
- [ ] `/api/scrape-url` API Route (단건 on-demand)
- [ ] URL 추가 즉시 AI 매칭 자동 실행

---

## 📝 Phase 2 — 커버레터 생성

- [ ] 커버레터 생성 프롬프트 작성
- [ ] JD + 프로파일 + resume_text 조합 로직
- [ ] 커버레터 생성 API (`/api/cover/route.ts`)
- [ ] Supabase `cover_letters` 테이블 저장
- [ ] 텍스트 에디터 컴포넌트
- [ ] 클립보드 복사 기능
- [ ] TXT 다운로드 기능

---

## 📊 Phase 3 — 트래킹 + 대시보드 완성

- [ ] 지원 상태 변경 UI (new / bookmarked / applied / pass)
- [ ] Supabase `matches.status` 업데이트
- [ ] 잡 상세 페이지 (`/jobs/[id]`) — JD + 매칭 + 커버레터
- [ ] 매칭 점수 순 정렬
- [ ] 메모 입력 기능
- [ ] 모바일 반응형 점검

---

## 💰 SaaS 전환 (MVP 이후 — 보류)

### 인증 & 보안
- [ ] 회원가입 / 로그인 (Supabase Auth)
- [ ] `/profile` 로그인 유저만 접근 가능하도록 보호
- [ ] `supabaseAdmin` → 인증된 유저 세션 기반 클라이언트로 교체
- [ ] 이메일 하드코딩 제거 → `auth.uid()` 기반 프로파일 조회
- [ ] RLS 정책 실제 적용 검증

### 결제 & 플랜
- [ ] Stripe 결제 연동
- [ ] 플랜 설계 (Free / Pro $9/월)

### 이메일 다이제스트 (보류)
- [ ] Resend 계정 + API 키 설정
- [ ] 이메일 템플릿 (상위 5개 잡 요약)
- [ ] 매일 오전 8시 Cron 연결

---

## 📝 블로그 연재

- [x] 1편: 기획 + 스크래퍼 자동화 시도
- [x] 2편: Vercel Lambda에서 Playwright 실행하기
- [ ] 3편: 방향 전환 — URL 붙여넣기 방식으로 바꾼 이유
- [ ] 4편: Claude API로 JD 분석 + 커버레터 생성
- [ ] 5편: 완성 + 회고

---

*Last updated: 2026-04-23*
