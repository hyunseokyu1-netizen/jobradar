'use client'

import { useState } from 'react'

/**
 * 보기/숨기기 토글이 달린 비밀번호 입력.
 * className은 기존 input 스타일을 그대로 전달받고, 우측에 눈 아이콘 버튼을 얹는다.
 */
export default function PasswordInput({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  const [show, setShow] = useState(false)

  return (
    <div className="relative">
      <input {...props} type={show ? 'text' : 'password'} className={`${className ?? ''} pr-10`} />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setShow(s => !s)}
        aria-label={show ? '비밀번호 숨기기' : '비밀번호 보기'}
        title={show ? '비밀번호 숨기기' : '비밀번호 보기'}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#98A2B3] transition-colors hover:text-[#475467]"
      >
        {show ? (
          // eye-off
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
            <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
            <path d="M6.61 6.61A13.53 13.53 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
            <path d="m2 2 20 20" />
          </svg>
        ) : (
          // eye
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </button>
    </div>
  )
}
