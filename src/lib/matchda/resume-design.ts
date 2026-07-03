// 이력서 디자인 설정 (이력서 스튜디오에서 편집, 미리보기·워크스페이스 문서에 공통 적용)

export interface ResumeDesign {
  template: 'classic' | 'modern'
  font: 'plex' | 'geist' | 'serif'
  lineHeight: number
  accent: string
}

export const RESUME_FONT_CSS: Record<ResumeDesign['font'], string> = {
  plex: 'var(--font-plex-kr), sans-serif',
  geist: 'var(--font-geist-sans), sans-serif',
  serif: "Georgia, 'Apple SD Gothic Neo', serif",
}

export const DEFAULT_RESUME_DESIGN: ResumeDesign = {
  template: 'classic',
  font: 'plex',
  lineHeight: 1.75,
  accent: '#046C4E',
}

// JSONB에서 읽은 값을 안전하게 정규화 (미지원 값은 기본값으로)
export function normalizeResumeDesign(raw: unknown): ResumeDesign {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Partial<ResumeDesign>
  return {
    template: r.template === 'modern' ? 'modern' : 'classic',
    font: r.font && r.font in RESUME_FONT_CSS ? r.font : 'plex',
    lineHeight: Math.min(2.0, Math.max(1.4, Number(r.lineHeight) || 1.75)),
    accent: typeof r.accent === 'string' && /^#[0-9A-Fa-f]{6}$/.test(r.accent) ? r.accent : '#046C4E',
  }
}
