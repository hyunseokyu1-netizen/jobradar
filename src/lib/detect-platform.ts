export type Platform = 'seek' | 'indeed' | 'linkedin' | 'glassdoor' | 'other'

const PLATFORM_PATTERNS: { platform: Platform; pattern: RegExp }[] = [
  { platform: 'seek',      pattern: /seek\.com\.au/i },
  { platform: 'indeed',   pattern: /indeed\.com/i },
  { platform: 'linkedin',  pattern: /linkedin\.com\/jobs/i },
  { platform: 'glassdoor', pattern: /glassdoor\.(com|de|co\.uk|com\.au)/i },
]

export function detectPlatform(url: string): Platform {
  for (const { platform, pattern } of PLATFORM_PATTERNS) {
    if (pattern.test(url)) return platform
  }
  return 'other'
}

export const PLATFORM_STYLE: Record<Platform, { label: string; className: string }> = {
  seek:      { label: 'Seek',      className: 'bg-blue-100 text-blue-700' },
  indeed:    { label: 'Indeed',    className: 'bg-orange-100 text-orange-700' },
  linkedin:  { label: 'LinkedIn',  className: 'bg-sky-100 text-sky-700' },
  glassdoor: { label: 'Glassdoor', className: 'bg-green-100 text-green-700' },
  other:     { label: 'Other',     className: 'bg-zinc-100 text-zinc-500' },
}
