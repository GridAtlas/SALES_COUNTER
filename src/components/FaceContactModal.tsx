'use client';

import { useState } from 'react';
import { AGE_GROUPS } from '@/lib/constants';
import type { AgeGroup } from '@/types';

interface Props {
  onSave: (ageGroup: AgeGroup) => void;
  onCancel: () => void;
}

export function FaceContactModal({ onSave, onCancel }: Props) {
  const [ageGroup, setAgeGroup] = useState<AgeGroup | null>(null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-3">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="face-contact-title"
        className="max-h-[calc(100dvh-1.5rem)] w-full max-w-sm overflow-y-auto rounded-2xl bg-white p-4 shadow-xl"
      >
        <h2
          id="face-contact-title"
          className="text-center text-lg font-bold text-stone-800"
        >
          対面接触
        </h2>
        <p className="mt-1 text-center text-xs text-stone-500">
          年代を選択してください
        </p>

        <fieldset className="mt-4">
          <legend className="text-xs font-bold text-stone-600">年代</legend>
          <div className="mt-1.5 grid grid-cols-3 gap-2">
            {AGE_GROUPS.map((group) => (
              <button
                key={group}
                type="button"
                aria-pressed={ageGroup === group}
                onClick={() => setAgeGroup(group)}
                className={[
                  'tap-target rounded-xl px-1 py-2 text-sm font-bold',
                  ageGroup === group
                    ? 'bg-sky-600 text-white'
                    : 'bg-sky-50 text-sky-700 active:bg-sky-100',
                ].join(' ')}
              >
                {group}
              </button>
            ))}
          </div>
        </fieldset>

        <button
          type="button"
          disabled={!ageGroup}
          onClick={() => {
            if (ageGroup) {
              onSave(ageGroup);
            }
          }}
          className="tap-target mt-4 w-full rounded-xl bg-sky-600 px-3 py-2 text-sm font-bold text-white active:bg-sky-700 disabled:opacity-40"
        >
          対面接触を記録
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="tap-target mt-2 w-full rounded-xl bg-stone-100 px-3 py-2 text-sm font-semibold text-stone-600 active:bg-stone-200"
        >
          キャンセル
        </button>
      </div>
    </div>
  );
}
