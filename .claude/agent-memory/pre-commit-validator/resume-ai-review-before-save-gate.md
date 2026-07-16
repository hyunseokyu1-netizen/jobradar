---
name: resume-ai-review-before-save-gate
description: 이력서 AI 수정 액션(chatEditResume/tailorResumeForJob/enrichResumeStudio)은 저장하지 않고 제안만 반환 — 확정 저장은 별도 액션(saveJobResumeDraft/saveResumeStudio)에서 이뤄진다
metadata:
  type: project
---

2026-07-16 커밋에서 워크스페이스 AI 채팅 수정(`chatEditResume`, src/app/profile/actions.ts)이
더 이상 `syncResumeEnglish`(DB 저장 포함)를 호출하지 않고 `translateStudioToEnglish`(순수 번역,
DB 쓰기 없음, src/lib/resume-translate.ts)로 교체됨. `tailorResumeForJob`/`enrichResumeStudio`도
동일하게 "제안만 반환, 저장은 호출부의 별도 액션"이라는 게이트를 따른다.

**Why:** 이전엔 AI 채팅 수정이 즉시 마스터 이력서(profiles.onboarding_ko/en)에 저장돼버려,
사용자가 검토·거절할 방법이 없었다. AI 생성 결과의 사실 위조(원본에 없는 숫자·회사명·기간·
스킬·직함) 위험 때문에 "검토 후 저장" UX로 전환.

**How to apply:**
- `src/app/profile/actions.ts`의 이력서 AI 수정 계열 함수(chatEditResume/tailorResumeForJob/
  enrichResumeStudio)에 새로 `supabaseAdmin` 쓰기가 추가돼 있으면 이 게이트를 깨는 회귀이니
  CRITICAL로 플래그.
- `src/components/matchda/workspace/WorkspaceResume.tsx`의 handleChatSend/handleTailorToJob이
  AI 결과 수신 후 `router.refresh()`를 호출하지 않는 것은 의도적 — 저장 전 제안 상태(dirty=true)를
  서버 리프레시가 날리는 것을 막기 위함. 이걸 "빠뜨린 refresh"로 오인해 지적하지 말 것.
  실제 저장 액션(handleSave, saveJobResumeDraft 호출)에서는 여전히 router.refresh() 호출됨 — 정상.
- 사실 확인 로직은 `src/lib/resume-fact-check.ts`의 `checkResumeFacts(original, revised)` —
  순수 함수, supabase/claude import 없음, 차단이 아니라 경고(FactWarning[])만 반환.
  이 파일에 network/DB import가 생기면 설계 위반.
- 저장 버튼(handleSave)에서만 `factWarnings`/`undoSnapshot`을 해제 — 사용자가 명시적으로
  저장을 눌러야 AI 제안이 "확정"된 것으로 간주. 이 해제 타이밍이 다른 곳(AI 응답 수신 직후 등)으로
  옮겨지면 사실 확인 UX가 무력화되니 회귀로 취급.

관련: [[matchda-design-tokens]]
