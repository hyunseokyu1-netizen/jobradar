# JobRadar — AI 기반 잡 매칭 & 커버레터 자동화 툴
> "내 취업을 위해 직접 만든 AI 툴" — 포트폴리오 + 실사용 + SaaS 씨앗

---

## 프로젝트 개요

| 항목 | 내용 |
|------|------|
| 목적 | 호주/뉴질랜드 IT 채용공고 자동 수집 → AI 매칭 → 맞춤 커버레터 생성 |
| 타겟 사이트 | Indeed, Glassdoor |
| 출력 형태 | 웹 대시보드 (Next.js) + 매일 아침 이메일 다이제스트 |
| AI 엔진 | Claude API (Anthropic) |
| 배포 | Vercel (무료 tier) |
| 예상 기간 | 4주 (MVP) |

---

## 핵심 기능 (MVP)

### 1. 잡 스크래핑
- Indeed / Glassdoor에서 키워드 기반 채용공고 수집
- 키워드 예시: `React Native`, `Fullstack`, `TypeScript`, `Node.js`, `Product Manager`
- 수집 항목: 회사명, 직책, JD 전문, 위치, 연봉, 지원 URL, 게시일
- 중복 제거 + Supabase에 저장
- Vercel Cron으로 매일 자동 실행

### 2. AI 매칭 엔진
- 내 프로파일 (스킬, 경력, 선호 조건) 저장
- Claude API로 JD 분석 → 매칭 점수 (0~100) 계산
- 매칭 근거 텍스트 생성 ("이 포지션은 당신의 React Native 경험과 PM 배경이 잘 맞습니다")
- 상위 10개 자동 추출

### 3. 커버레터 생성
- **이력서 업로드 방식**: PDF/DOCX 파싱 → 자동으로 내 경력 추출
- **스토리 프리셋 방식**: 내 스토리를 미리 입력해두고 재사용
  - 예: "40대, 미국 CS 학위, 풀스택 → PM → 개발 복귀, AI 툴 활용 개발자"
- JD + 내 프로파일 조합 → 회사별 맞춤 커버레터 생성
- 생성된 커버레터 편집 + 복사 + 다운로드 가능

### 4. 웹 대시보드
- 오늘의 매칭 잡 리스트 (점수순 정렬)
- JD 원문 + 매칭 근거 + 커버레터 나란히 보기
- "지원 완료" 체크 기능 (지원 현황 트래킹)
- 필터: 국가 / 회사 규모 / 연봉 / 날짜

### 5. 이메일 다이제스트
- 매일 오전 8시 자동 발송 (Resend API)
- 상위 5개 매칭 잡 요약
- 각 잡별 "커버레터 생성하기" 링크 포함

---

## 기술 스택

| 역할 | 기술 | 이유 |
|------|------|------|
| 프론트엔드 | Next.js 14 + TypeScript | 포트폴리오 사이트와 동일 스택 |
| 스타일 | Tailwind CSS | 빠른 UI 개발 |
| 스크래핑 | Playwright | JS 렌더링 페이지 대응 |
| AI | Claude API (claude-sonnet-4-20250514) | 매칭 + 커버레터 생성 |
| DB | Supabase (PostgreSQL) | 무료 tier, 실시간 기능 |
| 이메일 | Resend | 무료 tier 3,000건/월 |
| 배포 | Vercel | Next.js 최적화, 무료 |
| 스케줄러 | Vercel Cron Jobs | 매일 자동 실행 |
| 파일 파싱 | pdf-parse + mammoth | 이력서 파싱 |

**비용: MVP 기간 무료** (모든 서비스 무료 tier 사용 가능)

---

## 개발 로드맵

### Week 1 — 데이터 수집 기반 구축
```
[ ] Next.js 프로젝트 초기 세팅 (TypeScript, Tailwind, ESLint)
[ ] Supabase 연결 + jobs 테이블 스키마 설계
[ ] Playwright 스크래퍼 기본 구현
    [ ] Indeed 스크래퍼
    [ ] Glassdoor 스크래퍼
[ ] 키워드 / 위치 필터 설정
[ ] 중복 제거 로직 (URL 기반)
[ ] Vercel Cron API Route 연결
[ ] 스크래핑 결과 Supabase 저장 확인
```

### Week 2 — AI 매칭 엔진
```
[ ] 내 프로파일 스키마 설계 + 입력 UI
    [ ] 스킬 목록
    [ ] 경력 요약
    [ ] 선호 조건 (연봉, 위치, 회사 규모)
[ ] 이력서 업로드 + 파싱 (PDF/DOCX)
[ ] Claude API 연동
    [ ] JD 분석 프롬프트 작성
    [ ] 매칭 점수 계산 로직
    [ ] 매칭 근거 텍스트 생성
[ ] 상위 N개 추출 API 구현
[ ] 매칭 결과 Supabase 저장
```

### Week 3 — 커버레터 생성
```
[ ] 내 스토리 프리셋 입력 UI
    [ ] 커리어 스토리
    [ ] 강점 / 차별점
    [ ] 지원 동기 템플릿
[ ] 커버레터 생성 프롬프트 작성 (영문)
[ ] JD + 프로파일 + 스토리 조합 로직
[ ] 생성된 커버레터 편집 UI (텍스트 에디터)
[ ] 복사 / TXT 다운로드 기능
[ ] 지원 현황 트래킹 (applied / bookmarked / pass)
```

### Week 4 — UI 완성 + 이메일 + 배포
```
[ ] 메인 대시보드 UI 완성
    [ ] 오늘의 잡 리스트
    [ ] 상세 보기 (JD + 매칭 + 커버레터)
    [ ] 필터 / 정렬
[ ] Resend 이메일 템플릿 제작
[ ] 매일 오전 8시 이메일 발송 Cron 연결
[ ] 환경변수 정리 (.env.local → Vercel)
[ ] Vercel 프로덕션 배포
[ ] README 작성
[ ] 블로그 글 초안 작성
```

---

## Supabase 스키마

```sql
-- 채용공고
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT,              -- 'indeed' | 'glassdoor'
  title TEXT,
  company TEXT,
  location TEXT,
  salary TEXT,
  description TEXT,
  url TEXT UNIQUE,
  posted_at TIMESTAMPTZ,
  scraped_at TIMESTAMPTZ DEFAULT NOW()
);

-- 매칭 결과
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES jobs(id),
  score INTEGER,            -- 0~100
  reason TEXT,
  status TEXT DEFAULT 'new', -- 'new' | 'bookmarked' | 'applied' | 'pass'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 내 프로파일
CREATE TABLE my_profile (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skills TEXT[],
  career_summary TEXT,
  story TEXT,
  resume_text TEXT,
  preferences JSONB,        -- { salary, location, company_size }
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 커버레터
CREATE TABLE cover_letters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES jobs(id),
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Claude API 프롬프트 설계

### 매칭 프롬프트
```
You are a job matching expert.

My Profile:
- Skills: {skills}
- Career Summary: {career_summary}
- Preferences: {preferences}

Job Description:
{jd_text}

Return a JSON object:
{
  "score": 0-100,
  "reason": "2-3 sentences explaining why this is or isn't a good match",
  "highlights": ["matching point 1", "matching point 2"]
}
```

### 커버레터 프롬프트
```
Write a professional cover letter in English for the following job.

My Background:
{career_summary}

My Story:
{story}

Job Title: {title}
Company: {company}
Job Description: {jd_text}

Requirements:
- 3 paragraphs, under 300 words
- Highlight career transition story (PM → Developer) as a strength
- Mention specific skills from JD
- Professional but warm tone
- Do NOT use generic phrases like "I am writing to apply for..."
```

---

## 프로젝트 구조

```
jobradar/
├── app/
│   ├── page.tsx              # 메인 대시보드
│   ├── jobs/[id]/page.tsx    # 잡 상세 + 커버레터
│   ├── profile/page.tsx      # 내 프로파일 설정
│   ├── api/
│   │   ├── scrape/route.ts   # 스크래핑 API (Cron 트리거)
│   │   ├── match/route.ts    # 매칭 실행 API
│   │   ├── cover/route.ts    # 커버레터 생성 API
│   │   └── digest/route.ts   # 이메일 발송 API (Cron 트리거)
├── lib/
│   ├── scrapers/
│   │   ├── indeed.ts
│   │   └── glassdoor.ts
│   ├── claude.ts             # Claude API 클라이언트
│   ├── supabase.ts           # Supabase 클라이언트
│   └── email.ts              # Resend 이메일
├── components/
│   ├── JobCard.tsx
│   ├── CoverLetterEditor.tsx
│   └── MatchScore.tsx
├── vercel.json               # Cron 설정
└── PLAN.md                   # 이 파일
```

---

## 블로그 연재 계획

| 편 | 제목 | 핵심 내용 |
|----|------|-----------|
| 1편 | "40대 개발자가 AI로 취업툴을 만든 이유" | 프로젝트 기획 배경 |
| 2편 | "Indeed를 Playwright로 스크래핑하다 막힌 것들" | 스크래퍼 구현기 |
| 3편 | "Claude API로 JD 분석하고 매칭 점수 만들기" | AI 매칭 구현 |
| 4편 | "내 PM→개발자 스토리를 커버레터에 녹이는 법" | 프롬프트 엔지니어링 |
| 5편 | "Vercel Cron + Resend로 매일 아침 이메일 자동화" | 자동화 구현 |
| 6편 | "완성! 실제로 써보니 어땠나" | 결과 + 회고 |

---

## 향후 수익화 로드맵

```
MVP (나만 씀)
    ↓
베타 (지인 5~10명 무료 테스트)
    ↓
퍼블릭 런칭 - $9/월 구독
  타겟: 커리어 전환자, 이민 준비 개발자
    ↓
기능 확장
  - LinkedIn 추가
  - 면접 준비 AI
  - 비자 요건 필터
```

---

## 시작하기

```bash
# 1. 프로젝트 생성
npx create-next-app@latest jobradar --typescript --tailwind --eslint

# 2. 의존성 설치
npm install @supabase/supabase-js @anthropic-ai/sdk playwright resend pdf-parse mammoth

# 3. 환경변수 설정
cp .env.example .env.local
# ANTHROPIC_API_KEY=
# SUPABASE_URL=
# SUPABASE_ANON_KEY=
# RESEND_API_KEY=
```

---

*Made by 현석 — "내 취업을 위해 직접 만든 AI 툴"*
