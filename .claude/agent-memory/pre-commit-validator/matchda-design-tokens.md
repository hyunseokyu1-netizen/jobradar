---
name: matchda-design-tokens
description: zinc-* Tailwind 유틸리티 → 브랜드 hex 컬러(#046C4E 등) 치환이 화면별로 순차 진행 중
metadata:
  type: project
---

MatchDa 리브랜딩의 일환으로 `text-zinc-400`, `bg-zinc-900`, `border-zinc-200` 같은 Tailwind 기본 팔레트를
브랜드 hex 토큰(`#046C4E` 프라이머리, `#98A2B3`/`#667085`/`#344054`/`#101828` 등 뉴트럴 스케일,
`#ECEEF0`/`#F0F2F4`/`#F4F6F8`/`#F7F8FA` 배경/보더)으로 치환하는 작업이 화면 단위로 순차 진행 중이다.
2026-07 시점에 로그인/온보딩/프로필/대시보드/각종 모달(JdInputModal, CoverLetterModal,
TailoredResumeModal, AddJobManualModal, JobInfoModal, MemoModal 등)이 이미 치환됨.
`AppChrome.tsx`의 비-MatchDa 셸(레거시 헤더, 39-63행)은 아직 zinc-* 그대로 남아있음 — 아직 미전환 영역이니
"디자인 불일치" 오탐으로 잡지 말 것(레거시 경로라 의도적으로 나중에 처리 예정).

**Why:** 사용자가 태스크 #1(디자인 미적용 화면 점검 및 통일)로 진행 중인 리브랜딩 작업의 일부.

**How to apply:** 새 컴포넌트/화면에 `zinc-*`가 새로 추가되면 브랜드 토큰 대신 쓴 것인지 확인해서 🟡 경고로
플래그하되, 아직 전환 안 된 기존 레거시 파일(AppChrome의 비-MatchDa 헤더 등)은 이번 치환 대상이 아니므로
과도하게 지적하지 말 것.
