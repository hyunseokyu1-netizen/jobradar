'use client'

import { useState } from 'react'
import { saveProfile } from './actions'

interface Profile {
  name: string | null
  skills: string[] | null
  desired_positions: string[] | null
  desired_sources: string[] | null
  desired_locations: string[] | null
  career_summary: string | null
  preferences: { salary_min?: number; salary_max?: number } | null
}

export default function ProfileForm({ initialData }: { initialData: Profile | null }) {
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleSubmit(formData: FormData) {
    setSaving(true)
    setSaved(false)
    await saveProfile(formData)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      {/* 이름 */}
      <Field label="이름">
        <input
          name="name"
          defaultValue={initialData?.name ?? ''}
          className="input"
          placeholder="Hyunseok Yu"
        />
      </Field>

      {/* 스킬 */}
      <Field label="스킬" hint="쉼표로 구분">
        <textarea
          name="skills"
          defaultValue={initialData?.skills?.join(', ') ?? ''}
          className="input min-h-24"
          placeholder="Node.js, React Native, TypeScript, ..."
        />
      </Field>

      {/* 원하는 포지션 */}
      <Field label="원하는 포지션" hint="쉼표로 구분 (스크래핑 키워드)">
        <textarea
          name="desired_positions"
          defaultValue={initialData?.desired_positions?.join(', ') ?? ''}
          className="input min-h-20"
          placeholder="React Native developer, Fullstack developer, ..."
        />
      </Field>

      {/* 원하는 지역 */}
      <Field label="원하는 지역" hint="쉼표로 구분">
        <input
          name="desired_locations"
          defaultValue={initialData?.desired_locations?.join(', ') ?? ''}
          className="input"
          placeholder="Sydney NSW, Melbourne VIC, Auckland"
        />
      </Field>

      {/* 소스 */}
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

      {/* 연봉 */}
      <Field label="희망 연봉 (AUD)">
        <div className="flex gap-3 items-center">
          <input
            name="salary_min"
            type="number"
            defaultValue={initialData?.preferences?.salary_min ?? 90000}
            className="input w-36"
            placeholder="90000"
          />
          <span className="text-zinc-400">~</span>
          <input
            name="salary_max"
            type="number"
            defaultValue={initialData?.preferences?.salary_max ?? 150000}
            className="input w-36"
            placeholder="150000"
          />
        </div>
      </Field>

      {/* 경력 요약 */}
      <Field label="경력 요약" hint="AI 매칭 및 커버레터에 활용됩니다">
        <textarea
          name="career_summary"
          defaultValue={initialData?.career_summary ?? ''}
          className="input min-h-28"
          placeholder="10+ years backend/fullstack experience..."
        />
      </Field>

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={saving}
          className="bg-zinc-900 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-zinc-700 disabled:opacity-50 transition-colors"
        >
          {saving ? '저장 중...' : '저장'}
        </button>
        {saved && <span className="text-sm text-green-600">✓ 저장됐습니다</span>}
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
