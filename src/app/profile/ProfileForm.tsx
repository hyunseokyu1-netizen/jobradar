'use client'

import { useState, useRef } from 'react'
import { saveProfile, uploadResume } from './actions'

interface Profile {
  name: string | null
  skills: string[] | null
  desired_positions: string[] | null
  desired_sources: string[] | null
  desired_locations: string[] | null
  career_summary: string | null
  resume_text: string | null
  preferences: { salary_min?: number; salary_max?: number } | null
}

export default function ProfileForm({ initialData }: { initialData: Profile | null }) {
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<'idle' | 'saved' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

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

      <Field label="스크래핑 소스">
        <div className="flex gap-4">
          {['indeed', 'seek'].map(source => (
            <label key={source} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="desired_sources"
                value={source}
                defaultChecked={initialData?.desired_sources?.includes(source) ?? source === 'indeed'}
                className="w-4 h-4"
              />
              <span className="capitalize">{source}</span>
            </label>
          ))}
        </div>
      </Field>

      <Field label="희망 연봉 (AUD)">
        <div className="flex gap-3 items-center">
          <input
            name="salary_min"
            type="number"
            defaultValue={initialData?.preferences?.salary_min ?? 90000}
            className="input w-36"
          />
          <span className="text-zinc-400">~</span>
          <input
            name="salary_max"
            type="number"
            defaultValue={initialData?.preferences?.salary_max ?? 150000}
            className="input w-36"
          />
        </div>
      </Field>

      <Field label="경력 요약" hint="AI 매칭 및 커버레터에 활용됩니다">
        <textarea
          name="career_summary"
          defaultValue={initialData?.career_summary ?? ''}
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

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-zinc-700 mb-1">
        {label}
        {hint && <span className="ml-2 text-xs text-zinc-400 font-normal">{hint}</span>}
      </label>
      {children}
    </div>
  )
}
