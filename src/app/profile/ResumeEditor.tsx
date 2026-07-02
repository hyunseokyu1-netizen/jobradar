'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { translateResumeSection, type ResumeSection } from './actions'

interface ExpItem { company?: string; position?: string; period?: string; description?: string }
interface EduItem { school?: string; major?: string; degree?: string; period?: string }

interface Props {
  email: string
  name: string
  phone: string
  summaryKo: string
  summaryEn: string
  skillsKo: string[]
  skillsEn: string[]
  experienceKo: ExpItem[]
  experienceEn: ExpItem[]
  educationKo: EduItem[]
  educationEn: EduItem[]
}

// 구조화 항목 → 편집용 한국어 텍스트(빈 줄로 항목 구분)
function expToText(items: ExpItem[]): string {
  return items
    .map(e => {
      const head = [e.company, e.position].filter(Boolean).join(' ')
      const line1 = [head, e.period].filter(Boolean).join(', ')
      return [line1, e.description].filter(Boolean).join('\n')
    })
    .join('\n\n')
}
function eduToText(items: EduItem[]): string {
  return items
    .map(e => [[e.school, e.major, e.degree].filter(Boolean).join(' '), e.period].filter(Boolean).join(', '))
    .join('\n\n')
}

export default function ResumeEditor(props: Props) {
  const router = useRouter()

  // 섹션별 편집(한국어) + 번역 결과(영어) 상태
  const [summaryKo, setSummaryKo] = useState(props.summaryKo)
  const [summaryEn, setSummaryEn] = useState(props.summaryEn)

  const [skillsKo, setSkillsKo] = useState(props.skillsKo.join(', '))
  const [skillsEn, setSkillsEn] = useState<string[]>(props.skillsEn)

  const [expKo, setExpKo] = useState(expToText(props.experienceKo))
  const [expEn, setExpEn] = useState<ExpItem[]>(props.experienceEn)

  const [eduKo, setEduKo] = useState(eduToText(props.educationKo))
  const [eduEn, setEduEn] = useState<EduItem[]>(props.educationEn)

  const [busy, setBusy] = useState<ResumeSection | null>(null)
  const [error, setError] = useState('')

  async function translate(section: ResumeSection, koText: string) {
    setBusy(section)
    setError('')
    const res = await translateResumeSection(section, koText)
    setBusy(null)
    if (res.error) { setError(res.error); return }
    if (section === 'summary') setSummaryEn(res.en as string)
    else if (section === 'skills') setSkillsEn((res.en as string[]) ?? [])
    else if (section === 'experience') setExpEn((res.en as ExpItem[]) ?? [])
    else if (section === 'education') setEduEn((res.en as EduItem[]) ?? [])
    router.refresh()
  }

  return (
    <div className="bg-white rounded-2xl border border-[#ECEEF0] divide-y divide-[#F0F2F4]">
      {/* 연락처 (읽기 전용 — 기본 정보는 아래 프로필에서 수정) */}
      <Section title="연락처" defaultOpen>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
          <ReadField label="이름" value={props.name || '—'} />
          <ReadField label="이메일" value={props.email} />
          <ReadField label="전화" value={props.phone || '—'} />
        </div>
        <p className="text-[11px] text-[#98A2B3] mt-2">이름·전화는 아래 ‘프로파일’에서 수정할 수 있어요.</p>
      </Section>

      {/* 요약 */}
      <Section title="경력 요약">
        <KoEditor
          value={summaryKo}
          onChange={setSummaryKo}
          placeholder="한국어로 경력 요약을 적어주세요. 예: 8년차 풀스택 개발자로 결제·음악 도메인에서…"
          rows={4}
          busy={busy === 'summary'}
          onTranslate={() => translate('summary', summaryKo)}
        />
        {summaryEn && (
          <EnBlock>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{summaryEn}</p>
          </EnBlock>
        )}
      </Section>

      {/* 경력 */}
      <Section title="경력">
        <KoEditor
          value={expKo}
          onChange={setExpKo}
          placeholder={'한국어로 경력을 적어주세요. 항목은 빈 줄로 구분.\n예)\nABC테크 백엔드 개발자, 2018-2022\nNode.js로 결제 시스템 개발…\n\nXYZ 프론트엔드, 2016-2018\n…'}
          rows={8}
          busy={busy === 'experience'}
          onTranslate={() => translate('experience', expKo)}
        />
        {expEn.length > 0 && (
          <EnBlock>
            {expEn.map((e, i) => (
              <div key={i} className="mb-2.5 last:mb-0">
                <p className="text-sm font-semibold">{[e.company, e.position].filter(Boolean).join(' · ')}</p>
                {e.period && <p className="text-[11px] text-[#98A2B3]">{e.period}</p>}
                {e.description && <p className="text-sm whitespace-pre-wrap mt-0.5">{e.description}</p>}
              </div>
            ))}
          </EnBlock>
        )}
      </Section>

      {/* 학력 */}
      <Section title="학력">
        <KoEditor
          value={eduKo}
          onChange={setEduKo}
          placeholder={'한국어로 학력을 적어주세요. 항목은 빈 줄로 구분.\n예) 서울대학교 컴퓨터공학과 학사, 2011-2015'}
          rows={4}
          busy={busy === 'education'}
          onTranslate={() => translate('education', eduKo)}
        />
        {eduEn.length > 0 && (
          <EnBlock>
            {eduEn.map((e, i) => (
              <div key={i} className="mb-1.5 last:mb-0">
                <p className="text-sm font-semibold">{[e.school, e.major, e.degree].filter(Boolean).join(' · ')}</p>
                {e.period && <p className="text-[11px] text-[#98A2B3]">{e.period}</p>}
              </div>
            ))}
          </EnBlock>
        )}
      </Section>

      {/* 스킬 */}
      <Section title="스킬">
        <KoEditor
          value={skillsKo}
          onChange={setSkillsKo}
          placeholder="한국어로 보유 기술을 쉼표로 구분해 적어주세요. 예: 노드제이에스, 리액트, 타입스크립트, AWS"
          rows={2}
          busy={busy === 'skills'}
          onTranslate={() => translate('skills', skillsKo)}
        />
        {skillsEn.length > 0 && (
          <EnBlock>
            <div className="flex flex-wrap gap-1.5">
              {skillsEn.map((s, i) => (
                <span key={i} className="text-xs bg-[#F4F6F8] text-[#344054] rounded px-2 py-0.5">{s}</span>
              ))}
            </div>
          </EnBlock>
        )}
      </Section>

      {error && <p className="text-xs text-red-500 px-4 py-2">{error}</p>}
    </div>
  )
}

// ── 공통 UI 조각 ──────────────────────────────────────────────

function Section({ title, defaultOpen, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(!!defaultOpen)
  return (
    <div className="px-4 py-3">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between text-left"
      >
        <span className="text-sm font-semibold">{title}</span>
        <span className="text-lg text-[#B0B7C0] leading-none">{open ? '−' : '+'}</span>
      </button>
      {open && <div className="mt-3">{children}</div>}
    </div>
  )
}

function KoEditor({
  value, onChange, placeholder, rows, busy, onTranslate,
}: {
  value: string
  onChange: (v: string) => void
  placeholder: string
  rows: number
  busy: boolean
  onTranslate: () => void
}) {
  return (
    <div>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full resize-y border border-[#E2E6EA] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#046C4E]/10"
      />
      <div className="flex justify-end mt-2">
        <button
          onClick={onTranslate}
          disabled={busy || !value.trim()}
          className="text-xs font-medium bg-[#046C4E] text-white px-3 py-1.5 rounded-lg hover:bg-[#035A40] disabled:opacity-40 transition-colors"
        >
          {busy ? '번역 중…' : '🌐 번역해서 저장'}
        </button>
      </div>
    </div>
  )
}

// 번역된 영어 결과 (영어가 본문, 한국어는 위 입력칸이 보조 역할)
function EnBlock({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-2 border-l-2 border-[#046C4E]/70 bg-[#F7F8FA] rounded-r-lg px-3 py-2">
      <p className="text-[10px] font-semibold text-[#98A2B3] mb-1">EN · 저장됨</p>
      {children}
    </div>
  )
}

function ReadField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] text-[#98A2B3]">{label}</p>
      <p className="truncate">{value}</p>
    </div>
  )
}
