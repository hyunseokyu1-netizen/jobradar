// MatchDa UI 문구 i18n 딕셔너리 (라이브러리 없이 경량 구현)
// 한국어/영어 혼용 UI이므로 화면 문구를 데이터에서 분리한다.

export type Locale = 'ko' | 'en'

export const defaultLocale: Locale = 'ko'
export const locales: Locale[] = ['ko', 'en']

const ko = {
  brand: { name: 'MatchDa', sub: '매치다' },
  nav: {
    about: '서비스 소개',
    jobs: '채용 정보',
    resume: '이력서 번역',
    pricing: '요금제',
    login: '로그인',
    signup: '무료로 시작하기',
  },
  hero: {
    eyebrow: '한국 인재를 위한 글로벌 커리어 플랫폼',
    titleLine1: '당신의 글로벌 커리어가',
    titleLine2: '여기서 시작됩니다.',
    subhead:
      '한국어 이력서를 전문가 수준의 영어로 번역하고, 전 세계 채용 공고에 맞춰 자동으로 최적화하세요.',
    searchCountry: '전체 국가',
    searchPlaceholder: '직무, 회사 또는 기술 검색',
    searchButton: '검색',
    trustPrefix: '이미 ',
    trustCount: '12,000명',
    trustSuffix: '의 한국 전문가가 함께합니다',
    freeNote: '맞춤 이력서 2개 무료 체험 · 카드 등록 없이 시작',
    floatRealtime: '실시간',
    floatNewMatches: '새 매칭 3건',
    floatTranslated: '이력서 번역 완료',
    floatTranslatedSub: '영어 · 방금 전',
  },
  heroB: {
    subheadLine1: '국가, 직무 또는 기술로 전 세계 채용 공고를 검색하세요.',
    subheadLine2: 'AI가 당신의 이력서를 번역하고 맞춤 최적화합니다.',
    popularLabel: '인기 검색',
    popularChips: ['베를린 · 백엔드', '원격 근무', '싱가포르 PM', '데이터 분석'],
  },
  features: [
    {
      title: '한국어 → 영어 이력서 번역',
      desc: '전문 번역가 수준의 AI가 경력의 뉘앙스까지 살려 자연스러운 영어로 변환합니다.',
    },
    {
      title: '해외 채용, 한 곳에서 관리',
      desc: '관심 공고를 저장하고 준비부터 오퍼까지 지원 현황을 한눈에 추적하세요.',
    },
    {
      title: '직무 맞춤형 자동 최적화',
      desc: '각 채용 공고의 요구사항에 맞춰 이력서를 자동 조정하고 매칭률을 확인하세요.',
    },
  ],
  featureMore: '자세히 보기',
  stats: [
    { value: '45개국+', label: '해외 채용 공고' },
    { value: '12,000+', label: '활동 중인 사용자' },
    { value: '81%', label: '평균 직무 매칭률' },
    { value: '3분', label: '평균 이력서 번역 시간' },
  ],
  footer: {
    copyright: '© 2026 MatchDa · 매치다',
    terms: '서비스 약관',
    privacy: '개인정보 처리방침',
    refund: '환불 정책',
    support: '고객센터',
  },
  dashboard: {
    nav: {
      dashboard: '대시보드',
      myResume: '내 이력서',
      savedJobs: '저장한 공고',
      applications: '지원 현황',
      recommended: '추천 채용',
      discover: '잡 탐색',
    },
    logout: '로그아웃',
    premium: {
      title: '프리미엄 업그레이드',
      desc: '무제한 번역과 우선 매칭을 이용하세요.',
      button: '업그레이드',
    },
    plan: '무료 플랜',
    topbarSearch: '공고, 회사 또는 국가 검색',
    newResume: '새 이력서',
    greeting: (name: string) => `안녕하세요, ${name}님`,
    greetingSub: '오늘도 글로벌 커리어를 향해 한 걸음 나아가 볼까요?',
    statCards: [
      { label: '번역 완료 이력서', delta: '+1 이번 주', tone: 'green' as const },
      { label: '저장한 공고', delta: '2개 마감 임박', tone: 'amber' as const },
      { label: '진행 중인 지원', delta: '면접 1건 예정', tone: 'muted' as const },
      { label: '평균 매칭률', delta: '상위 15%', tone: 'green' as const },
    ],
    boardTitle: '지원 현황',
    boardSub: '준비부터 오퍼까지 한눈에 추적하세요',
    viewBoard: '보드',
    viewList: '리스트',
    columns: {
      preparing: '준비 중',
      applied: '지원 완료',
      interview: '면접 진행',
      offer: '오퍼',
    },
    matchLabel: (n: number) => `매칭 ${n}%`,
  },
  workspace: {
    back: '대시보드',
    docTitlePrefix: '이력서 · ',
    autoSaved: '자동 저장됨',
    apply: '이 공고에 지원하기',
    bannerPrefix: '이 이력서는 ',
    bannerSuffix: ' 공고에 맞춰 최적화되었습니다 · 최적화 항목 5개',
    comparePrefix: '이 이력서를 ',
    compareSuffix: ' 공고와 비교했습니다',
    matchRateLabel: '직무 매칭률',
    originalLabel: '원본 (한국어)',
    originalMeta: '수정 없음 · 312 단어',
    translatedLabel: 'AI 번역 · 맞춤화 (영어)',
    translatedMeta: '방금 업데이트됨 · 298 words',
    translating: '번역 중...',
    optimizeButton: '이 공고에 맞춰 AI 분석',
    optimizing: 'AI 분석 중...',
    sections: {
      summary: '경력 요약',
      experience: '경력',
      skills: '기술',
      education: '학력',
    },
    sectionsEn: {
      summary: 'Summary',
      experience: 'Experience',
      skills: 'Skills',
      education: 'Education',
    },
  },
}

// 영어 로케일 — 동일 구조. 기본은 ko, 추후 로케일 스위처/쿠키 연동 TODO.
const en: typeof ko = {
  brand: { name: 'MatchDa', sub: 'Matchda' },
  nav: {
    about: 'About',
    jobs: 'Jobs',
    resume: 'Resume Translation',
    pricing: 'Pricing',
    login: 'Log in',
    signup: 'Get started free',
  },
  hero: {
    eyebrow: 'A global career platform for Korean talent',
    titleLine1: 'Your global career',
    titleLine2: 'starts right here.',
    subhead:
      'Translate your Korean resume into professional English and automatically tailor it to job postings around the world.',
    searchCountry: 'All countries',
    searchPlaceholder: 'Search role, company or skill',
    searchButton: 'Search',
    trustPrefix: 'Already ',
    trustCount: '12,000',
    trustSuffix: ' Korean professionals on board',
    freeNote: '2 tailored resumes free · no card required',
    floatRealtime: 'Live',
    floatNewMatches: '3 new matches',
    floatTranslated: 'Resume translated',
    floatTranslatedSub: 'English · just now',
  },
  heroB: {
    subheadLine1: 'Search jobs worldwide by country, role or skill.',
    subheadLine2: 'AI translates and tailors your resume to each role.',
    popularLabel: 'Popular',
    popularChips: ['Berlin · Backend', 'Remote', 'Singapore PM', 'Data Analysis'],
  },
  features: [
    {
      title: 'Korean → English resume translation',
      desc: 'Professional-grade AI captures the nuance of your career and converts it into natural English.',
    },
    {
      title: 'Manage overseas jobs in one place',
      desc: 'Save postings and track your applications from preparation to offer at a glance.',
    },
    {
      title: 'Role-tailored auto optimization',
      desc: 'Automatically adjust your resume to each job posting and check your match rate.',
    },
  ],
  featureMore: 'Learn more',
  stats: [
    { value: '45+', label: 'Countries with jobs' },
    { value: '12,000+', label: 'Active users' },
    { value: '81%', label: 'Average match rate' },
    { value: '3 min', label: 'Average translation time' },
  ],
  footer: {
    copyright: '© 2026 MatchDa',
    terms: 'Terms of Service',
    privacy: 'Privacy Policy',
    refund: 'Refund Policy',
    support: 'Support',
  },
  dashboard: {
    nav: {
      dashboard: 'Dashboard',
      myResume: 'My Resumes',
      savedJobs: 'Saved Jobs',
      applications: 'Applications',
      recommended: 'Recommended',
      discover: 'Explore',
    },
    logout: 'Log out',
    premium: {
      title: 'Upgrade to Premium',
      desc: 'Get unlimited translations and priority matching.',
      button: 'Upgrade',
    },
    plan: 'Free plan',
    topbarSearch: 'Search jobs, companies or countries',
    newResume: 'New Resume',
    greeting: (name: string) => `Hello, ${name}`,
    greetingSub: "Let's take one more step toward your global career today.",
    statCards: [
      { label: 'Translated resumes', delta: '+1 this week', tone: 'green' as const },
      { label: 'Saved jobs', delta: '2 closing soon', tone: 'amber' as const },
      { label: 'Active applications', delta: '1 interview upcoming', tone: 'muted' as const },
      { label: 'Average match rate', delta: 'Top 15%', tone: 'green' as const },
    ],
    boardTitle: 'Applications',
    boardSub: 'Track everything from preparation to offer',
    viewBoard: 'Board',
    viewList: 'List',
    columns: {
      preparing: 'Preparing',
      applied: 'Applied',
      interview: 'Interview',
      offer: 'Offer',
    },
    matchLabel: (n: number) => `${n}% match`,
  },
  workspace: {
    back: 'Dashboard',
    docTitlePrefix: 'Resume · ',
    autoSaved: 'Auto-saved',
    apply: 'Apply to this job',
    bannerPrefix: 'This resume is optimized for the ',
    bannerSuffix: ' posting · 5 optimizations',
    comparePrefix: 'Comparing your resume to the ',
    compareSuffix: ' posting',
    matchRateLabel: 'Job match rate',
    originalLabel: 'Original (Korean)',
    originalMeta: 'No edits · 312 words',
    translatedLabel: 'AI translated · tailored (English)',
    translatedMeta: 'Updated just now · 298 words',
    translating: 'Translating...',
    optimizeButton: 'Analyze for this job with AI',
    optimizing: 'Analyzing...',
    sections: {
      summary: '경력 요약',
      experience: '경력',
      skills: '기술',
      education: '학력',
    },
    sectionsEn: {
      summary: 'Summary',
      experience: 'Experience',
      skills: 'Skills',
      education: 'Education',
    },
  },
}

const dictionaries: Record<Locale, typeof ko> = { ko, en }

export type Dictionary = typeof ko

export function getMatchdaDict(locale: Locale = defaultLocale): Dictionary {
  return dictionaries[locale] ?? dictionaries[defaultLocale]
}
