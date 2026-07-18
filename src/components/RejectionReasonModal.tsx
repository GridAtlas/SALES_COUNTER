'use client';

import { useState } from 'react';
import { REJECTION_REASONS } from '@/lib/constants';
import type { RejectionReason } from '@/types';

interface Props {
  activityLabel: string;
  onSelect: (reason: RejectionReason, detail?: string) => void;
  onCancel: () => void;
}

export function RejectionReasonModal({
  activityLabel,
  onSelect,
  onCancel,
}: Props) {
  const [showOtherInput, setShowOtherInput] = useState(false);
  const [otherReason, setOtherReason] = useState('');

  const handleReasonClick = (reason: RejectionReason) => {
    if (reason === 'その他') {
      setShowOtherInput(true);
      return;
    }
    onSelect(reason);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="rejection-reason-title"
        className="max-h-[calc(100dvh-2rem)] w-full max-w-sm overflow-y-auto rounded-2xl bg-white p-4 shadow-xl"
      >
        <h2
          id="rejection-reason-title"
          className="text-center text-lg font-bold text-stone-800"
        >
          {activityLabel}の理由
        </h2>
        <p className="mt-1 text-center text-xs text-stone-500">
          拒否理由を選択すると記録されます
        </p>

        <div className="mt-4 grid gap-2">
          {REJECTION_REASONS.map((reason) => (
            <button
              key={reason}
              type="button"
              onClick={() => handleReasonClick(reason)}
              className="tap-target rounded-xl bg-red-50 px-3 py-2 text-sm font-bold text-red-700 active:bg-red-100"
            >
              {reason === 'その他' ? 'その他（自由入力）' : reason}
            </button>
          ))}
        </div>

        {showOtherInput && (
          <div className="mt-3 rounded-xl bg-stone-50 p-3">
            <label
              htmlFor="other-rejection-reason"
              className="block text-xs font-semibold text-stone-600"
            >
              その他の拒否理由
            </label>
            <input
              id="other-rejection-reason"
              type="text"
              value={otherReason}
              onChange={(event) => setOtherReason(event.target.value)}
              maxLength={100}
              autoFocus
              placeholder="理由を入力"
              className="mt-2 min-h-11 w-full rounded-lg border border-stone-300 bg-white px-3 text-base text-stone-700 outline-none focus:border-red-400"
            />
            <button
              type="button"
              onClick={() => onSelect('その他', otherReason.trim())}
              disabled={!otherReason.trim()}
              className="tap-target mt-2 w-full rounded-xl bg-red-500 px-3 py-2 text-sm font-bold text-white active:bg-red-600 disabled:opacity-40"
            >
              この理由で記録
            </button>
          </div>
        )}

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
