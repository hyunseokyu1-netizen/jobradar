import type {
  DashboardSummary,
  KanbanColumn,
  ResumeWorkspaceData,
} from './types'

// ─────────────────────────────────────────────────────────────
// 목(Mock) 데이터.
// 프로토타입의 공고/이력서/통계는 하드코딩 목업이며, 실제로는 API 연동이 필요하다.
// 아래 각 export 는 추후 서버 액션/Supabase 조회로 대체한다.
// ─────────────────────────────────────────────────────────────

// 회사 머리글자 칩 색상 (README 명세 — 실 로고로 교체 예정)
const BRAND = {
  spotify: { initial: 'S', color: '#1DB954' },
  klarna: { initial: 'K', color: '#FF6F91' },
  shopify: { initial: 'S', color: '#5C6AC4' },
  grab: { initial: 'G', color: '#00B14F' },
  notion: { initial: 'N', color: '#2F313D' },
}

// 상태 점 색상 (README Status 토큰)
const DOT = {
  preparing: '#98A2B3',
  applied: '#1A56DB',
  interview: '#B45309',
  offer: '#046C4E',
}

/**
 * TODO(api): 사용자별 지원 현황 칸반 데이터.
 * matches 테이블(status, score 등) → 상태별 그룹핑으로 대체.
 */
export function getKanbanColumns(): KanbanColumn[] {
  return [
    {
      status: 'preparing',
      dotColor: DOT.preparing,
      jobs: [
        {
          id: 'job-spotify',
          role: '백엔드 엔지니어',
          company: 'Spotify',
          brand: BRAND.spotify,
          location: '스톡홀름, 스웨덴',
          salary: '€65K–85K',
          matchRate: 82,
        },
        {
          id: 'job-klarna',
          role: '데이터 분석가',
          company: 'Klarna',
          brand: BRAND.klarna,
          location: '베를린, 독일',
          salary: '€60K–78K',
          matchRate: 75,
        },
      ],
    },
    {
      status: 'applied',
      dotColor: DOT.applied,
      jobs: [
        {
          id: 'job-shopify',
          role: '프론트엔드 개발자',
          company: 'Shopify',
          brand: BRAND.shopify,
          location: '토론토, 캐나다 · 원격',
          salary: 'CA$95K–120K',
          matchRate: 88,
        },
      ],
    },
    {
      status: 'interview',
      dotColor: DOT.interview,
      jobs: [
        {
          id: 'job-grab',
          role: '프로덕트 매니저',
          company: 'Grab',
          brand: BRAND.grab,
          location: '싱가포르',
          salary: 'S$110K–140K',
          matchRate: 91,
          statusBadge: { text: '2차 면접 · 6월 30일', tone: 'amber' },
        },
      ],
    },
    {
      status: 'offer',
      dotColor: DOT.offer,
      jobs: [
        {
          id: 'job-notion',
          role: '테크니컬 라이터',
          company: 'Notion',
          brand: BRAND.notion,
          location: '더블린, 아일랜드',
          salary: '€55K–70K',
          matchRate: 79,
          statusBadge: { text: '오퍼 수신 · 검토 중', tone: 'green' },
        },
      ],
    },
  ]
}

/**
 * TODO(api): 요약 통계 (번역 완료 수, 저장 공고 수, 진행 지원 수, 평균 매칭률).
 */
export function getDashboardSummary(): DashboardSummary {
  return {
    userName: '지민',
    stats: ['3', '5', '2', '78%'],
  }
}

/**
 * TODO(api): 이력서 원본/번역본 + 타깃 공고 + 매칭률.
 */
export function getWorkspaceData(): ResumeWorkspaceData {
  return {
    docTitle: '시니어 백엔드 엔지니어',
    target: {
      company: 'Spotify',
      role: '백엔드 엔지니어',
      location: '스톡홀름, 스웨덴',
      brand: BRAND.spotify,
    },
    matchRate: 82,
    tailored: true,
    original: {
      name: '김지민',
      title: '시니어 백엔드 엔지니어',
      contact: '서울, 대한민국 · jimin.kim@email.com',
      experiences: [
        {
          org: '네이버 — 백엔드 엔지니어',
          period: '2021.03 – 현재',
          bullets: [
            { text: '대규모 트래픽 결제 시스템 설계 및 운영 (일 500만 건 처리)' },
            { text: '응답 지연 40% 개선 및 마이크로서비스 전환 주도' },
            { text: '신규 결제 모듈 출시로 매출 12% 증대' },
          ],
        },
        {
          org: '카카오 — 주니어 백엔드 엔지니어',
          period: '2019.01 – 2021.02',
          bullets: [
            { text: 'REST API 및 내부 운영 도구 개발' },
            { text: '코드 리뷰 문화 정착에 기여' },
          ],
        },
      ],
      skills: ['Java', 'Spring', 'Kotlin', 'MySQL', 'Kafka', 'AWS'],
      education: { org: '서울대학교 — 컴퓨터공학 학사', period: '2015 – 2019' },
    },
    translated: {
      name: 'Jimin Kim',
      title: 'Senior Backend Engineer',
      contact: 'Seoul, South Korea · jimin.kim@email.com',
      experiences: [
        {
          org: 'NAVER — Backend Engineer',
          period: 'Mar 2021 – Present',
          bullets: [
            {
              text: 'Designed and operated a high-throughput, distributed payments system handling 5M daily transactions',
              highlights: ['high-throughput, distributed payments system'],
            },
            {
              text: 'Reduced response latency by 40% and led the migration to a microservices architecture',
              highlights: ['microservices architecture'],
            },
            { text: 'Launched a new payment module that drove a 12% revenue increase' },
          ],
        },
        {
          org: 'Kakao — Junior Backend Engineer',
          period: 'Jan 2019 – Feb 2021',
          bullets: [
            { text: 'Built REST APIs and internal operational tooling' },
            { text: 'Championed a code-review culture across the team' },
          ],
        },
      ],
      skills: ['Java', 'Spring', 'Kotlin', 'MySQL', 'Kafka', 'AWS'],
      education: {
        org: 'B.S. in Computer Science, Seoul National University',
        period: '2015 – 2019',
      },
    },
    optimizationNote: {
      company: 'Spotify',
      keyword: "'distributed systems'",
      body: "요구사항에 맞춰 '대규모 트래픽 결제 시스템' 경험을 강조하도록 표현을 조정했습니다.",
    },
  }
}
