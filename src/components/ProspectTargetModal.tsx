'use client';

import { Star } from 'lucide-react';
import type { Activity } from '@/types';

interface Props {
  prospects: Activity[];
  onSelect: (prospect: Activity) => void;
  onNewPresentation: () => void;
  onCancel: () => void;
}

const recordedAt = (timestamp: number) =>
  new Intl.DateTimeFormat('ja-JP', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(timestamp));

export function ProspectTargetModal({
  prospects,
  onSelect,
  onNewPresentation,
  onCancel,
}: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-3">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="prospect-target-title"
        className="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-sm flex-col overflow-hidden rounded-2xl bg-white shadow-xl"
      >
        <header className="border-b border-stone-100 px-4 py-3 text-center">
          <h2 id="prospect-target-title" className="text-lg font-bold text-stone-800">
            成約した見込を選択
          </h2>
          <p className="mt-0.5 text-xs text-stone-500">
            未成約の保留／見込だけを表示しています
          </p>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          {prospects.length > 0 ? (
            <div className="space-y-2">
              {prospects.map((prospect) => (
                <button
                  key={prospect.id}
                  type="button"
                  onClick={() => onSelect(prospect)}
                  className="tap-target flex w-full items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-left active:bg-amber-100"
                >
                  <Star size={18} fill="currentColor" className="mt-0.5 shrink-0 text-amber-500" aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold text-stone-700">
                      見込度 {prospect.prospectRating ?? 0} / 5
                    </span>
                    <span className="mt-0.5 block text-xs text-stone-500">
                      {recordedAt(prospect.timestamp)}
                      {prospect.prospectComment ? ` ・ ${prospect.prospectComment}` : ''}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <p className="rounded-xl bg-stone-50 px-3 py-5 text-center text-sm text-stone-500">
              未成約の保留／見込はありません
            </p>
          )}
        </div>

        <div className="border-t border-stone-100 p-3">
          <button
            type="button"
            onClick={onNewPresentation}
            className="tap-target w-full rounded-xl bg-orange-500 px-3 py-2 text-sm font-bold text-white active:bg-orange-600"
          >
            新規プレゼンへ切り替え
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
    </div>
  );
}
