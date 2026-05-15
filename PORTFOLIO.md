# JobRadar — AI 채용 매칭 & 커버레터 자동화

> **한 줄 요약**: 채용공고 URL만 붙여넣으면 AI가 내 이력서와 매칭해서 점수를 매기고, 맞춤 커버레터까지 자동으로 써주는 개인용 취업 도우미 웹앱

- **GitHub**: https://github.com/hyunseokyu1-netizen/jobradar
- **개발 기간**: 2026년 4월 ~ 현재
- **개발 형태**: 1인 풀스택 (Claude Code와 페어 프로그래밍)

---

## 왜 만들었나

호주에서 취업 준비를 하면서 매번 반복되는 작업이 너무 비효율적이었다.

1. Seek, Indeed, Glassdoor 등 여러 사이트를 돌아다니며 공고 확인
2. "이 공고가 나한테 맞나?" 직접 읽고 판단
3. 공고마다 커버레터를 처음부터 새로 작성
4. 지원 상태(지원함 / 면접 / 결과) 엑셀로 관리

이 모든 걸 자동화하고 싶었다.

---

## 주요 기능

### 1. 채용공고 URL 한 줄로 추가

Seek, Indeed, LinkedIn, Glassdoor 등 채용공고 URL을 붙여넣으면 자동으로 등록된다.  
JD(Job Description)를 자동 스크래핑하지 못하는 경우 직접 텍스트를 붙여넣을 수 있다.

![채용 공고 목록](docs/screenshots/01_job_list.png)

- 출처 플랫폼별 배지 (Seek / Indeed / Glassdoor 등)
- AI 매칭 점수 표시 (0~100점)
- 지원 상태 관리: 미분류 → 관심있음 → 고민중 → 지원완료 → 면접 → 합격 / 불합격
- 드래그로 공고 순서 재정렬

---

### 2. 내 프로파일 설정

AI 매칭과 커버레터 생성의 기준이 되는 내 정보를 저장한다.

![프로파일 페이지](docs/screenshots/02_profile.png)

- 이름, 스킬, 희망 포지션, 희망 지역
- 희망 연봉 (통화 선택: AUD / USD / EUR / KRW / JPY / NZD / GBP / SGD)
- 경력 요약 (AI 자동 입력 지원)
- 이력서 업로드 (PDF / DOCX → 텍스트 자동 추출)

---

### 3. JD 직접 입력 & AI 매칭

스크래핑이 안 되는 공고(Glassdoor 등)는 JD 텍스트를 직접 붙여넣어 저장한다.  
저장하면 즉시 AI 매칭이 실행된다.

![JD 직접 입력](docs/screenshots/03_jd_input.png)

**AI 매칭 로직**:
- 내 스킬 스택 vs JD 요구 기술 일치도
- 경력 수준 적합도
- 희망 포지션과의 연관성
- 희망 연봉 범위 적합도
- 0~100점으로 점수화 + 매칭 이유 한국어 요약

---

### 4. AI 커버레터 자동 생성

공고별로 이력서 + JD를 분석해 맞춤 커버레터를 생성한다.

![커버레터 생성](docs/screenshots/04_cover_letter.png)

- **AI 생성**: 내 이력서 + JD 기반 300단어 영문 커버레터
- **AI 재검토**: 어색한 표현·어법 오류 자동 다듬기
- **한국어 번역 탭**: 영문 / 한국어 탭 전환으로 내용 비교
- **다운로드**: TXT / DOCX / PDF 포맷 지원
- **클립보드 복사**

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| 프레임워크 | Next.js 14 App Router + TypeScript |
| 스타일링 | Tailwind CSS |
| 데이터베이스 | Supabase (PostgreSQL + RLS) |
| 인증 | Supabase Auth (Google OAuth) |
| AI | Claude API (Anthropic) — Haiku 모델 |
| 스크래핑 | Playwright |
| 배포 | Vercel |
| 드래그 앤 드롭 | @dnd-kit |
| 문서 생성 | docx, jsPDF |

---

## 아키텍처

```
사용자
  │
  ▼
Next.js (Vercel)
  ├── App Router Pages
  │     ├── / (채용공고 목록)
  │     └── /profile (프로파일)
  │
  ├── Server Actions
  │     ├── 채용공고 CRUD
  │     ├── AI 매칭 (Claude API)
  │     ├── 커버레터 생성·검토·번역 (Claude API)
  │     └── 지원 상태·메모 관리
  │
  └── Supabase (PostgreSQL)
        ├── profiles — 유저별 이력서·선호 설정
        ├── jobs — 채용공고 공유 풀
        ├── matches — 유저별 매칭 결과·상태·메모
        └── cover_letters — 유저별 커버레터
```

**데이터 격리 방식**: `supabaseAdmin`(service role)으로 쿼리하되, 모든 유저 관련 조회에서 코드 레벨로 `user_id` 필터를 명시 적용. Supabase RLS는 보조 안전장치로 유지.

---

## 개발 포인트

### Supabase service role + 멀티유저 데이터 격리
- `matches!inner` + `.eq('matches.user_id', ...)` PostgREST 필터가 service role에서 무시되는 버그 발견
- 해결: matches 먼저 조회 → job_id 목록 추출 → jobs 조회하는 2단계 쿼리로 변경

### 커버레터 데이터 분리 버그
- `user_id` 없이 `job_id`만으로 upsert → 마지막 저장 유저 것이 덮어써지는 버그
- `UNIQUE (user_id, job_id)` constraint 추가 후 전체 수정

### 공유 컬럼 설계 오류
- `jobs.memo`가 전체 유저 공유 컬럼이었던 문제
- `matches.memo`로 이동해 유저별 메모로 전환

---

## 로컬 실행

```bash
git clone https://github.com/hyunseokyu1-netizen/jobradar.git
cd jobradar
npm install

# .env.local 설정 (Supabase, Anthropic API Key 필요)
cp .env.example .env.local

npm run dev
```
