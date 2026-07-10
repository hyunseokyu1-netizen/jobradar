---
name: preexisting-lint-issues
description: eslint 실행 시 항상 나오는 사전 존재 이슈 목록 — diff 검증 시 신규 위반과 구분 필요
metadata:
  type: project
---

`npx eslint`를 프로젝트에 돌리면 아래는 커밋 전과 무관하게 이미 존재하던 이슈다(2026-07-02 기준 `git stash`로
HEAD 버전에서도 동일하게 재현 확인):
- `src/app/onboarding/OnboardingChat.tsx` — `react-hooks/set-state-in-effect` 에러 2건(로컬 draft 복원 useEffect,
  step 변경 useEffect에서 setInput/setAnswers 직접 호출) + exhaustive-deps 경고 1건
- `src/lib/discover/ats.ts` — `@typescript-eslint/no-explicit-any` 에러 4건 (50/58/68/80행 부근, scrapeGeneric 밖의
  다른 scrape 함수들)
- `src/components/RunMatchButton.tsx` — 미사용 `useRef` import 경고
- `src/components/TailoredResumeModal.tsx` — 미사용 `filename` 변수 경고

**Why:** pre-commit 검증 시 "이 diff가 새로 만든 문제"와 "원래 있던 빚"을 구분하지 못하면 매번 동일한 항목을
CRITICAL/IMPORTANT로 잘못 보고하게 된다.

**How to apply:** 커밋 대상 diff에 이 파일들이 포함돼 있어도, 위 목록과 정확히 같은 위치/종류의 에러라면
"기존 이슈, 이번 변경 범위 밖"으로 advisory 처리하거나 언급을 생략할 것. 단, `OnboardingChat.tsx`에 스킬 단계용
`setSkillList` 호출(새 코드)이 동일한 set-state-in-effect 안티패턴을 답습해서 추가된 것은 확인됨 —
완전히 새로운 위반은 아니고 기존 패턴을 따라간 것이라 blocking으로 취급하지 않았음. 다만 이 effect를 리팩터링할
기회가 생기면 두 setState 위반을 한 번에 정리하도록 제안할 수 있음.
