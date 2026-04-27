# JobRadar — AI 기반 잡 매칭 & 커버레터 자동화 툴
> "내 취업을 위해 직접 만든 AI 툴" — 포트폴리오 + 실사용 + SaaS 씨앗

---

## ⚠️ 방향 전환 (2026-04-23)

**기존**: Vercel Cron으로 Indeed/Seek 자동 스크래핑  
**변경**: 사용자가 URL을 직접 붙여넣으면 JD 스크래핑 + AI 분석

### 변경 이유
- Seek/Indeed 봇 차단으로 실제 공고 수집 불안정
- Playwright on Vercel Lambda: 비용·타임아웃·ETXTBSY 등 제약 과다
- 단건 on-demand 스크래핑이 현실적으로 더 신뢰성 높음

---

## 핵심 플로우 (변경 후)

```
이메일/링크로 받은 잡 공고 URL
        ↓
URL 붙여넣기 (대시보드 입력창)
        ↓
플랫폼 자동 감지 + JD 스크래핑 (fetch + cheerio)
        ↓
① 매칭 분석   — 내 이력서 vs JD (Claude API)
② 커버레터    — 회사 맞춤형 자동 생성 (Claude API)
        ↓
지원 내역 트래킹 (상태, 메모, 지원일)
```

---

## 프로젝트 개요

| 항목 | 내용 |
|------|------|
| 목적 | URL 붙여넣기 → AI 매칭 + 커버레터 자동화 |
| 지원 플랫폼 | Seek, Indeed, LinkedIn, 기타 (범용 fallback) |
| 출력 형태 | 웹 대시보드 (Next.js) |
| AI 엔진 | Claude API (Anthropic) |
| 배포 | Vercel |
| 예상 기간 | 3주 (MVP 재설계 기준) |

---

## 핵심 기능 (MVP)

### 1. URL 입력 & JD 스크래핑
- 대시보드에 URL 입력창
- 플랫폼 자동 감지 (seek / indeed / linkedin / 기타)
- fetch + cheerio로 JD 텍스트 추출
- Supabase jobs 테이블에 저장

### 2. AI 매칭 분석
- 내 이력서(resume_text) + 프로파일 vs JD
- Claude API → 매칭 점수(0~100) + 근거 텍스트
- matches 테이블에 저장

### 3. 커버레터 자동 생성
- JD + 내 프로파일 + career_summary 조합
- Claude API → 영문 커버레터 생성
- 편집 + 복사 + 다운로드

### 4. 지원 내역 트래킹
- 상태 관리: new → bookmarked → applied → result
- 메모 추가
- 지원일 기록

---

## 기술 스택

| 역할 | 기술 | 비고 |
|------|------|------|
| 프론트엔드 | Next.js 14 + TypeScript | |
| 스타일 | Tailwind CSS | |
| 스크래핑 | fetch + cheerio | Playwright 제거 |
| AI | Claude API (Haiku/Sonnet) | 매칭 + 커버레터 |
| DB | Supabase (PostgreSQL) | |
| 파일 파싱 | pdf-parse + mammoth | 이력서 업로드 |
| 배포 | Vercel | Cron 제거 |

---

## 개발 로드맵 (재설계)

### Phase 1 — URL 입력 + JD 스크래핑 ✅ 완료
```
[x] URL 입력 UI (대시보드 상단)
[x] 플랫폼 감지 유틸 (seek / indeed / linkedin / glassdoor / 기타)
[x] 플랫폼별 뱃지 색상
[x] URL 추가 시 jobs 테이블 저장
[x] cheerio 기반 JD 스크래퍼
    [x] Seek 파서 (__NEXT_DATA__ JSON + cheerio fallback)
    [x] Indeed 파서 (JSON-LD + cheerio fallback)
    [x] Glassdoor 파서 (URL 슬러그 KO/KE 인덱스 파싱)
    [x] 범용 fallback 파서 (JSON-LD → Open Graph → meta 태그)
[x] /api/scrape-url route (단건 on-demand)
[x] URL 추가 즉시 스크래핑 자동 실행
[x] URL 추가 즉시 AI 매칭 자동 실행
```

### Phase 2 — AI 분석 파이프라인 ✅ 완료
```
[x] URL 추가 즉시 매칭 분석 자동 실행
[x] 매칭 결과 대시보드 표시
[x] 매칭 점수 클릭 재매칭
[x] 커버레터 생성 (JD + 이력서 기반 Claude Haiku)
[x] 커버레터 편집 UI (모달)
[x] 클립보드 복사
[x] 이력서 PDF/DOCX 업로드 + 텍스트 파싱
[x] 경력 요약 AI 자동 입력
[ ] TXT 다운로드
```

### Phase 3 — 트래킹 + 마무리
```
[x] 지원 상태 변경 UI (new/bookmarked/applied/pass)
[x] 매칭 점수 순 정렬
[x] 잡 목록 삭제 기능
[x] 드래그 순서 변경 (@dnd-kit)
[ ] 잡 상세 페이지 (/jobs/[id])
[ ] 메모 기능
[ ] 모바일 반응형
```

---

## Supabase 스키마 (현재)

```sql
-- jobs: source 컬럼이 플랫폼 구분 (seek/indeed/linkedin/other)
-- matches: score, reason, highlights, status
-- profiles: skills, desired_positions, career_summary, resume_text
-- cover_letters: job_id, content
```

---

## 🚫 제외된 기능 — 스크래퍼 자동화
> Playwright 봇 차단·Lambda 제약으로 방향 전환. 코드는 보존하되 더 이상 개발하지 않음.

- ~~Playwright 기반 Indeed/Seek 자동 스크래핑~~
- ~~Vercel Cron 스케줄 스크래핑~~
- ~~@sparticuz/chromium Lambda 실행~~

## 보류된 기능 (SaaS 전환 시)
- 이메일 다이제스트 (Resend)
- 회원가입 / 로그인 (Supabase Auth)
- Stripe 결제

---

## 블로그 연재

| 편 | 제목 | 상태 |
|----|------|------|
| 1편 | 기획 + 스크래퍼 자동화 시도 | ✅ 작성 완료 |
| 2편 | Vercel Lambda에서 Playwright 실행하기 | ✅ 작성 완료 |
| 3편 | 방향 전환 + AI 매칭 & 커버레터 파이프라인 완성 | ✅ 초안 작성 완료 (배포 예정 4/27) |
| 4편 | 완성 + 회고 | 예정 |

---

*Made by 현석 — "내 취업을 위해 직접 만든 AI 툴"*  
*Last updated: 2026-04-27*
