'use client'

import { useState } from 'react'
import { GlobeMark, ChevronDown, Search } from '../ui/icons'

/**
 * 히어로 검색바. 현재는 시각 표현 + 로컬 입력만.
 * 클라이언트 컴포넌트이므로 딕셔너리 전체가 아닌 문자열 props 만 받는다.
 * size: 'md'(랜딩 A) / 'lg'(랜딩 B 중앙 강조).
 * TODO(api): 국가 셀렉트/검색어로 공고 검색 연동.
 */
export default function SearchBar({
  country,
  placeholder,
  buttonLabel,
  size = 'md',
}: {
  country: string
  placeholder: string
  buttonLabel: string
  size?: 'md' | 'lg'
}) {
  const [query, setQuery] = useState('')

  function handleSearch() {
    // TODO(api): 검색 실행 → /matchda/dashboard?q=... 또는 검색 결과 페이지로 라우팅
  }

  const lg = size === 'lg'

  return (
    <div
      className={
        lg
          ? 'mx-auto flex max-w-[580px] items-center gap-[6px] rounded-[16px] border border-[#E2E6EA] bg-white p-2 shadow-[0_12px_36px_rgba(16,24,40,0.10)]'
          : 'flex max-w-[528px] items-center gap-[6px] rounded-[14px] border border-[#E2E6EA] bg-white p-[7px] shadow-[0_6px_24px_rgba(16,24,40,0.07)]'
      }
    >
      <button
        type="button"
        className={`flex items-center gap-[7px] whitespace-nowrap text-[14px] font-medium text-[#344054] ${
          lg ? 'px-[14px] py-[11px]' : 'px-3 py-[10px]'
        }`}
      >
        <GlobeMark size={16} strokeWidth={1.8} className="text-[#046C4E]" />
        {country}
        <ChevronDown size={14} className="text-[#98A2B3]" />
      </button>
      <div className={`w-px bg-[#E5E8EB] ${lg ? 'h-[26px]' : 'h-6'}`} />
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        placeholder={placeholder}
        className={`min-w-0 flex-1 bg-transparent text-[#111827] outline-none placeholder:text-[#98A2B3] ${
          lg ? 'px-2 text-[16px]' : 'px-[6px] text-[15px]'
        }`}
      />
      <button
        type="button"
        onClick={handleSearch}
        className={`flex items-center gap-[7px] bg-[#046C4E] font-semibold text-white hover:bg-[#035A40] ${
          lg ? 'rounded-[11px] px-[22px] py-[13px] text-[15px]' : 'rounded-[9px] px-[18px] py-[11px] text-[14px]'
        }`}
      >
        <Search size={lg ? 17 : 16} className="text-white" />
        {buttonLabel}
      </button>
    </div>
  )
}
