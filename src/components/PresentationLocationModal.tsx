'use client';

import { PRESENTATION_LOCATIONS } from '@/lib/constants';
import type { PresentationLocation } from '@/types';

interface Props {
  onSelect: (location: PresentationLocation) => void;
  onCancel: () => void;
}

export function PresentationLocationModal({ onSelect, onCancel }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="presentation-location-title"
        className="w-full max-w-sm rounded-2xl bg-white p-4 shadow-xl"
      >
        <h2
          id="presentation-location-title"
          className="text-center text-lg font-bold text-stone-800"
        >
          プレゼン場所
        </h2>
        <p className="mt-1 text-center text-xs text-stone-500">
          場所を選択すると記録されます
        </p>

        <div className="mt-4 grid grid-cols-3 gap-2">
          {PRESENTATION_LOCATIONS.map((location) => (
            <button
              key={location}
              type="button"
              onClick={() => onSelect(location)}
              className="tap-target rounded-xl bg-orange-50 px-2 py-3 text-sm font-bold text-orange-700 active:bg-orange-100"
            >
              {location}
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
