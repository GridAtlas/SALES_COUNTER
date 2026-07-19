'use client';

import { CalendarDays, FileText, LayoutGrid, Star } from 'lucide-react';

export type HomeView = 'counter' | 'appointments' | 'prospects' | 'reports';

interface Props {
  activeView: HomeView;
  onChange: (view: HomeView) => void;
  appointmentCount: number;
  prospectCount: number;
  reportCount: number;
}

export function ViewTabs({
  activeView,
  onChange,
  appointmentCount,
  prospectCount,
  reportCount,
}: Props) {
  const tabClass = (view: HomeView, activeColor = 'text-stone-700') => [
    'tap-target flex min-w-0 items-center justify-center gap-0.5 rounded-lg px-0.5 text-[9px] font-bold',
    activeView === view
      ? `bg-white ${activeColor} shadow-sm`
      : 'text-stone-500',
  ].join(' ');

  const badge = (count: number) => (
    <span className="num rounded-full bg-amber-100 px-1 py-0.5 text-[8px] text-amber-700">
      {count}
    </span>
  );

  return (
    <div
      className="app-tabs mx-2 mb-1 grid grid-cols-4 rounded-xl bg-stone-200/80 p-1"
      role="tablist"
      aria-label="画面切り替え"
    >
      <button
        type="button"
        role="tab"
        aria-selected={activeView === 'counter'}
        onClick={() => onChange('counter')}
        className={tabClass('counter')}
      >
        <LayoutGrid size={14} />
        カウンター
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={activeView === 'appointments'}
        onClick={() => onChange('appointments')}
        className={tabClass('appointments', 'text-amber-700')}
      >
        <CalendarDays size={14} />
        アポ
        {badge(appointmentCount)}
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={activeView === 'prospects'}
        onClick={() => onChange('prospects')}
        className={tabClass('prospects', 'text-amber-700')}
      >
        <Star size={14} />
        保留／見込
        {badge(prospectCount)}
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={activeView === 'reports'}
        onClick={() => onChange('reports')}
        className={tabClass('reports', 'text-slate-700')}
      >
        <FileText size={14} />
        日報
        {badge(reportCount)}
      </button>
    </div>
  );
}
