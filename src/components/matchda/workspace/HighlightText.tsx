import { Fragment } from 'react'

/**
 * 본문 문자열에서 highlights 부분 문자열을 그린 하이라이트로 감싼다.
 * (README: 배경 #DCF5E8 + rgba(4,108,78,0.45) 밑줄)
 */
export default function HighlightText({
  text,
  highlights,
}: {
  text: string
  highlights?: string[]
}) {
  if (!highlights || highlights.length === 0) return <>{text}</>

  // 하이라이트 후보를 길이순으로 정렬해 순차적으로 분할
  let segments: (string | { hl: string })[] = [text]
  for (const phrase of highlights) {
    const next: (string | { hl: string })[] = []
    for (const seg of segments) {
      if (typeof seg !== 'string') {
        next.push(seg)
        continue
      }
      const parts = seg.split(phrase)
      parts.forEach((p, i) => {
        if (p) next.push(p)
        if (i < parts.length - 1) next.push({ hl: phrase })
      })
    }
    segments = next
  }

  return (
    <>
      {segments.map((seg, i) =>
        typeof seg === 'string' ? (
          <Fragment key={i}>{seg}</Fragment>
        ) : (
          <span
            key={i}
            className="rounded-[3px] bg-[#DCF5E8] px-[3px] border-b-2 border-[rgba(4,108,78,0.45)]"
          >
            {seg.hl}
          </span>
        ),
      )}
    </>
  )
}
