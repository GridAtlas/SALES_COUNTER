'use client';

import { ChartNoAxesCombined } from 'lucide-react';

interface Props {
  onTap: () => void;
}

export function AnalysisButton({ onTap }: Props) {
  return (
    <button
      type="button"
      onClick={onTap}
      className="counter-action-button tap-target flex flex-col items-center justify-center rounded-xl bg-cyan-700 px-1 py-0 text-white shadow-sm active:bg-cyan-800"
      aria-label="分析"
    >
      <ChartNoAxesCombined
        size={22}
        strokeWidth={2.2}
        className="counter-action-icon"
      />
      <span className="counter-action-label whitespace-nowrap font-semibold">
        分析
      </span>
      <span className="counter-action-note font-bold">営業ファネル</span>
    </button>
  );
}
