'use client';

import { CalendarDays, LayoutGrid, Star } from 'lucide-react';

export type HomeView = 'counter' | 'appointments' | 'prospects';

interface Props {
  activeView: HomeView;
  onChange: (view: HomeView) => void;
  appointmentCount: number;
  prospectCount: number;
}

export function ViewTabs({
  activeView,
  onChange,
  appointmentCount,
  prospectCount,
}: Props) {
  return (
    <div
      className="mx-2 mb-1 grid grid-cols-3 rounded-xl bg-stone-200/80 p-1"
      role="tablist"
      aria-label="画面切り替え"
    >
      <button
        type="button"
        role="tab"
        aria-selected={activeView === 'counter'}
        onClick={() => onChange('counter')}
        className={[
          'tap-target flex items-center justify-center gap-1 rounded-lg px-1 text-[10px] font-bold',
          activeView === 'counter'
            ? 'bg-white text-stone-700 shadow-sm'
            : 'text-stone-500',
        ].join(' ')}
      >
        <LayoutGrid size={15} />
        カウンター
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={activeView === 'appointments'}
        onClick={() => onChange('appointments')}
        className={[
          'tap-target flex items-center justify-center gap-1 rounded-lg px-1 text-[10px] font-bold',
          activeView === 'appointments'
            ? 'bg-white text-amber-700 shadow-sm'
            : 'text-stone-500',
        ].join(' ')}
      >
        <CalendarDays size={15} />
        アポ
        <span className="num rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] text-amber-700">
          {appointmentCount}
        </span>
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={activeView === 'prospects'}
        onClick={() => onChange('prospects')}
        className={[
          'tap-target flex items-center justify-center gap-1 rounded-lg px-1 text-[10px] font-bold',
          activeView === 'prospects'
            ? 'bg-white text-amber-700 shadow-sm'
            : 'text-stone-500',
        ].join(' ')}
      >
        <Star size={15} />
        保留／見込
        <span className="num rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] text-amber-700">
          {prospectCount}
        </span>
      </button>
    </div>
  );
}
