'use client';

import { FileText } from 'lucide-react';

interface Props {
  reportCount: number;
  onTap: () => void;
}

export function DailyReportButton({ reportCount, onTap }: Props) {
  return (
    <button
      type="button"
      onClick={onTap}
      className="counter-action-button tap-target flex flex-col items-center justify-center rounded-xl bg-slate-700 px-1 py-0 text-white shadow-sm active:bg-slate-800"
      aria-label="日報確認"
    >
      <FileText
        size={22}
        strokeWidth={2.2}
        className="counter-action-icon"
      />
      <span className="counter-action-label whitespace-nowrap font-semibold">
        日報確認
      </span>
      <span className="counter-action-note font-bold">
        保存済み {reportCount}
      </span>
    </button>
  );
}
