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
  /** 실제 matches.status (인터랙티브 보드의 상태 드롭다운용). 목업 카드엔 없음 */
  status?: string
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
  /** 경력 요약 (있으면 EXPERIENCE 위에 표시) */
  summary?: string
  experiences: ResumeExperience[]
  skills: string[]
  education: ResumeEducation[]
}

export interface ResumeWorkspaceData {
  docTitle: string
  /** 로그인 유저 이메일 — 연락처 줄의 기준값 (실데이터에서만 제공) */
  email?: string
  target: {
    company: string
    role: string
    location: string
    brand: CompanyBrand
  }
  /** null = 미채점·분석 실패 (0은 "무관한 직무"라는 실제 판정이므로 구분) */
  matchRate: number | null
  /** 점수 근거 — 'jd_analysis'(JD 정밀) / 'title_estimate'(제목 추정, 신뢰도 낮음) / null(구버전·미채점) */
  matchScoreType?: string | null
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
  /** per-job 액션(JD 입력·지원 이력서·메모·정보 편집)에 필요한 실데이터 부가 정보 */
  jobExtra?: {
    description: string | null
    /** 외부 공고 페이지 링크 — 직접 입력 공고(합성 URL)는 null */
    applyUrl?: string | null
    memo: string | null
    appliedResumeFilename: string | null
    appliedResumeText: string | null
    appliedDocuments: import('@/lib/applied-documents').AppliedDocument[]
    location: string | null
    appliedAt: string | null
    status: string | null
  }
  /** 이력서 스튜디오에서 설정한 문서 디자인 (폰트·줄간격·포인트 컬러·템플릿) */
  design?: import('./resume-design').ResumeDesign
  /** 편집·AI 수정·다운로드용 원본 구조화 이력서 (실데이터에서만 제공) */
  koStudio?: import('@/lib/resume').StudioResume
  enStudio?: import('@/lib/resume').StudioResume
  /** true: koStudio가 이 공고 전용 초안(tailored_resumes). false/undefined: 아직 초안이 없어 마스터를 보여주는 중 */
  hasJobDraft?: boolean
  /** 이 공고 초안을 만든 이후 마스터 이력서(/profile)가 더 최근에 수정됨 — 재동기화 안내 배너용 */
  masterChanged?: boolean
}
