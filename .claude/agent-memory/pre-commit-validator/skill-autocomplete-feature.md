---
name: skill-autocomplete-feature
description: SkillChipInput(칩 UI) + src/lib/skills.ts(자동완성 카탈로그) — 온보딩/프로필 스킬 입력 UX
metadata:
  type: project
---

온보딩(`OnboardingChat.tsx`)과 프로필 편집(`ProfileForm.tsx`)의 "스킬" 입력이 자유 텍스트박스에서
`SkillChipInput` 칩 컴포넌트로 바뀌었다. 내부적으로는 여전히 쉼표 구분 문자열(`skills` 필드)을 쓰고,
`ProfileForm`은 hidden input으로 서버 액션 호환성을 유지한다. `src/lib/skills.ts`의
`SKILL_SUGGESTIONS` 배열이 자동완성 후보 카탈로그(자유 입력도 항상 허용).

**Why:** 스킬을 쉼표로 구분해 수동 입력하던 UX가 오타·중복에 취약해서 칩 기반 자동완성으로 개선.

**How to apply:** 이 영역을 리뷰할 때 — blur 시 미완성 입력 텍스트가 칩으로 커밋되는지(폼 제출 시 유실 방지),
onSend 유무에 따라 온보딩(전송 버튼 있음)과 프로필(순수 컨트롤드 필드) 두 가지 모드로 동작한다는 점을 확인.
