'use client';

import { useState } from 'react';
import { MapPin, Menu, X } from 'lucide-react';

interface Props {
  gpsEnabled: boolean;
  onGpsEnabledChange: (enabled: boolean) => void;
}

export function Header({ gpsEnabled, onGpsEnabledChange }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="app-header relative flex items-center justify-between px-4">
      <h1 className="text-lg font-bold text-stone-700">SALES COUNTER</h1>
      <button
        type="button"
        onClick={() => setMenuOpen(true)}
        className="tap-target grid place-items-center rounded-xl text-stone-600 active:bg-stone-200"
        aria-label="メニューを開く"
        aria-expanded={menuOpen}
      >
        <Menu size={24} />
      </button>

      {menuOpen && (
        <>
          <button
            type="button"
            onClick={() => setMenuOpen(false)}
            className="fixed inset-0 z-40 cursor-default bg-slate-950/20"
            aria-label="メニューを閉じる"
          />
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="settings-title"
            className="absolute right-3 top-full z-50 mt-1 w-[min(20rem,calc(100vw-1.5rem))] rounded-2xl border border-stone-200 bg-white p-3 shadow-xl"
          >
            <div className="flex items-center">
              <h2 id="settings-title" className="text-base font-bold text-stone-800">
                設定
              </h2>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="tap-target ml-auto grid place-items-center rounded-xl text-stone-500 active:bg-stone-100"
                aria-label="設定を閉じる"
              >
                <X size={20} />
              </button>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={gpsEnabled}
              aria-label="GPSを有効にする"
              onClick={() => onGpsEnabledChange(!gpsEnabled)}
              className="tap-target mt-2 flex w-full items-center gap-3 rounded-xl bg-stone-50 p-3 text-left active:bg-stone-100"
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-white text-sky-600 shadow-sm">
                <MapPin size={19} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold text-stone-700">
                  GPSを有効にする
                </span>
                <span className="block text-[10px] text-stone-500">
                  活動ボタン押下時に現在地を記録
                </span>
              </span>
              <span
                aria-hidden="true"
                className={[
                  'relative h-6 w-11 shrink-0 rounded-full transition-colors',
                  gpsEnabled ? 'bg-sky-600' : 'bg-stone-300',
                ].join(' ')}
              >
                <span
                  className={[
                    'absolute top-0.5 size-5 rounded-full bg-white shadow-sm transition-transform',
                    gpsEnabled ? 'translate-x-[22px]' : 'translate-x-0.5',
                  ].join(' ')}
                />
              </span>
            </button>
            <p className="mt-2 px-1 text-[10px] text-stone-400">
              初期設定はOFFです。変更はこの端末に保存されます。
            </p>
          </section>
        </>
      )}
    </header>
  );
}
