'use client';

import { Power } from 'lucide-react';

interface Props {
  disabled: boolean;
  onTap: () => void;
}

export function ActivityEndButton({ disabled, onTap }: Props) {
  return (
    <button
      type="button"
      onClick={onTap}
      disabled={disabled}
      className="counter-action-button tap-target flex flex-col items-center justify-center rounded-xl bg-rose-600 px-1 py-0 text-white shadow-sm active:bg-rose-700 disabled:opacity-40"
      aria-label="活動終了"
    >
      <Power size={22} strokeWidth={2.2} className="counter-action-icon" />
      <span className="counter-action-label whitespace-nowrap font-semibold">
        活動終了
      </span>
      <span className="counter-action-note font-bold">日報保存</span>
    </button>
  );
}
