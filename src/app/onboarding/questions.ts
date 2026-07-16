// 온보딩 채팅 질문 스크립트
// 코드에 순서를 고정 정의하고, OnboardingChat이 이 배열을 순회하며 채팅 버블로 표시한다.
// 유저 답변은 자유 텍스트(한국어)로 받고, 구조화·영어 번역은 마지막 completeOnboarding에서 일괄 처리한다.

export type SingleKey = 'name' | 'phone' | 'skills' | 'positions' | 'locations' | 'salary'
export type ListKey = 'education' | 'experience'

export type Step =
  | {
      kind: 'single'
      key: SingleKey
      question: string
      placeholder?: string
      optional?: boolean
    }
  | {
      kind: 'list'
      key: ListKey
      question: string // 첫 항목 질문
      addMoreQuestion: string // 다음 항목 질문
      placeholder?: string
    }

export const INTRO =
  '안녕하세요! 맞춤 채용 매칭과 커버레터를 위해 몇 가지 여쭤볼게요. 편하게 한국어로 답해주시면, 마지막에 영어 프로필로 정리해 드립니다. 먼저 기본 정보부터 시작할게요.'

export const OUTRO =
  '입력해 주셔서 감사합니다! 답변을 영어 프로필로 정리하고 있어요. 잠시만 기다려 주세요...'

export const STEPS: Step[] = [
  {
    kind: 'single',
    key: 'name',
    question: '이름이 어떻게 되시나요? (영문 이름이 있다면 함께 적어주셔도 좋아요)',
    placeholder: '예: 김지민 (Jimin Kim)',
  },
  {
    kind: 'single',
    key: 'phone',
    question: '연락 가능한 전화번호를 알려주세요.',
    placeholder: '예: +61 4xx xxx xxx 또는 010-1234-5678',
    optional: true,
  },
  {
    kind: 'list',
    key: 'education',
    question:
      '학력을 알려주세요. 학교명, 전공, 학위, 재학 기간을 한 번에 적어주시면 됩니다.',
    addMoreQuestion: '다른 학력이 더 있으면 적어주세요.',
    placeholder: '예: 서울대학교 컴퓨터공학과 학사, 2011-2015',
  },
  {
    kind: 'list',
    key: 'experience',
    question:
      '경력을 알려주세요. 회사명, 직무, 근무 기간, 주요 업무를 적어주시면 됩니다.',
    addMoreQuestion: '다른 경력이 더 있으면 적어주세요.',
    placeholder: '예: ABC테크 백엔드 개발자, 2018-2022, Node.js로 결제 시스템 개발',
  },
  {
    kind: 'single',
    key: 'skills',
    question: '보유하신 기술 스택과 스킬을 쉼표로 구분해 적어주세요.',
    placeholder: '예: Node.js, React Native, TypeScript, AWS, MySQL',
  },
  {
    kind: 'single',
    key: 'positions',
    question: '어떤 포지션을 찾고 계신가요? 여러 개면 쉼표로 구분해주세요.',
    placeholder: '예: 풀스택 개발자, 백엔드 개발자, React Native 개발자',
  },
  {
    kind: 'single',
    key: 'locations',
    question: '희망하시는 근무 지역을 알려주세요. 여러 곳이면 쉼표로 구분해주세요.',
    placeholder: '예: 시드니, 멜번, 오클랜드',
  },
  {
    kind: 'single',
    key: 'salary',
    question:
      '마지막으로, 희망 연봉을 알려주세요. 통화와 함께 최소~최대 범위로 적어주시면 좋아요.',
    placeholder: '예: USD 90,000 ~ 150,000',
    optional: true,
  },
]

// 유저 답변 누적 형태 (한국어 raw 텍스트)
export interface OnboardingAnswers {
  name: string
  phone: string
  education: string[]
  experience: string[]
  skills: string
  positions: string
  locations: string
  salary: string
}

export const EMPTY_ANSWERS: OnboardingAnswers = {
  name: '',
  phone: '',
  education: [],
  experience: [],
  skills: '',
  positions: '',
  locations: '',
  salary: '',
}

// 저장된 onboarding_ko(구조화 한국어 프로필)를 채팅 답변 형태로 역변환한다.
// "다시 작성" 시 기존 답변을 미리 채워 수정할 수 있게 하기 위함.
// 번역 실패로 raw OnboardingAnswers가 저장된 경우도 방어적으로 처리한다.
export function answersFromOnboardingKo(ko: unknown): OnboardingAnswers {
  if (!ko || typeof ko !== 'object') return EMPTY_ANSWERS
  const k = ko as Record<string, unknown>

  // 번역 실패 케이스: skills가 문자열이고 desired가 없으면 raw OnboardingAnswers
  if (typeof k.skills === 'string' && !('desired' in k)) {
    return { ...EMPTY_ANSWERS, ...(k as Partial<OnboardingAnswers>) }
  }

  const d = (k.desired ?? {}) as Record<string, unknown>
  const join = (v: unknown) => (Array.isArray(v) ? v.filter(Boolean).join(', ') : '')

  const salary = (() => {
    const cur = (d.salary_currency as string) || ''
    const min = d.salary_min as number | null | undefined
    const max = d.salary_max as number | null | undefined
    const fmt = (n: number) => n.toLocaleString('en-US')
    if (min != null && max != null) return `${cur} ${fmt(min)} ~ ${fmt(max)}`.trim()
    if (min != null || max != null) return `${cur} ${fmt((min ?? max) as number)}`.trim()
    return ''
  })()

  const eduItems = (Array.isArray(k.education) ? k.education : []) as Record<string, unknown>[]
  const expItems = (Array.isArray(k.experience) ? k.experience : []) as Record<string, unknown>[]

  return {
    name: (k.name as string) ?? '',
    phone: (k.phone as string) ?? '',
    education: eduItems
      .map(e => [[e.school, e.major, e.degree].filter(Boolean).join(' '), e.period].filter(Boolean).join(', '))
      .filter(Boolean),
    experience: expItems
      .map(e => [[e.company, e.position].filter(Boolean).join(' '), e.period, e.description].filter(Boolean).join(', '))
      .filter(Boolean),
    skills: join(k.skills),
    positions: join(d.positions),
    locations: join(d.locations),
    salary,
  }
}
