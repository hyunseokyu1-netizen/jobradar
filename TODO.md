# JobRadar — TODO

> 상태: `[ ]` 미완료 · `[x]` 완료 · `[-]` 진행중 · `[~]` 보류

---

## ⚙️ Week 1 — 프로젝트 세팅 + 스크래퍼

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
- [ ] `jobs` 테이블 스키마 생성
- [ ] `matches` 테이블 스키마 생성
- [ ] `my_profile` 테이블 스키마 생성
- [ ] `cover_letters` 테이블 스키마 생성
- [x] Supabase 클라이언트 연결 (`/src/lib/supabase.ts`)
- [x] 환경변수 설정 (`SUPABASE_URL`, `SUPABASE_ANON_KEY`)

### Indeed 스크래퍼
- [ ] Playwright 설치 및 기본 설정
- [ ] Indeed 페이지 접근 테스트
- [ ] 키워드/위치 필터 적용 (React Native, Fullstack, Node.js / Sydney, Melbourne, Auckland)
- [ ] 채용공고 데이터 파싱 (제목, 회사, JD, URL, 위치, 연봉, 게시일)
- [ ] 중복 제거 로직 (URL 기반)
- [ ] Supabase `jobs` 테이블에 저장
- [ ] 스크래퍼 API Route 생성 (`/api/scrape/route.ts`)

### Glassdoor 스크래퍼
- [ ] Glassdoor 페이지 접근 테스트
- [ ] 채용공고 데이터 파싱
- [ ] Supabase 저장 연결

### 자동화
- [ ] Vercel Cron 설정 (`vercel.json`)
- [ ] 매일 자동 실행 테스트

---

## 🤖 Week 2 — AI 매칭 엔진

### 내 프로파일
- [ ] 프로파일 입력 UI 페이지 (`/profile`)
- [ ] 스킬 목록 입력/저장
- [ ] 경력 요약 입력/저장
- [ ] 선호 조건 입력/저장 (연봉, 위치, 회사 규모)
- [ ] 이력서 텍스트 업로드 + 파싱 (PDF/DOCX)
- [ ] Supabase `my_profile` 테이블 저장

### Claude API 연동
- [ ] Anthropic SDK 설치 (`@anthropic-ai/sdk`)
- [ ] Claude 클라이언트 설정 (`/src/lib/claude.ts`)
- [ ] 환경변수 설정 (`ANTHROPIC_API_KEY`)

### 매칭 엔진
- [ ] JD 분석 프롬프트 작성
- [ ] 매칭 점수 계산 로직 (0~100)
- [ ] 매칭 근거 텍스트 생성
- [ ] 상위 10개 추출 API (`/api/match/route.ts`)
- [ ] Supabase `matches` 테이블 저장
- [ ] 전체 플로우 테스트

---

## ✍️ Week 3 — 커버레터 생성

### 내 스토리 프리셋
- [ ] 스토리 입력 UI (커리어 스토리, 강점, 지원 동기)
- [ ] 프리셋 저장/불러오기

### 커버레터 생성
- [ ] 커버레터 생성 프롬프트 작성
- [ ] JD + 프로파일 + 스토리 조합 로직
- [ ] 커버레터 생성 API (`/api/cover/route.ts`)
- [ ] Supabase `cover_letters` 테이블 저장

### 편집 UI
- [ ] 텍스트 에디터 컴포넌트
- [ ] 클립보드 복사 기능
- [ ] TXT 다운로드 기능

### 지원 현황 트래킹
- [ ] 상태 변경 UI (new / bookmarked / applied / pass)
- [ ] Supabase `matches` status 업데이트

---

## 🖥️ Week 4 — 대시보드 + 이메일 + 배포

### 메인 대시보드
- [ ] 오늘의 잡 리스트 UI (`/`)
- [ ] 매칭 점수 순 정렬
- [ ] 필터 (국가 / 연봉 / 날짜 / 상태)
- [ ] JobCard 컴포넌트
- [ ] MatchScore 컴포넌트

### 잡 상세 페이지
- [ ] JD 원문 + 매칭 근거 + 커버레터 나란히 보기 (`/jobs/[id]`)
- [ ] 커버레터 생성 버튼
- [ ] 지원 완료 체크 버튼

### 이메일 다이제스트
- [ ] Resend 계정 + API 키 설정
- [ ] 이메일 템플릿 작성 (상위 5개 잡 요약)
- [ ] 이메일 발송 API (`/api/digest/route.ts`)
- [ ] 매일 오전 8시 Cron 연결
- [ ] 테스트 발송 확인

### 배포
- [ ] 환경변수 Vercel에 등록
- [ ] 프로덕션 배포
- [ ] E2E 전체 플로우 테스트
- [ ] README.md 작성

---

## 🐛 Week 5 — 버퍼 (버그 수정 + 마무리)

- [ ] 스크래퍼 봇 차단 이슈 대응
- [ ] 모바일 반응형 UI 점검
- [ ] 에러 핸들링 전체 점검
- [ ] 성능 최적화 (API 응답 속도)
- [ ] 블로그 연재 초안 정리 (1~4편)

---

## 💰 SaaS 전환 (MVP 이후)

- [ ] 회원가입 / 로그인 (Supabase Auth)
- [ ] Stripe 결제 연동
- [ ] 플랜 설계 (Free / Pro $9/월)
- [ ] 사용자별 데이터 분리
- [ ] 랜딩 페이지 제작
- [ ] 베타 오픈 (커뮤니티 공유)
- [ ] 첫 유료 구독자 10명 목표

---

## 📝 블로그 연재

- [ ] 1편: "내 취업을 위해 AI 툴을 직접 만들었다" (기획 배경)
- [ ] 2편: "Indeed를 Playwright로 스크래핑하다 막힌 것들"
- [ ] 3편: "Claude API로 JD 분석하고 매칭 점수 만들기"
- [ ] 4편: "내 PM→개발자 스토리를 커버레터에 녹이는 법"
- [ ] 5편: "Vercel Cron + Resend로 매일 아침 이메일 자동화"
- [ ] 6편: "완성! 실제로 써보니 어땠나"

---

*Last updated: 2026-04-17 (프로젝트 초기 세팅 완료)*
