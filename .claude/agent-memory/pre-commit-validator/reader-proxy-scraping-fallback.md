---
name: reader-proxy-scraping-fallback
description: src/lib/scrapers/reader.ts — r.jina.ai 리더 프록시를 이용한 봇 차단 우회 최종 폴백
metadata:
  type: project
---

`src/lib/scrapers/reader.ts`는 Seek(Kasada)/Indeed(Cloudflare) 등이 데이터센터·로컬 IP에서의 직접 fetch와
헤드리스 브라우저까지 차단할 때 쓰는 최후의 우회 수단이다. `https://r.jina.ai/{url}`에 요청해 마크다운을
받아온 뒤 Claude Haiku(`claude-haiku-4-5-20251001`)로 title/company/location/salary/description을 구조화 추출한다.
선택적으로 `process.env.JINA_API_KEY`가 있으면 요청 한도가 늘어난다(없어도 저빈도 사용은 동작).

**Why:** `src/app/api/scrape-url/route.ts`와 `src/lib/discover/ats.ts`의 `scrapeGeneric`이 직접 수집 실패 시
이 폴백으로 넘어가도록 2026-07 무렵 추가됨. `scrape-url` route의 `maxDuration`을 30→90초로 올린 것도
리더 프록시(최대 45초 타임아웃) + Haiku 추출 시간을 감안한 조치.

**How to apply:** 이 폴백 관련 코드 리뷰 시 — (1) `fetchReaderMarkdown`이 빈 응답/에러 페이지 방어로
200자 미만이면 throw하는지, (2) 리더 폴백이 title만 건지고 description이 빈 경우 기존 job.description을
덮어쓰지 않는지(`scraped.description || job.description || null` 패턴) 확인. 이 패턴이 깨지면 기존에 수동
입력해둔 JD가 날아가는 회귀가 생긴다.
