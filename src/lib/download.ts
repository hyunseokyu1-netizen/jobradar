// 텍스트 콘텐츠를 TXT / DOCX / PDF 파일로 다운로드하는 클라이언트 헬퍼

export async function downloadTxt(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}.txt`
  a.click()
  URL.revokeObjectURL(url)
}

export async function downloadDocx(content: string, filename: string) {
  const { Document, Packer, Paragraph, TextRun } = await import('docx')
  const paragraphs = content.split('\n').map(line =>
    new Paragraph({ children: [new TextRun(line)] })
  )
  const doc = new Document({ sections: [{ children: paragraphs }] })
  const blob = await Packer.toBlob(doc)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}.docx`
  a.click()
  URL.revokeObjectURL(url)
}

export async function downloadPdf(content: string, filename: string) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF()
  const lines = doc.splitTextToSize(content, 180)
  doc.setFontSize(11)
  doc.text(lines, 15, 20)
  doc.save(`${filename}.pdf`)
}

// 이력서 HTML을 브라우저 인쇄 다이얼로그로 PDF 저장 (한글 폰트 지원)
// jsPDF 기본 폰트는 한글을 못 그리므로, 시스템 폰트를 쓰는 인쇄 방식을 사용한다.
export async function printResumeHtml(bodyHtml: string, filename: string) {
  const iframe = document.createElement('iframe')
  iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;border:none'
  document.body.appendChild(iframe)

  const doc = iframe.contentDocument!
  doc.open()
  doc.write(`<!DOCTYPE html><html lang="ko"><head><title>${filename}</title><style>
    *{box-sizing:border-box}
    body{font-family:-apple-system,'Apple SD Gothic Neo','Malgun Gothic',Arial,sans-serif;margin:16mm 18mm;font-size:10.5pt;line-height:1.55;color:#111}
    h1{font-size:20pt;margin:0 0 2px;font-weight:700}
    .title{color:#046C4E;font-weight:600;font-size:12pt;margin-bottom:2px}
    .contact{color:#888;font-size:9pt;margin-bottom:10px}
    .label{text-transform:uppercase;letter-spacing:.08em;font-size:8.5pt;color:#9AA3AD;font-weight:600;border-bottom:1px solid #eee;padding-bottom:3px;margin:16px 0 8px}
    .exp{margin-bottom:10px}
    .exp-head{display:flex;justify-content:space-between;font-weight:600;gap:8px}
    .period{color:#98A2B3;font-weight:400;font-size:9pt;white-space:nowrap}
    ul{margin:5px 0 0;padding-left:16px}
    li{margin:2px 0}
    .chip{display:inline-block;border:1px solid #CEEBDC;background:#ECFDF3;color:#046C4E;border-radius:6px;padding:2px 8px;font-size:9pt;margin:0 4px 4px 0}
    @page{margin:16mm 18mm}
  </style></head><body>${bodyHtml}</body></html>`)
  doc.close()

  setTimeout(() => {
    iframe.contentWindow?.print()
    setTimeout(() => document.body.removeChild(iframe), 3000)
  }, 400)
}

// 원본 DOCX base64를 mammoth로 HTML 변환 후 인쇄 다이얼로그로 PDF 저장
export async function printPdfFromDocx(base64: string, filename: string) {
  const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0))
  const mammoth = await import('mammoth')
  const { value: html } = await (mammoth as any).convertToHtml({ arrayBuffer: bytes.buffer })

  const iframe = document.createElement('iframe')
  iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;border:none'
  document.body.appendChild(iframe)

  const doc = iframe.contentDocument!
  doc.open()
  doc.write(`<!DOCTYPE html><html><head><title>${filename}</title><style>
    body{font-family:Calibri,Arial,sans-serif;margin:15mm 18mm;font-size:10.5pt;line-height:1.5;color:#111}
    strong{font-weight:bold}em{font-style:italic}p{margin:3px 0}h1,h2,h3{margin:8px 0 4px}
    @page{margin:15mm 18mm}
  </style></head><body>${html}</body></html>`)
  doc.close()

  setTimeout(() => {
    iframe.contentWindow?.print()
    setTimeout(() => document.body.removeChild(iframe), 3000)
  }, 400)
}
