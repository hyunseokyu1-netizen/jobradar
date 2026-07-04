'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updatePersonalInfo, changePassword } from './actions'

const inputCls =
  'w-full rounded-lg border border-[#ECEEF0] px-3 py-2.5 text-sm outline-none transition-colors focus:border-[#046C4E] placeholder:text-[#D0D5DB]'
const labelCls = 'mb-1 block text-xs font-medium text-[#667085]'
const btnCls =
  'rounded-lg bg-[#046C4E] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#035A40] disabled:opacity-50'

/** 개인정보(이름·전화번호) 수정 폼 */
export function PersonalInfoForm({ name, phone }: { name: string; phone: string }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    setMsg(null)
    const res = await updatePersonalInfo(new FormData(e.currentTarget))
    setBusy(false)
    if (res.error) setMsg({ ok: false, text: res.error })
    else {
      setMsg({ ok: true, text: '저장됐어요.' })
      router.refresh()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls}>이름</label>
          <input name="name" defaultValue={name} placeholder="이름" className={inputCls} disabled={busy} />
        </div>
        <div>
          <label className={labelCls}>전화번호</label>
          <input name="phone" defaultValue={phone} placeholder="+61 400 000 000" className={inputCls} disabled={busy} />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button type="submit" disabled={busy} className={btnCls}>
          {busy ? '저장 중…' : '저장'}
        </button>
        {msg && (
          <span className={`text-xs ${msg.ok ? 'text-[#046C4E]' : 'text-red-500'}`}>{msg.text}</span>
        )}
      </div>
    </form>
  )
}

/** 비밀번호 변경 폼 (이메일 가입 유저 전용) */
export function PasswordForm() {
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (busy) return
    const form = e.currentTarget
    setBusy(true)
    setMsg(null)
    const res = await changePassword(new FormData(form))
    setBusy(false)
    if (res.error) setMsg({ ok: false, text: res.error })
    else {
      setMsg({ ok: true, text: '비밀번호가 변경됐어요.' })
      form.reset()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className={labelCls}>현재 비밀번호</label>
        <input
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          required
          className={inputCls}
          disabled={busy}
        />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls}>새 비밀번호 (8자 이상)</label>
          <input
            name="newPassword"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
            className={inputCls}
            disabled={busy}
          />
        </div>
        <div>
          <label className={labelCls}>새 비밀번호 확인</label>
          <input
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
            className={inputCls}
            disabled={busy}
          />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button type="submit" disabled={busy} className={btnCls}>
          {busy ? '변경 중…' : '비밀번호 변경'}
        </button>
        {msg && (
          <span className={`text-xs ${msg.ok ? 'text-[#046C4E]' : 'text-red-500'}`}>{msg.text}</span>
        )}
      </div>
    </form>
  )
}
