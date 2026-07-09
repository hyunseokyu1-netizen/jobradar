import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

export const runtime = 'nodejs'
export const alt = 'MatchDa — 한국 인재를 위한 글로벌 커리어 플랫폼'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

// 카카오톡·슬랙 등에 링크를 공유할 때 뜨는 미리보기 이미지.
// 루트(/)에서 생성되며, 다른 페이지는 layout.tsx의 기본 openGraph.images에서 이 경로를 공유한다.
export default async function OpengraphImage() {
  const logoData = await readFile(join(process.cwd(), 'public', 'matchda-mark.png'))
  const logoSrc = `data:image/png;base64,${logoData.toString('base64')}`

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#F7FBF9',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <img src={logoSrc} alt="" width={84} height={84} style={{ borderRadius: 20 }} />
          <span style={{ fontSize: 64, fontWeight: 700, color: '#0C1A14', letterSpacing: -1.5 }}>
            MatchDa
          </span>
        </div>
        <div
          style={{
            marginTop: 32,
            fontSize: 34,
            fontWeight: 600,
            color: '#0B1A12',
            textAlign: 'center',
          }}
        >
          한국어 이력서를 전문가 수준 영어로,
        </div>
        <div
          style={{
            marginTop: 8,
            fontSize: 34,
            fontWeight: 600,
            color: '#046C4E',
            textAlign: 'center',
          }}
        >
          해외 채용 공고에 맞춰 자동으로.
        </div>
      </div>
    ),
    { ...size }
  )
}
