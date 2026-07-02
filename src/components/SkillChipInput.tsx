'use client'

import { useMemo, useRef, useState } from 'react'
import { SKILL_SUGGESTIONS } from '@/lib/skills'

/**
 * 스킬 칩 입력 (자동완성 지원).
 * - 입력하면 카탈로그에서 자동완성 제안, 화살표/Enter 로 선택
 * - Enter·쉼표로 자유 입력도 추가 가능, Backspace 로 마지막 칩 삭제
 * - onSend 를 주면 전송 버튼을 함께 렌더 (온보딩 채팅용),
 *   없으면 순수 컨트롤드 칩 필드로 동작 (프로필 폼용)
 */
export default function SkillChipInput({
  value,
  onChange,
  onSend,
  sendLabel = '전송',
  placeholder = '예: React, TypeScript, AWS',
  disabled = false,
}: {
  value: string[]
  onChange: (skills: string[]) => void
  onSend?: (skills: string[]) => void
  sendLabel?: string
  placeholder?: string
  disabled?: boolean
}) {
  const [text, setText] = useState('')
  const [highlight, setHighlight] = useState(0)
  const [focused, setFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const lowerSelected = useMemo(() => new Set(value.map(s => s.toLowerCase())), [value])

  const matches = useMemo(() => {
    const q = text.trim().toLowerCase()
    if (!q) return []
    // 접두 일치 우선, 그다음 부분 일치 (이미 선택한 스킬 제외)
    const starts: string[] = []
    const includes: string[] = []
    for (const s of SKILL_SUGGESTIONS) {
      const l = s.toLowerCase()
      if (lowerSelected.has(l)) continue
      if (l.startsWith(q)) starts.push(s)
      else if (l.includes(q)) includes.push(s)
    }
    return [...starts, ...includes].slice(0, 8)
  }, [text, lowerSelected])

  function addSkill(raw: string) {
    const items = raw
      .split(',')
      .map(s => s.trim())
      .filter(s => s && !lowerSelected.has(s.toLowerCase()))
    if (items.length) onChange([...value, ...items])
    setText('')
    setHighlight(0)
    inputRef.current?.focus()
  }

  function removeSkill(skill: string) {
    onChange(value.filter(s => s !== skill))
    inputRef.current?.focus()
  }

  // 입력칸에 남은 텍스트까지 포함해 최종 스킬 목록을 만든다 (전송 시 유실 방지)
  function commitAll(): string[] {
    const pending = text
      .split(',')
      .map(s => s.trim())
      .filter(s => s && !lowerSelected.has(s.toLowerCase()))
    const all = [...value, ...pending]
    if (pending.length) onChange(all)
    setText('')
    return all
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown' && matches.length) {
      e.preventDefault()
      setHighlight(h => (h + 1) % matches.length)
    } else if (e.key === 'ArrowUp' && matches.length) {
      e.preventDefault()
      setHighlight(h => (h - 1 + matches.length) % matches.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (matches.length && text.trim()) {
        addSkill(matches[Math.min(highlight, matches.length - 1)])
      } else if (text.trim()) {
        addSkill(text)
      } else if (onSend && value.length) {
        onSend(value)
      }
    } else if (e.key === ',') {
      e.preventDefault()
      if (text.trim()) addSkill(text)
    } else if (e.key === 'Backspace' && !text && value.length) {
      removeSkill(value[value.length - 1])
    } else if (e.key === 'Escape') {
      setText('')
    }
  }

  return (
    <div className="flex w-full items-end gap-2">
      <div className="relative min-w-0 flex-1">
        {/* 자동완성 드롭다운 (입력칸 위) */}
        {focused && matches.length > 0 && (
          <div className="absolute bottom-full left-0 z-30 mb-1 w-full overflow-hidden rounded-[10px] border border-[#ECEEF0] bg-white py-1 shadow-[0_8px_24px_rgba(16,24,40,0.12)]">
            {matches.map((s, i) => (
              <button
                key={s}
                type="button"
                // blur 전에 선택되도록 mousedown 사용
                onMouseDown={e => { e.preventDefault(); addSkill(s) }}
                onMouseEnter={() => setHighlight(i)}
                className={`block w-full px-3 py-[7px] text-left text-[13px] ${
                  i === highlight ? 'bg-[#ECFDF3] text-[#046C4E] font-semibold' : 'text-[#344054]'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <div
          onClick={() => inputRef.current?.focus()}
          className={`flex min-h-[42px] w-full cursor-text flex-wrap items-center gap-1.5 rounded-xl border bg-white px-3 py-2 transition-colors ${
            focused ? 'border-[#046C4E] ring-2 ring-[#046C4E]/10' : 'border-[#E2E6EA]'
          } ${disabled ? 'bg-[#F4F6F8]' : ''}`}
        >
          {value.map(s => (
            <span
              key={s}
              className="flex items-center gap-1 rounded-md bg-[#ECFDF3] px-2 py-[3px] text-[12px] font-semibold text-[#046C4E]"
            >
              {s}
              <button
                type="button"
                onClick={() => removeSkill(s)}
                disabled={disabled}
                className="text-[#046C4E]/60 hover:text-[#046C4E]"
                aria-label={`${s} 삭제`}
              >
                ×
              </button>
            </span>
          ))}
          <input
            ref={inputRef}
            value={text}
            onChange={e => { setText(e.target.value); setHighlight(0) }}
            onKeyDown={handleKeyDown}
            onFocus={() => setFocused(true)}
            onBlur={() => {
              setFocused(false)
              // 입력하다 만 텍스트도 칩으로 커밋 (폼 제출 시 유실 방지)
              if (text.trim()) addSkill(text)
            }}
            disabled={disabled}
            placeholder={value.length === 0 ? placeholder : ''}
            className="min-w-[120px] flex-1 border-none bg-transparent py-[2px] text-sm outline-none placeholder:text-[#98A2B3] disabled:text-[#98A2B3]"
          />
        </div>
      </div>

      {onSend && (
        <button
          type="button"
          onClick={() => {
            const all = commitAll()
            if (all.length) onSend(all)
          }}
          disabled={disabled || (value.length === 0 && !text.trim())}
          className="whitespace-nowrap rounded-xl bg-[#046C4E] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#035A40] disabled:opacity-40"
        >
          {sendLabel}
        </button>
      )}
    </div>
  )
}
