'use client'

import { useState } from 'react'

/**
 * 지원 현황 섹션 — 헤더(제목·액션·보드/리스트 토글) + 뷰 본문.
 * 보드/리스트 모두 서버에서 렌더된 노드로 받아 클라이언트에서 표시만 전환한다.
 * (list 미제공 시 = 공개 데모: 보드만 표시)
 */
export default function ApplicationsView({
  header,
  actions,
  boardLabel,
  listLabel,
  board,
  list,
}: {
  header: React.ReactNode
  actions?: React.ReactNode
  boardLabel: string
  listLabel: string
  board: React.ReactNode
  list?: React.ReactNode
}) {
  const [view, setView] = useState<'board' | 'list'>('board')

  const btn = (active: boolean) =>
    `cursor-pointer rounded-[7px] px-[14px] py-[6px] text-[13px] transition-colors ${
      active
        ? 'bg-white font-semibold text-[#1F2A37] shadow-[0_1px_2px_rgba(16,24,40,0.06)]'
        : 'font-medium text-[#667085] hover:text-[#344054]'
    }`

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-3">
        {header}
        <div className="flex items-center gap-3">
          {actions}
          <div className="flex rounded-[9px] bg-[#EEF1F3] p-[3px]">
            <button type="button" className={btn(view === 'board')} onClick={() => setView('board')}>
              {boardLabel}
            </button>
            <button
              type="button"
              className={btn(view === 'list')}
              onClick={() => list && setView('list')}
            >
              {listLabel}
            </button>
          </div>
        </div>
      </div>

      <div className={view === 'board' ? '' : 'hidden'}>{board}</div>
      {list && <div className={view === 'list' ? '' : 'hidden'}>{list}</div>}
    </>
  )
}
