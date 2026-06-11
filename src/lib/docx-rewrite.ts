// DOCX의 서식(스타일·레이아웃)은 유지하고 문단 텍스트만 교체하는 유틸.
// word/document.xml에서 <w:p>(문단)별 <w:t>(텍스트 노드)만 건드리므로
// 폰트, 색상, 들여쓰기, 표 구조 등 원본 양식이 그대로 보존된다.

import JSZip from 'jszip'

const PARA_RE = /<w:p\b[^>/]*>[\s\S]*?<\/w:p>/g
const WT_RE = /(<w:t(?:\s[^>]*)?>)([\s\S]*?)(<\/w:t>)/g

function decodeXml(s: string): string {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
}

function encodeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export interface DocxDocument {
  zip: JSZip
  xml: string
  /** 문단 인덱스 → 텍스트 (빈 문단 포함, 인덱스는 applyReplacements와 일치) */
  paragraphs: { index: number; text: string }[]
}

export async function loadDocx(buffer: Buffer): Promise<DocxDocument> {
  const zip = await JSZip.loadAsync(buffer)
  const file = zip.file('word/document.xml')
  if (!file) throw new Error('유효한 DOCX 파일이 아닙니다.')
  const xml = await file.async('string')

  const paragraphs: { index: number; text: string }[] = []
  let i = 0
  for (const m of xml.matchAll(PARA_RE)) {
    const text = [...m[0].matchAll(WT_RE)].map(t => decodeXml(t[2])).join('')
    paragraphs.push({ index: i, text })
    i++
  }
  return { zip, xml, paragraphs }
}

/**
 * 문단 인덱스별 새 텍스트를 적용한다.
 * 문단의 첫 번째 <w:t>에 새 텍스트 전체를 넣고(첫 run의 서식 유지),
 * 나머지 <w:t>는 비운다. 텍스트 노드가 없는 문단은 건너뛴다.
 */
export async function applyReplacements(doc: DocxDocument, replacements: Map<number, string>): Promise<Buffer> {
  let i = 0
  const newXml = doc.xml.replace(PARA_RE, para => {
    const newText = replacements.get(i)
    i++
    if (newText === undefined) return para

    let first = true
    return para.replace(WT_RE, (_m, open: string, _content: string, close: string) => {
      if (first) {
        first = false
        const openTag = open.includes('xml:space')
          ? open
          : open.replace('<w:t', '<w:t xml:space="preserve"')
        return openTag + encodeXml(newText) + close
      }
      return open + close
    })
  })

  doc.zip.file('word/document.xml', newXml)
  return doc.zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
  }) as Promise<Buffer>
}
