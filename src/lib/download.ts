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
