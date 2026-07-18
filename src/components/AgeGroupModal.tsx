'use client';

import { AGE_GROUPS } from '@/lib/constants';
import type { AgeGroup } from '@/types';

interface Props {
  contactLabel: string;
  onSelect: (ageGroup: AgeGroup) => void;
  onCancel: () => void;
}

export function AgeGroupModal({ contactLabel, onSelect, onCancel }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="age-group-title"
        className="w-full max-w-sm rounded-2xl bg-white p-4 shadow-xl"
      >
        <h2 id="age-group-title" className="text-center text-lg font-bold text-stone-800">
          {contactLabel}の年代
        </h2>
        <p className="mt-1 text-center text-xs text-stone-500">
          年代を選択すると記録されます
        </p>

        <div className="mt-4 grid grid-cols-3 gap-2">
          {AGE_GROUPS.map((ageGroup) => (
            <button
              key={ageGroup}
              type="button"
              onClick={() => onSelect(ageGroup)}
              className="tap-target rounded-xl bg-sky-50 px-2 py-3 text-sm font-bold text-sky-700 active:bg-sky-100"
            >
              {ageGroup}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="tap-target mt-3 w-full rounded-xl bg-stone-100 px-3 py-2 text-sm font-semibold text-stone-600 active:bg-stone-200"
        >
          キャンセル
        </button>
      </div>
    </div>
  );
}
