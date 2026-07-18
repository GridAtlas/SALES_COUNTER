'use client';

import { CalendarDays, LayoutGrid } from 'lucide-react';

export type HomeView = 'counter' | 'appointments';

interface Props {
  activeView: HomeView;
  onChange: (view: HomeView) => void;
  appointmentCount: number;
}

export function ViewTabs({ activeView, onChange, appointmentCount }: Props) {
  return (
    <div
      className="mx-2 mb-1 grid grid-cols-2 rounded-xl bg-stone-200/80 p-1"
      role="tablist"
      aria-label="画面切り替え"
    >
      <button
        type="button"
        role="tab"
        aria-selected={activeView === 'counter'}
        onClick={() => onChange('counter')}
        className={[
          'tap-target flex items-center justify-center gap-1.5 rounded-lg px-2 text-xs font-bold',
          activeView === 'counter'
            ? 'bg-white text-stone-700 shadow-sm'
            : 'text-stone-500',
        ].join(' ')}
      >
        <LayoutGrid size={16} />
        カウンター
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={activeView === 'appointments'}
        onClick={() => onChange('appointments')}
        className={[
          'tap-target flex items-center justify-center gap-1.5 rounded-lg px-2 text-xs font-bold',
          activeView === 'appointments'
            ? 'bg-white text-amber-700 shadow-sm'
            : 'text-stone-500',
        ].join(' ')}
      >
        <CalendarDays size={16} />
        アポ一覧
        <span className="num rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] text-amber-700">
          {appointmentCount}
        </span>
      </button>
    </div>
  );
}
