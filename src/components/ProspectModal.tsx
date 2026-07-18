'use client';

import { useState, type FormEvent } from 'react';
import { Star } from 'lucide-react';
import { PROSPECT_RATINGS } from '@/lib/constants';
import type { ProspectRating } from '@/types';

interface Props {
  onSave: (rating: ProspectRating, comment?: string) => void;
  onCancel: () => void;
}

export function ProspectModal({ onSave, onCancel }: Props) {
  const [rating, setRating] = useState<ProspectRating | null>(null);
  const [comment, setComment] = useState('');

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!rating) return;
    onSave(rating, comment.trim() || undefined);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
      <form
        onSubmit={handleSubmit}
        role="dialog"
        aria-modal="true"
        aria-labelledby="prospect-title"
        className="w-full max-w-sm rounded-2xl bg-white p-4 shadow-xl"
      >
        <h2
          id="prospect-title"
          className="text-center text-lg font-bold text-stone-800"
        >
          保留／見込
        </h2>
        <p className="mt-1 text-center text-xs text-stone-500">
          見込度を星1〜5で選択してください
        </p>

        <div
          className="mt-4 flex justify-center gap-2"
          role="radiogroup"
          aria-label="見込度"
        >
          {PROSPECT_RATINGS.map((value) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={rating === value}
              aria-label={`見込度${value}`}
              onClick={() => setRating(value)}
              className="tap-target flex items-center justify-center rounded-xl bg-amber-50 text-amber-500 active:bg-amber-100"
            >
              <Star
                size={28}
                fill={rating && value <= rating ? 'currentColor' : 'none'}
                strokeWidth={2}
              />
            </button>
          ))}
        </div>
        <p className="mt-2 text-center text-sm font-bold text-amber-700">
          見込度：{rating ?? 0} / 5
        </p>

        <label className="mt-3 block text-xs font-semibold text-stone-600">
          コメント（任意）
          <textarea
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            maxLength={200}
            rows={3}
            placeholder="次回対応やお客様の反応など"
            className="mt-1 w-full resize-none rounded-xl border border-stone-300 bg-white p-3 text-base text-stone-700"
          />
        </label>

        <button
          type="submit"
          disabled={!rating}
          className="tap-target mt-3 w-full rounded-xl bg-amber-500 px-3 py-2 text-sm font-bold text-white active:bg-amber-600 disabled:opacity-40"
        >
          保留／見込を記録
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="tap-target mt-2 w-full rounded-xl bg-stone-100 px-3 py-2 text-sm font-semibold text-stone-600 active:bg-stone-200"
        >
          キャンセル
        </button>
      </form>
    </div>
  );
}
