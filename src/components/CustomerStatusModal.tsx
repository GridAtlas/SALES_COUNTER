'use client';

import type { CustomerStatus } from '@/types';

const CUSTOMER_STATUSES: CustomerStatus[] = ['新規', '既加入'];

interface Props {
  onSelect: (customerStatus: CustomerStatus) => void;
  onCancel: () => void;
}

export function CustomerStatusModal({ onSelect, onCancel }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="customer-status-title"
        className="w-full max-w-sm rounded-2xl bg-white p-4 shadow-xl"
      >
        <h2 id="customer-status-title" className="text-center text-lg font-bold text-stone-800">
          インターホン種別
        </h2>
        <p className="mt-1 text-center text-xs text-stone-500">
          新規または既加入を選択してください
        </p>

        <div className="mt-4 grid grid-cols-2 gap-3">
          {CUSTOMER_STATUSES.map((customerStatus) => (
            <button
              key={customerStatus}
              type="button"
              onClick={() => onSelect(customerStatus)}
              className="tap-target rounded-xl bg-slate-100 px-3 py-4 text-base font-bold text-slate-700 active:bg-slate-200"
            >
              {customerStatus}
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
