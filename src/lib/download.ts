// 텍스트 콘텐츠를 TXT / DOCX / PDF 파일로 다운로드하는 클라이언트 헬퍼

import type { RenderResume } from '@/lib/resume'

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// 화면 디자인과 동일한 서식(굵기·색·섹션 구분선·불릿·기간 우측정렬)의 이력서 DOCX 생성
export async function downloadResumeDocx(r: RenderResume, filename: string) {
  const {
    Document, Packer, Paragraph, TextRun, BorderStyle, TabStopType,
  } = await import('docx')

  const accent = r.accent.replace('#', '')
  const GRAY = '98A2B3'
  const INK = '1F2A37'
  const RIGHT_TAB = 9020 // 우측 탭 위치(twips, ≈ A4 본문폭)

  const children: InstanceType<typeof Paragraph>[] = []

  // 이름
  children.push(new Paragraph({
    spacing: { after: 40 },
    children: [new TextRun({ text: r.name, bold: true, size: 40, color: '101828' })],
  }))
  // 직함
  if (r.title) children.push(new Paragraph({
    spacing: { after: 40 },
    children: [new TextRun({ text: r.title, bold: true, size: 24, color: accent })],
  }))
  // 연락처
  children.push(new Paragraph({
    spacing: { after: 160 },
    children: [new TextRun({ text: r.contact, size: 18, color: GRAY })],
  }))

  const sectionLabel = (text: string) => new Paragraph({
    spacing: { before: 240, after: 120 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: 'EEEEEE', space: 4 } },
    children: [new TextRun({ text: text.toUpperCase(), bold: true, size: 17, color: '9AA3AD', characterSpacing: 12 })],
  })

  // 경력 요약
  if (r.summary) {
    children.push(sectionLabel(r.labels.summary))
    for (const line of r.summary.split('\n')) {
      children.push(new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: line, size: 21, color: '475467' })] }))
    }
  }

  // 경력
  if (r.experiences.length) {
    children.push(sectionLabel(r.labels.experience))
    r.experiences.forEach((e, i) => {
      children.push(new Paragraph({
        spacing: { before: i === 0 ? 0 : 160, after: 60 },
        tabStops: [{ type: TabStopType.RIGHT, position: RIGHT_TAB }],
        children: [
          new TextRun({ text: e.org, bold: true, size: 22, color: INK }),
          new TextRun({ text: `\t${e.period}`, size: 18, color: GRAY }),
        ],
      }))
      for (const b of e.bullets) {
        children.push(new Paragraph({
          bullet: { level: 0 },
          spacing: { after: 40 },
          children: [new TextRun({ text: b, size: 21, color: '475467' })],
        }))
      }
    })
  }

  // 스킬
  if (r.skills.length) {
    children.push(sectionLabel(r.labels.skills))
    children.push(new Paragraph({
      spacing: { after: 40 },
      children: [new TextRun({ text: r.skills.join('   •   '), size: 21, color: accent })],
    }))
  }

  // 학력
  if (r.education.length) {
    children.push(sectionLabel(r.labels.education))
    for (const e of r.education) {
      children.push(new Paragraph({
        spacing: { after: 40 },
        tabStops: [{ type: TabStopType.RIGHT, position: RIGHT_TAB }],
        children: [
          new TextRun({ text: e.text, bold: true, size: 20, color: INK }),
          new TextRun({ text: `\t${e.period}`, size: 18, color: GRAY }),
        ],
      }))
    }
  }

  const doc = new Document({
    styles: { default: { document: { run: { font: 'Calibri' } } } },
    sections: [{
      properties: { page: { margin: { top: 900, bottom: 900, left: 1000, right: 1000 } } },
      children,
    }],
  })
  const blob = await Packer.toBlob(doc)
  triggerDownload(blob, `${filename}.docx`)
}

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

// 이력서 body HTML을 감싸는 공통 인쇄 스타일 (한글 폰트 지원)
const RESUME_PRINT_CSS = `
  *{box-sizing:border-box}
  body{font-family:-apple-system,'Apple SD Gothic Neo','Malgun Gothic',Arial,sans-serif;font-size:10.5pt;line-height:1.55;color:#111}
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
`

// 이력서 body HTML을 실제 PDF 파일로 다운로드 (한글 지원, 인쇄 다이얼로그·URL 푸터 없음).
// 오프스크린 DOM을 html2canvas로 래스터화 → jsPDF에 A4로 배치(필요 시 페이지 분할).
export async function downloadResumePdf(bodyHtml: string, filename: string) {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import('html2canvas'),
    import('jspdf'),
  ])

  // A4 96dpi 기준 본문 폭(px). 여백 포함해 794px 페이지에 48px 패딩.
  const container = document.createElement('div')
  container.style.cssText = 'position:fixed;left:-99999px;top:0;width:794px;background:#ffffff;padding:56px 60px'
  container.innerHTML = `<style>${RESUME_PRINT_CSS}</style>${bodyHtml}`
  document.body.appendChild(container)

  try {
    const canvas = await html2canvas(container, { scale: 2, backgroundColor: '#ffffff', useCORS: true })
    const imgData = canvas.toDataURL('image/png')

    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const pageW = 210
    const pageH = 297
    const imgH = (canvas.height * pageW) / canvas.width

    let heightLeft = imgH
    let position = 0
    pdf.addImage(imgData, 'PNG', 0, position, pageW, imgH)
    heightLeft -= pageH
    while (heightLeft > 0) {
      position -= pageH
      pdf.addPage()
      pdf.addImage(imgData, 'PNG', 0, position, pageW, imgH)
      heightLeft -= pageH
    }
    pdf.save(`${filename}.pdf`)
  } finally {
    document.body.removeChild(container)
  }
}

// 원본 DOCX base64를 mammoth로 HTML 변환 후 인쇄 다이얼로그로 PDF 저장
export async function printPdfFromDocx(base64: string, filename: string) {
  const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0))
  const mammoth = await import('mammoth')
  const convertToHtml = (mammoth as unknown as {
    convertToHtml: (input: { arrayBuffer: ArrayBuffer }) => Promise<{ value: string }>
  }).convertToHtml
  const { value: html } = await convertToHtml({ arrayBuffer: bytes.buffer })

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
