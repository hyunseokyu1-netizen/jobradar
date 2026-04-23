export async function parseResumeFile(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer())
  const ext = file.name.split('.').pop()?.toLowerCase()

  if (ext === 'pdf') {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require('pdf-parse/lib/pdf-parse')
    const result = await pdfParse(buffer)
    return (result.text as string).trim()
  }

  if (ext === 'docx') {
    const mammoth = await import('mammoth')
    const result = await mammoth.extractRawText({ buffer })
    return result.value.trim()
  }

  throw new Error('지원하지 않는 파일 형식입니다. PDF 또는 DOCX만 가능합니다.')
}
