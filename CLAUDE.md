# JobRadar — CLAUDE.md

## 프로젝트
AI 기반 잡 매칭 & 커버레터 자동화. 호주/NZ IT 채용공고 자동 수집 → Claude API 매칭 → 맞춤 커버레터 생성 → 이메일 다이제스트.

## 기술 스택
- **프레임워크**: Next.js 14 App Router + TypeScript
- **스타일**: Tailwind CSS
- **DB**: Supabase (PostgreSQL)
- **AI**: Claude API (Anthropic SDK)
- **스크래핑**: Playwright
- **이메일**: Resend
- **배포**: Vercel + Vercel Cron

## 폴더 구조
```
src/
├── app/          — 페이지 및 API 라우트 (App Router)
├── components/   — UI 컴포넌트 (jobs/, cover/, ui/ 도메인별)
├── lib/          — 외부 서비스 클라이언트 (supabase, claude, email, scrapers)
└── types/        — 공통 TypeScript 타입 정의
```

## 코딩 규칙
- TypeScript strict mode 사용
- 컴포넌트: PascalCase / 함수·변수: camelCase
- API Route는 `src/app/api/` 하위에만 작성
- Supabase 클라이언트는 `src/lib/supabase.ts` 에서만 import
- Claude API는 `src/lib/claude.ts` 에서만 import
- 환경변수는 `.env.local` 사용, 절대 커밋 금지
- 서버 컴포넌트 기본, 클라이언트 상태 필요 시에만 `'use client'`

## 커밋 규칙
한국어 conventional commit: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`
