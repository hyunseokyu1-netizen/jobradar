'use client'

import { useState, useRef } from 'react'
import { saveProfile, uploadResume, generateCareerSummary } from './actions'

const CURRENCIES = [
  { code: 'AUD', label: 'AUD — 호주달러' },
  { code: 'USD', label: 'USD — 달러' },
  { code: 'EUR', label: 'EUR — 유로' },
  { code: 'KRW', label: 'KRW — 원화' },
  { code: 'JPY', label: 'JPY — 엔화' },
  { code: 'NZD', label: 'NZD — 뉴질랜드달러' },
  { code: 'GBP', label: 'GBP — 파운드' },
  { code: 'SGD', label: 'SGD — 싱가포르달러' },
]

interface Profile {
  name: string | null
  skills: string[] | null
  desired_positions: string[] | null
  desired_sources: string[] | null
  desired_locations: string[] | null
  career_summary: string | null
  resume_text: string | null
  preferences: { salary_min?: number; salary_max?: number; salary_currency?: string } | null
}

export default function ProfileForm({ initialData }: { initialData: Profile | null }) {
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<'idle' | 'saved' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const [summaryGenerating, setSummaryGenerating] = useState(false)
  const [summaryValue, setSummaryValue] = useState(initialData?.career_summary ?? '')
  const [resumeUploading, setResumeUploading] = useState(false)
  const [resumeStatus, setResumeStatus] = useState<'idle' | 'done' | 'error'>('idle')
  const [resumeError, setResumeError] = useState('')
  const [resumePreview, setResumePreview] = useState(initialData?.resume_text ?? '')
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleSubmit(formData: FormData) {
    setSaving(true)
    setStatus('idle')
    const result = await saveProfile(formData)
    setSaving(false)
    if (result.error) {
      setStatus('error')
      setErrorMsg(result.error)
    } else {
      setStatus('saved')
      setTimeout(() => setStatus('idle'), 3000)
    }
  }

  async function handleResumeUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setResumeUploading(true)
    setResumeStatus('idle')
    const fd = new FormData()
    fd.append('resume', file)
    const result = await uploadResume(fd)
    setResumeUploading(false)
    if (result.error) {
      setResumeStatus('error')
      setResumeError(result.error)
    } else {
      setResumeStatus('done')
      setResumePreview(result.text ?? '')
    }
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleGenerateSummary() {
    setSummaryGenerating(true)
    const result = await generateCareerSummary()
    setSummaryGenerating(false)
    if (result.error) alert(result.error)
    else if (result.summary) setSummaryValue(result.summary)
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      <Field label="이름">
        <input
          name="name"
          defaultValue={initialData?.name ?? ''}
          className="input"
          placeholder="Hyunseok Yu"
        />
      </Field>

      <Field label="스킬" hint="쉼표로 구분">
        <textarea
          name="skills"
          defaultValue={initialData?.skills?.join(', ') ?? ''}
          className="input min-h-24"
          placeholder="Node.js, React Native, TypeScript, ..."
        />
      </Field>

      <Field label="원하는 포지션" hint="쉼표로 구분 (스크래핑 키워드)">
        <textarea
          name="desired_positions"
          defaultValue={initialData?.desired_positions?.join(', ') ?? ''}
          className="input min-h-20"
          placeholder="React Native developer, Fullstack developer, ..."
        />
      </Field>

      <Field label="원하는 지역" hint="쉼표로 구분">
        <input
          name="desired_locations"
          defaultValue={initialData?.desired_locations?.join(', ') ?? ''}
          className="input"
          placeholder="Sydney NSW, Melbourne VIC, Auckland"
        />
      </Field>

      <Field label="희망 연봉">
        <div className="flex gap-3 items-center">
          <select
            name="salary_currency"
            defaultValue={initialData?.preferences?.salary_currency ?? 'AUD'}
            className="input w-44 shrink-0"
          >
            {CURRENCIES.map(c => (
              <option key={c.code} value={c.code}>{c.label}</option>
            ))}
          </select>
          <input
            name="salary_min"
            type="number"
            defaultValue={initialData?.preferences?.salary_min ?? ''}
            className="input flex-1 min-w-0"
            placeholder="최소"
          />
          <span className="text-zinc-400 shrink-0">~</span>
          <input
            name="salary_max"
            type="number"
            defaultValue={initialData?.preferences?.salary_max ?? ''}
            className="input flex-1 min-w-0"
            placeholder="최대"
          />
        </div>
      </Field>

      <Field
        label="경력 요약"
        hint="AI 매칭 및 커버레터에 활용됩니다"
        action={
          <button
            type="button"
            onClick={handleGenerateSummary}
            disabled={summaryGenerating}
            className="text-xs text-blue-500 hover:text-blue-700 disabled:opacity-50 transition-colors"
          >
            {summaryGenerating ? '생성 중...' : '✦ AI 자동 입력'}
          </button>
        }
      >
        <textarea
          name="career_summary"
          value={summaryValue}
          onChange={e => setSummaryValue(e.target.value)}
          className="input min-h-28"
          placeholder="10+ years backend/fullstack experience..."
        />
      </Field>

      <Field label="이력서 업로드" hint="PDF 또는 DOCX · 최대 5MB">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <label className={`cursor-pointer inline-flex items-center gap-2 text-sm border border-zinc-300 rounded-lg px-4 py-2 hover:bg-zinc-50 transition-colors ${resumeUploading ? 'opacity-50 pointer-events-none' : ''}`}>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx"
                className="hidden"
                onChange={handleResumeUpload}
                disabled={resumeUploading}
              />
              {resumeUploading ? '파싱 중...' : '파일 선택'}
            </label>
            {resumeStatus === 'done' && <span className="text-sm text-green-600">✓ 추출 완료</span>}
            {resumeStatus === 'error' && <span className="text-sm text-red-500">{resumeError}</span>}
          </div>
          {resumePreview && (
            <textarea
              readOnly
              value={resumePreview}
              className="input min-h-36 text-xs text-zinc-500 bg-zinc-50 resize-y"
            />
          )}
        </div>
      </Field>

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={saving}
          className="bg-zinc-900 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-zinc-700 disabled:opacity-50 transition-colors"
        >
          {saving ? '저장 중...' : '저장'}
        </button>
        {status === 'saved' && <span className="text-sm text-green-600">✓ 저장됐습니다</span>}
        {status === 'error' && <span className="text-sm text-red-500">오류: {errorMsg}</span>}
      </div>
    </form>
  )
}

function Field({ label, hint, action, children }: { label: string; hint?: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-sm font-medium text-zinc-700">
          {label}
          {hint && <span className="ml-2 text-xs text-zinc-400 font-normal">{hint}</span>}
        </label>
        {action}
      </div>
      {children}
    </div>
  )
}
