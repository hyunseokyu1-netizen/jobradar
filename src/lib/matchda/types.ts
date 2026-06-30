// MatchDa 도메인 타입 정의

export type ApplicationStatus = 'preparing' | 'applied' | 'interview' | 'offer'

/** 회사 머리글자 칩 placeholder (실제 로고로 교체 예정) */
export interface CompanyBrand {
  /** 머리글자 (예: 'S') */
  initial: string
  /** 칩 배경색 hex */
  color: string
}

export interface JobCardData {
  id: string
  role: string
  company: string
  brand: CompanyBrand
  location: string
  salary: string
  matchRate: number
  /** 컬럼 상단의 상태 배지(면접 일정/오퍼 등). 없으면 미표시 */
  statusBadge?: {
    text: string
    tone: 'amber' | 'green'
  }
}

export interface KanbanColumn {
  status: ApplicationStatus
  /** 상태 점 색상 hex */
  dotColor: string
  jobs: JobCardData[]
}

export interface DashboardStat {
  /** 표시 수치 */
  value: string
}

export interface DashboardSummary {
  userName: string
  /** statCards 순서대로의 수치값 (라벨/델타는 i18n) */
  stats: string[]
}

/** 이력서 한 줄 (하이라이트 가능) */
export interface ResumeBullet {
  text: string
  /** 하이라이트할 부분 문자열들 (영어 최적화본에서 사용) */
  highlights?: string[]
}

export interface ResumeExperience {
  org: string
  period: string
  bullets: ResumeBullet[]
}

export interface ResumeEducation {
  org: string
  period: string
}

export interface ResumeDocumentData {
  name: string
  title: string
  contact: string
  experiences: ResumeExperience[]
  skills: string[]
  education: ResumeEducation
}

export interface ResumeWorkspaceData {
  docTitle: string
  target: {
    company: string
    role: string
    location: string
    brand: CompanyBrand
  }
  matchRate: number
  original: ResumeDocumentData
  translated: ResumeDocumentData
  /**
   * 공고 맞춤 최적화본 여부.
   * true(목업): 하이라이트·최적화 노트 포함. false(실데이터): 일반 이력서를 공고와 비교.
   */
  tailored?: boolean
  /** 아직 AI 최적화 분석 전인 실데이터 — 워크스페이스에서 생성 버튼 노출 */
  optimizable?: boolean
  /** 영어본 경력 아래 표시되는 최적화 노트 (맞춤 최적화본에만 존재) */
  optimizationNote?: {
    company: string
    keyword: string
    body: string
  }
}
