'use client';

import Link from 'next/link';
import { History, Undo2, RotateCcw } from 'lucide-react';

interface Props {
  disableUndo: boolean;
  onUndo: () => void;
  onReset: () => void;
}

export function BottomBar({ disableUndo, onUndo, onReset }: Props) {
  return (
    <div className="mt-auto grid grid-cols-3 gap-2 p-3 border-t border-stone-200 bg-white/80 backdrop-blur">
      <button
        type="button"
        onClick={onUndo}
        disabled={disableUndo}
        className="tap-target flex flex-col items-center gap-1 rounded-xl py-2 text-stone-600 active:bg-stone-100 disabled:opacity-40"
        aria-label="ひとつ戻す"
      >
        <Undo2 size={20} />
        <span className="text-xs font-semibold">戻す</span>
      </button>

      <Link
        href="/history/"
        className="tap-target flex flex-col items-center gap-1 rounded-xl py-2 text-stone-600 active:bg-stone-100"
        aria-label="履歴"
      >
        <History size={20} />
        <span className="text-xs font-semibold">履歴</span>
      </Link>

      <button
        type="button"
        onClick={() => {
          if (confirm('カウンターをリセットしますか？（履歴も全て削除）')) {
            onReset();
          }
        }}
        className="tap-target flex flex-col items-center gap-1 rounded-xl py-2 text-rose-600 active:bg-rose-50"
        aria-label="リセット"
      >
        <RotateCcw size={20} />
        <span className="text-xs font-semibold">リセット</span>
      </button>
    </div>
  );
}
