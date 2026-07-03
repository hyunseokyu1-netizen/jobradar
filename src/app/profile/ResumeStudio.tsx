'use client'

import { useState } from 'react'
import SkillChipInput from '@/components/SkillChipInput'
import { RESUME_FONT_CSS } from '@/lib/matchda/resume-design'
import { studioToRender, renderResumeHtml } from '@/lib/resume'
import { downloadResumeDocx, printResumeHtml } from '@/lib/download'
import {
  saveResumeStudio,
  syncResumeEnglish,
  type StudioResume,
  type StudioDesign,
  type StudioExp,
  type StudioEdu,
} from './actions'

export const DEFAULT_DESIGN: StudioDesign = {
  template: 'classic',
  font: 'plex',
  lineHeight: 1.75,
  accent: '#046C4E',
}

const FONTS: { key: StudioDesign['font']; label: string; css: string }[] = [
  { key: 'plex', label: 'IBM Plex', css: RESUME_FONT_CSS.plex },
  { key: 'geist', label: 'Geist', css: RESUME_FONT_CSS.geist },
  { key: 'serif', label: 'Serif', css: RESUME_FONT_CSS.serif },
]
const ACCENTS = ['#046C4E', '#1A56DB', '#1F2A37', '#B45309']

const EMPTY_EXP: StudioExp = { company: '', position: '', period: '', description: '' }
const EMPTY_EDU: StudioEdu = { school: '', major: '', degree: '', period: '' }

/**
 * 이력서 스튜디오 — 좌: 섹션 에디터(포함/제외 체크) + 디자이너, 우: 실시간 미리보기(한/영).
 * 한국어 원본을 편집하고 "영어로 동기화"로 영문판을 갱신한다.
 */
export default function ResumeStudio({
  initialKo,
  initialEn,
  email,
}: {
  initialKo: StudioResume
  initialEn: StudioResume | null
  email: string
}) {
  const [ko, setKo] = useState<StudioResume>({ ...initialKo, design: initialKo.design ?? DEFAULT_DESIGN })
  const [en, setEn] = useState<StudioResume | null>(initialEn)
  const [tab, setTab] = useState<'content' | 'design'>('content')
  const [lang, setLang] = useState<'ko' | 'en'>('ko')
  const [busy, setBusy] = useState<'save' | 'sync' | null>(null)
  const [saved, setSaved] = useState(false)
  const [enStale, setEnStale] = useState(false)
  const [error, setError] = useState('')

  const design = ko.design ?? DEFAULT_DESIGN

  // 내용 수정 → 영문판은 재동기화 전까지 구버전
  function edit(mut: (d: StudioResume) => StudioResume) {
    setKo(prev => mut(prev))
    setEnStale(true)
    setSaved(false)
  }
  // 디자인은 한/영 공용이라 stale 아님
  function editDesign(patch: Partial<StudioDesign>) {
    setKo(prev => ({ ...prev, design: { ...(prev.design ?? DEFAULT_DESIGN), ...patch } }))
    setSaved(false)
  }

  async function handleSave() {
    setBusy('save')
    setError('')
    const res = await saveResumeStudio(ko)
    setBusy(null)
    if (res.error) setError(res.error)
    else {
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    }
  }

  async function handleSync() {
    setBusy('sync')
    setError('')
    const res = await syncResumeEnglish(ko)
    setBusy(null)
    if (res.error) setError(res.error)
    else if (res.en) {
      setEn(res.en)
      setEnStale(false)
      setLang('en')
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    }
  }

  const check = 'h-[16px] w-[16px] shrink-0 accent-[#046C4E] cursor-pointer'
  const segBtn = (active: boolean) =>
    `px-[14px] py-[6px] text-[13px] rounded-[7px] cursor-pointer transition-colors ${
      active
        ? 'bg-white font-semibold text-[#1F2A37] shadow-[0_1px_2px_rgba(16,24,40,0.06)]'
        : 'font-medium text-[#667085] hover:text-[#344054]'
    }`

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* ── 좌: 에디터 ───────────────────────────────── */}
      <div>
        <div className="mb-4 inline-flex rounded-[9px] bg-[#EEF1F3] p-[3px]">
          <button type="button" className={segBtn(tab === 'content')} onClick={() => setTab('content')}>
            콘텐츠 에디터
          </button>
          <button type="button" className={segBtn(tab === 'design')} onClick={() => setTab('design')}>
            🎨 디자이너
          </button>
        </div>

        {tab === 'content' ? (
          <div className="space-y-3">
            {/* 기본 정보 */}
            <Section title="기본 정보" defaultOpen>
              <div className="grid grid-cols-2 gap-2">
                <input
                  className="input"
                  placeholder="이름 (예: Hyunseok Yu)"
                  value={ko.name}
                  onChange={e => edit(d => ({ ...d, name: e.target.value }))}
                />
                <input
                  className="input"
                  placeholder="직함 (예: Full-Stack Engineer)"
                  value={ko.title}
                  onChange={e => edit(d => ({ ...d, title: e.target.value }))}
                />
                <input
                  className="input"
                  placeholder="전화번호"
                  value={ko.phone}
                  onChange={e => edit(d => ({ ...d, phone: e.target.value }))}
                />
                <input className="input bg-[#F7F8FA] text-[#98A2B3]" value={email} readOnly />
              </div>
            </Section>

            {/* 경력 요약 */}
            <Section title="경력 요약" defaultOpen>
              <textarea
                className="input min-h-24"
                placeholder="핵심 경력·강점을 3~5문장으로 적어주세요."
                value={ko.summary}
                onChange={e => edit(d => ({ ...d, summary: e.target.value }))}
              />
            </Section>

            {/* 경력 */}
            <Section title="경력" defaultOpen count={ko.experience.length}>
              <div className="space-y-3">
                {ko.experience.map((exp, i) => (
                  <div
                    key={i}
                    className={`rounded-xl border border-[#ECEEF0] p-3 ${exp.hidden ? 'opacity-50' : ''}`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        className={check}
                        title="이력서에 포함"
                        checked={!exp.hidden}
                        onChange={() =>
                          edit(d => ({
                            ...d,
                            experience: d.experience.map((e, j) =>
                              j === i ? { ...e, hidden: !e.hidden } : e
                            ),
                          }))
                        }
                      />
                      <input
                        className="input flex-1"
                        placeholder="회사명"
                        value={exp.company}
                        onChange={e =>
                          edit(d => ({
                            ...d,
                            experience: d.experience.map((x, j) =>
                              j === i ? { ...x, company: e.target.value } : x
                            ),
                          }))
                        }
                      />
                      <button
                        type="button"
                        className="px-1 text-lg leading-none text-[#B0B7C0] hover:text-red-500"
                        title="삭제"
                        onClick={() =>
                          edit(d => ({ ...d, experience: d.experience.filter((_, j) => j !== i) }))
                        }
                      >
                        ×
                      </button>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <input
                        className="input"
                        placeholder="직무 (예: Senior Developer)"
                        value={exp.position}
                        onChange={e =>
                          edit(d => ({
                            ...d,
                            experience: d.experience.map((x, j) =>
                              j === i ? { ...x, position: e.target.value } : x
                            ),
                          }))
                        }
                      />
                      <input
                        className="input"
                        placeholder="기간 (예: 2020.01 – 2021.04)"
                        value={exp.period}
                        onChange={e =>
                          edit(d => ({
                            ...d,
                            experience: d.experience.map((x, j) =>
                              j === i ? { ...x, period: e.target.value } : x
                            ),
                          }))
                        }
                      />
                    </div>
                    <textarea
                      className="input mt-2 min-h-20 text-[13px]"
                      placeholder={'주요 성과·업무 (한 줄이 bullet 하나가 됩니다)'}
                      value={exp.description}
                      onChange={e =>
                        edit(d => ({
                          ...d,
                          experience: d.experience.map((x, j) =>
                            j === i ? { ...x, description: e.target.value } : x
                          ),
                        }))
                      }
                    />
                  </div>
                ))}
                <button
                  type="button"
                  className="w-full rounded-xl border border-dashed border-[#D0D5DB] py-2 text-sm text-[#667085] hover:border-[#046C4E] hover:text-[#046C4E]"
                  onClick={() => edit(d => ({ ...d, experience: [...d.experience, { ...EMPTY_EXP }] }))}
                >
                  ＋ 경력 추가
                </button>
              </div>
            </Section>

            {/* 학력 */}
            <Section title="학력" count={ko.education.length}>
              <div className="space-y-3">
                {ko.education.map((edu, i) => (
                  <div
                    key={i}
                    className={`rounded-xl border border-[#ECEEF0] p-3 ${edu.hidden ? 'opacity-50' : ''}`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        className={check}
                        title="이력서에 포함"
                        checked={!edu.hidden}
                        onChange={() =>
                          edit(d => ({
                            ...d,
                            education: d.education.map((e, j) =>
                              j === i ? { ...e, hidden: !e.hidden } : e
                            ),
                          }))
                        }
                      />
                      <input
                        className="input flex-1"
                        placeholder="학교명"
                        value={edu.school}
                        onChange={e =>
                          edit(d => ({
                            ...d,
                            education: d.education.map((x, j) =>
                              j === i ? { ...x, school: e.target.value } : x
                            ),
                          }))
                        }
                      />
                      <button
                        type="button"
                        className="px-1 text-lg leading-none text-[#B0B7C0] hover:text-red-500"
                        title="삭제"
                        onClick={() =>
                          edit(d => ({ ...d, education: d.education.filter((_, j) => j !== i) }))
                        }
                      >
                        ×
                      </button>
                    </div>
                    <div className="mt-2 grid grid-cols-3 gap-2">
                      <input
                        className="input"
                        placeholder="전공"
                        value={edu.major}
                        onChange={e =>
                          edit(d => ({
                            ...d,
                            education: d.education.map((x, j) =>
                              j === i ? { ...x, major: e.target.value } : x
                            ),
                          }))
                        }
                      />
                      <input
                        className="input"
                        placeholder="학위 (예: 학사)"
                        value={edu.degree}
                        onChange={e =>
                          edit(d => ({
                            ...d,
                            education: d.education.map((x, j) =>
                              j === i ? { ...x, degree: e.target.value } : x
                            ),
                          }))
                        }
                      />
                      <input
                        className="input"
                        placeholder="기간"
                        value={edu.period}
                        onChange={e =>
                          edit(d => ({
                            ...d,
                            education: d.education.map((x, j) =>
                              j === i ? { ...x, period: e.target.value } : x
                            ),
                          }))
                        }
                      />
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  className="w-full rounded-xl border border-dashed border-[#D0D5DB] py-2 text-sm text-[#667085] hover:border-[#046C4E] hover:text-[#046C4E]"
                  onClick={() => edit(d => ({ ...d, education: [...d.education, { ...EMPTY_EDU }] }))}
                >
                  ＋ 학력 추가
                </button>
              </div>
            </Section>

            {/* 스킬 */}
            <Section title="스킬 & 관심분야" defaultOpen count={ko.skills.length}>
              <div className="mb-3 flex flex-wrap gap-1.5">
                {ko.skills.map(s => {
                  const visible = !ko.hidden_skills.includes(s)
                  return (
                    <label
                      key={s}
                      className={`flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-[5px] text-[13px] transition-colors ${
                        visible
                          ? 'border-[#CEEBDC] bg-white font-medium text-[#1F2A37]'
                          : 'border-[#ECEEF0] bg-[#F7F8FA] text-[#98A2B3]'
                      }`}
                    >
                      <input
                        type="checkbox"
                        className={check}
                        checked={visible}
                        onChange={() =>
                          edit(d => ({
                            ...d,
                            hidden_skills: visible
                              ? [...d.hidden_skills, s]
                              : d.hidden_skills.filter(h => h !== s),
                          }))
                        }
                      />
                      {s}
                      <button
                        type="button"
                        className="text-[#B0B7C0] hover:text-red-500"
                        title="삭제"
                        onClick={e => {
                          e.preventDefault()
                          edit(d => ({
                            ...d,
                            skills: d.skills.filter(x => x !== s),
                            hidden_skills: d.hidden_skills.filter(x => x !== s),
                          }))
                        }}
                      >
                        ×
                      </button>
                    </label>
                  )
                })}
              </div>
              {/* 추가 전용 입력 (자동완성) — 선택된 칩은 위 목록에서 관리 */}
              <SkillChipInput
                value={[]}
                onChange={arr =>
                  edit(d => ({
                    ...d,
                    skills: [...d.skills, ...arr.filter(s => !d.skills.includes(s))],
                  }))
                }
                placeholder="스킬 추가 (입력하면 자동완성)"
              />
            </Section>
          </div>
        ) : (
          /* ── 디자이너 탭 ── */
          <div className="space-y-5 rounded-2xl border border-[#ECEEF0] bg-white p-5">
            <div>
              <div className="mb-2 text-sm font-semibold text-[#344054]">템플릿</div>
              <div className="grid grid-cols-2 gap-3">
                {(
                  [
                    ['classic', '클래식', '좌측 정렬 · 미니멀'],
                    ['modern', '모던', '포인트 밴드 · 중앙 헤더'],
                  ] as const
                ).map(([key, label, desc]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => editDesign({ template: key })}
                    className={`rounded-xl border p-3 text-left transition-colors ${
                      design.template === key
                        ? 'border-[#046C4E] bg-[#ECFDF3]'
                        : 'border-[#ECEEF0] hover:border-[#98A2B3]'
                    }`}
                  >
                    <div className="mb-2 h-14 overflow-hidden rounded-md border border-[#ECEEF0] bg-white p-1.5">
                      {key === 'modern' && <div className="mb-1 h-1 w-full rounded" style={{ background: design.accent }} />}
                      <div className={`h-1.5 w-1/2 rounded bg-[#344054] ${key === 'modern' ? 'mx-auto' : ''}`} />
                      <div className={`mt-1 h-1 w-1/3 rounded ${key === 'modern' ? 'mx-auto' : ''}`} style={{ background: design.accent }} />
                      <div className="mt-1.5 h-1 w-full rounded bg-[#ECEEF0]" />
                      <div className="mt-0.5 h-1 w-5/6 rounded bg-[#ECEEF0]" />
                    </div>
                    <div className="text-[13px] font-semibold text-[#1F2A37]">{label}</div>
                    <div className="text-[11px] text-[#98A2B3]">{desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-2 text-sm font-semibold text-[#344054]">폰트</div>
              <div className="grid grid-cols-3 gap-2">
                {FONTS.map(f => (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => editDesign({ font: f.key })}
                    style={{ fontFamily: f.css }}
                    className={`rounded-lg border py-2.5 text-sm transition-colors ${
                      design.font === f.key
                        ? 'border-[#046C4E] bg-[#ECFDF3] font-semibold text-[#046C4E]'
                        : 'border-[#ECEEF0] text-[#344054] hover:border-[#98A2B3]'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-semibold text-[#344054]">줄 간격</span>
                <span className="font-[family-name:var(--font-plex-mono)] text-[13px] text-[#667085]">
                  {Math.round(design.lineHeight * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={1.4}
                max={2.0}
                step={0.05}
                value={design.lineHeight}
                onChange={e => editDesign({ lineHeight: Number(e.target.value) })}
                className="w-full accent-[#046C4E]"
              />
            </div>

            <div>
              <div className="mb-2 text-sm font-semibold text-[#344054]">포인트 컬러</div>
              <div className="flex gap-2">
                {ACCENTS.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => editDesign({ accent: c })}
                    className={`h-8 w-8 rounded-full border-2 transition-transform ${
                      design.accent === c ? 'scale-110 border-[#1F2A37]' : 'border-transparent'
                    }`}
                    style={{ background: c }}
                    aria-label={c}
                  />
                ))}
              </div>
            </div>

            <p className="text-xs leading-relaxed text-[#98A2B3]">
              디자인 설정은 미리보기와 워크스페이스 이력서 문서에 함께 적용됩니다. 저장을 눌러야 유지돼요.
            </p>
          </div>
        )}
      </div>

      {/* ── 우: 실시간 미리보기 ───────────────────────── */}
      <div className="lg:sticky lg:top-6 lg:self-start">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="inline-flex rounded-[9px] bg-[#EEF1F3] p-[3px]">
            <button type="button" className={segBtn(lang === 'ko')} onClick={() => setLang('ko')}>
              한국어 원본
            </button>
            <button type="button" className={segBtn(lang === 'en')} onClick={() => setLang('en')}>
              영문
            </button>
          </div>
          <div className="flex items-center gap-2">
            {saved && <span className="text-xs text-green-600">✓ 저장됨</span>}
            <button
              type="button"
              onClick={handleSave}
              disabled={busy !== null}
              className="rounded-[9px] border border-[#E2E6EA] bg-white px-4 py-2 text-[13px] font-semibold text-[#344054] hover:bg-[#F4F6F8] disabled:opacity-50"
            >
              {busy === 'save' ? '저장 중...' : '저장'}
            </button>
            <button
              type="button"
              onClick={handleSync}
              disabled={busy !== null}
              className="rounded-[9px] bg-[#046C4E] px-4 py-2 text-[13px] font-semibold text-white hover:bg-[#035A40] disabled:opacity-50"
            >
              {busy === 'sync' ? '동기화 중...' : '✦ 영어로 동기화'}
            </button>
          </div>
        </div>

        {/* 다운로드 — 현재 보고 있는 언어의 이력서 (PDF·DOCX) */}
        {(() => {
          const source = lang === 'en' ? en : ko
          if (!source) return null
          const render = studioToRender(source, email, lang, design.accent)
          const fileBase = `resume_${(source.name || 'resume').replace(/\s+/g, '_')}_${lang}`
          const dl = 'flex items-center gap-1 rounded-[8px] border border-[#E2E6EA] bg-white px-3 py-[6px] text-[12px] font-semibold text-[#475467] hover:bg-[#F4F6F8]'
          return (
            <div className="mb-3 flex items-center gap-1.5">
              <span className="mr-1 text-[12px] text-[#98A2B3]">다운로드</span>
              <button type="button" className={dl} onClick={() => printResumeHtml(renderResumeHtml(render), fileBase)}>PDF</button>
              <button type="button" className={dl} onClick={() => downloadResumeDocx(render, fileBase)}>DOCX</button>
            </div>
          )
        })()}

        {error && <p className="mb-2 text-xs text-red-500">{error}</p>}
        {lang === 'en' && enStale && en && (
          <p className="mb-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
            원본이 수정됐어요. &quot;영어로 동기화&quot;를 누르면 영문판이 갱신됩니다.
          </p>
        )}

        {lang === 'en' && !en ? (
          <div className="flex min-h-64 flex-col items-center justify-center rounded-[14px] border border-dashed border-[#D0D5DB] bg-white p-8 text-center">
            <p className="text-sm text-[#667085]">
              아직 영문판이 없어요.
              <br />
              &quot;영어로 동기화&quot;를 누르면 AI가 영문 이력서를 만들어 드립니다.
            </p>
          </div>
        ) : (
          <PreviewDoc r={lang === 'en' && en ? en : ko} email={email} design={design} />
        )}
      </div>
    </div>
  )
}

// ── 접이식 섹션 ─────────────────────────────────────────
function Section({
  title,
  count,
  defaultOpen = false,
  children,
}: {
  title: string
  count?: number
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="rounded-2xl border border-[#ECEEF0] bg-white">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <span className="text-sm font-semibold text-[#1F2A37]">
          {title}
          {typeof count === 'number' && count > 0 && (
            <span className="ml-2 text-xs font-normal text-[#98A2B3]">{count}</span>
          )}
        </span>
        <span className="text-lg leading-none text-[#B0B7C0]">{open ? '−' : '+'}</span>
      </button>
      {open && <div className="border-t border-[#F0F2F4] px-4 py-4">{children}</div>}
    </div>
  )
}

// ── 이력서 미리보기 문서 ─────────────────────────────────
function PreviewDoc({ r, email, design }: { r: StudioResume; email: string; design: StudioDesign }) {
  const font = FONTS.find(f => f.key === design.font)?.css ?? FONTS[0].css
  const accent = design.accent
  const modern = design.template === 'modern'
  const visibleExp = r.experience.filter(e => !e.hidden)
  const visibleEdu = r.education.filter(e => !e.hidden)
  const visibleSkills = r.skills.filter(s => !r.hidden_skills.includes(s))
  const isEmpty = !r.name && !r.summary && visibleExp.length === 0 && visibleSkills.length === 0

  const label = (text: string) => (
    <div
      className={`mb-3 mt-6 border-b border-[#EEF0F2] pb-1.5 text-[11px] font-semibold uppercase tracking-[0.09em] ${
        modern ? '' : 'text-[#9AA3AD]'
      }`}
      style={modern ? { color: accent } : undefined}
    >
      {text}
    </div>
  )

  return (
    <div
      className="overflow-hidden rounded-[14px] border border-[#ECEEF0] bg-white shadow-[0_2px_14px_rgba(16,24,40,0.04)]"
      style={{ fontFamily: font, lineHeight: design.lineHeight }}
    >
      {modern && <div className="h-[6px] w-full" style={{ background: accent }} />}
      <div className="px-6 py-8 sm:px-10 sm:py-10">
        {isEmpty ? (
          <p className="py-16 text-center text-sm text-[#98A2B3]">
            좌측 에디터에 내용을 입력하면 여기서 바로 미리볼 수 있어요.
          </p>
        ) : (
          <>
            <div className={modern ? 'text-center' : ''}>
              <div className="text-[22px] font-bold tracking-[-0.01em] text-[#101828]">{r.name}</div>
              {r.title && (
                <div className="mt-[2px] text-[14px] font-semibold" style={{ color: accent }}>
                  {r.title}
                </div>
              )}
              <div className="mt-1 font-[family-name:var(--font-plex-mono)] text-[12px] text-[#98A2B3]">
                {email}
                {r.phone ? ` • ${r.phone}` : ''}
              </div>
            </div>

            {r.summary && (
              <>
                {label('Summary')}
                <p className="whitespace-pre-wrap text-[13.5px] text-[#475467]">{r.summary}</p>
              </>
            )}

            {visibleExp.length > 0 && (
              <>
                {label('Work Experience')}
                {visibleExp.map((exp, i) => (
                  <div key={i} className={i > 0 ? 'mt-4' : ''}>
                    <div className="flex items-baseline justify-between gap-2">
                      <div className="text-[14px] font-semibold text-[#1F2A37]">
                        {[exp.company, exp.position].filter(Boolean).join(' — ')}
                      </div>
                      <div className="shrink-0 text-[11.5px] text-[#98A2B3]">{exp.period}</div>
                    </div>
                    <ul className="mt-1.5 list-disc pl-[18px] text-[13px] text-[#475467]">
                      {exp.description
                        .split('\n')
                        .map(l => l.replace(/^[-•\s]+/, '').trim())
                        .filter(Boolean)
                        .map((b, bi) => (
                          <li key={bi}>{b}</li>
                        ))}
                    </ul>
                  </div>
                ))}
              </>
            )}

            {visibleSkills.length > 0 && (
              <>
                {label('Skills')}
                <div className="flex flex-wrap gap-1.5">
                  {visibleSkills.map(s => (
                    <span
                      key={s}
                      className="rounded-[7px] border px-2.5 py-1 text-[12px]"
                      style={{ background: `${accent}0D`, borderColor: `${accent}30`, color: accent }}
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </>
            )}

            {visibleEdu.length > 0 && (
              <>
                {label('Education')}
                {visibleEdu.map((edu, i) => (
                  <div key={i} className={`flex items-baseline justify-between gap-2 ${i > 0 ? 'mt-2' : ''}`}>
                    <div className="text-[13px] font-semibold text-[#1F2A37]">
                      {[edu.school, edu.major, edu.degree].filter(Boolean).join(' · ')}
                    </div>
                    <div className="shrink-0 text-[11.5px] text-[#98A2B3]">{edu.period}</div>
                  </div>
                ))}
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
