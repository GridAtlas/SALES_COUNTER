'use client';

import { useState, type FormEvent } from 'react';

interface Props {
  onSave: (comment: string) => void;
  onCancel: () => void;
}

export function CommentModal({ onSave, onCancel }: Props) {
  const [comment, setComment] = useState('');

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = comment.trim();
    if (!value) return;
    onSave(value);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
      <form
        onSubmit={handleSubmit}
        role="dialog"
        aria-modal="true"
        aria-labelledby="comment-title"
        className="w-full max-w-sm rounded-2xl bg-white p-4 shadow-xl"
      >
        <h2
          id="comment-title"
          className="text-center text-lg font-bold text-stone-800"
        >
          コメント
        </h2>
        <p className="mt-1 text-center text-xs text-stone-500">
          現在時刻と一緒に当日ログへ記録します
        </p>

        <label className="mt-4 block text-xs font-semibold text-stone-600">
          内容
          <textarea
            autoFocus
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            maxLength={500}
            rows={4}
            placeholder="状況や引き継ぎ事項など"
            className="mt-1 w-full resize-none rounded-xl border border-stone-300 bg-white p-3 text-base text-stone-700"
          />
        </label>

        <button
          type="submit"
          disabled={!comment.trim()}
          className="tap-target mt-3 w-full rounded-xl bg-indigo-500 px-3 py-2 text-sm font-bold text-white active:bg-indigo-600 disabled:opacity-40"
        >
          コメントを記録
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
