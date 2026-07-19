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
      className="tap-target flex h-12 flex-col items-center justify-center rounded-xl bg-slate-700 px-1 py-0 text-white shadow-sm active:bg-slate-800"
      aria-label="集計"
    >
      <BarChart3 size={17} strokeWidth={2.2} />
      <span className="whitespace-nowrap text-[11px] font-semibold leading-tight">
        集計
      </span>
      <span className="num text-base font-bold leading-none">{totalCount}</span>
    </button>
  );
}
