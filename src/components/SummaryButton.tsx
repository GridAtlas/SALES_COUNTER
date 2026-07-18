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
      className="tap-target col-span-3 flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-700 px-3 text-sm font-bold text-white shadow-sm active:bg-slate-800"
      aria-label="集計"
    >
      <BarChart3 size={19} />
      <span>集計</span>
      <span className="num rounded-full bg-white/20 px-2 py-0.5 text-xs">
        {totalCount}
      </span>
    </button>
  );
}
