'use client';

import { BarChart3 } from 'lucide-react';

interface Props {
  totalCount: number;
  onTap: () => void;
}

export function SummaryButton({ totalCount, onTap }: Props) {
  return (
    <button
      type="button"
      onClick={onTap}
      className="counter-action-button tap-target flex flex-col items-center justify-center rounded-xl bg-slate-700 px-1 py-0 text-white shadow-sm active:bg-slate-800"
      aria-label="集計"
    >
      <BarChart3 size={22} strokeWidth={2.2} className="counter-action-icon" />
      <span className="counter-action-label whitespace-nowrap font-semibold">
        集計
      </span>
      <span className="counter-action-count num font-bold">{totalCount}</span>
    </button>
  );
}
