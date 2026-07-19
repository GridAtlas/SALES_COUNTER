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
      className="tap-target flex h-12 flex-col items-center justify-center rounded-xl bg-rose-600 px-1 py-0 text-white shadow-sm active:bg-rose-700 disabled:opacity-40"
      aria-label="活動終了"
    >
      <Power size={17} strokeWidth={2.2} />
      <span className="whitespace-nowrap text-[11px] font-semibold leading-tight">
        活動終了
      </span>
      <span className="text-[10px] font-bold leading-none">日報保存</span>
    </button>
  );
}
