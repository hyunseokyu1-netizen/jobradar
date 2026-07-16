// 관리자 판별 — 이메일을 코드에 하드코딩하지 않고 환경변수로 지정한다.
// ADMIN_EMAILS: 쉼표로 구분한 관리자 이메일 목록 (예: "a@x.com,b@y.com")

function adminEmails(): Set<string> {
  return new Set(
    (process.env.ADMIN_EMAILS ?? '')
      .split(',')
      .map(e => e.trim().toLowerCase())
      .filter(Boolean)
  )
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false
  return adminEmails().has(email.trim().toLowerCase())
}
