'use client';

import { X } from 'lucide-react';
import { ACTIVITIES } from '@/lib/constants';
import { countFaceContacts } from '@/lib/contact';
import type { Activity, ActivityDef } from '@/types';

interface Props {
  activities: Activity[];
  onClose: () => void;
}

const movementActivities = ACTIVITIES.slice(0, 6);
const salesActivities = ACTIVITIES.slice(6);

export function SummaryModal({ activities, onClose }: Props) {
  const countOf = (def: ActivityDef) =>
    def.type === 'face_to_face_contact'
      ? countFaceContacts(activities)
      : activities.filter((activity) => activity.type === def.type).length;
  const sectionTotal = (defs: ActivityDef[]) =>
    defs.reduce((sum, def) => sum + countOf(def), 0);

  const sections = [
    { title: '移動・休憩', defs: movementActivities },
    { title: '営業活動', defs: salesActivities },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-3">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="summary-title"
        className="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-sm flex-col overflow-hidden rounded-2xl bg-slate-50 shadow-xl"
      >
        <header className="flex items-center border-b border-slate-200 bg-white px-4 py-3">
          <div>
            <h2 id="summary-title" className="text-lg font-bold text-slate-800">
              カウント集計
            </h2>
            <p className="text-xs text-slate-500">現在保存されている活動件数</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="tap-target ml-auto grid place-items-center rounded-xl text-slate-500 active:bg-slate-100"
            aria-label="集計画面を閉じる"
          >
            <X size={22} />
          </button>
        </header>

        <div className="overflow-y-auto p-3">
          <div className="grid grid-cols-3 gap-2">
            <SummaryTotal label="合計" count={activities.length} emphasized />
            <SummaryTotal label="移動・休憩" count={sectionTotal(movementActivities)} />
            <SummaryTotal label="営業活動" count={sectionTotal(salesActivities)} />
          </div>

          {sections.map(({ title, defs }) => (
            <section key={title} className="mt-3">
              <h3 className="mb-1 px-1 text-xs font-bold text-slate-500">
                🔲 {title}
              </h3>
              <div className="grid grid-cols-2 gap-1.5">
                {defs.map((def) => (
                  <div
                    key={def.type}
                    className="flex min-w-0 items-center rounded-lg border border-slate-200 bg-white px-2 py-1.5"
                  >
                    <span className="min-w-0 flex-1 truncate text-[11px] font-semibold text-slate-600">
                      {def.label}
                    </span>
                    <span className="num ml-2 text-base font-bold text-slate-800">
                      {countOf(def)}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

function SummaryTotal({
  label,
  count,
  emphasized = false,
}: {
  label: string;
  count: number;
  emphasized?: boolean;
}) {
  return (
    <div
      className={[
        'rounded-xl px-2 py-2 text-center',
        emphasized ? 'bg-slate-700 text-white' : 'bg-white text-slate-700 shadow-sm',
      ].join(' ')}
    >
      <p className="truncate text-[10px] font-semibold opacity-75">{label}</p>
      <p className="num mt-0.5 text-xl font-bold leading-none">{count}</p>
    </div>
  );
}
