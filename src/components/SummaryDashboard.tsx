'use client';

import { useMemo, useState } from 'react';
import { CalendarDays, Pencil, Target, X } from 'lucide-react';
import { countFaceContacts } from '@/lib/contact';
import {
  emptySummaryTargets,
  type SummaryMetricKey,
  type SummaryPeriod,
  type SummaryTargets,
  useSummaryTargetStore,
} from '@/store/useSummaryTargetStore';
import type { Activity } from '@/types';

interface Props {
  activities: Activity[];
  hydrated: boolean;
}

interface Metric {
  key: SummaryMetricKey;
  shortLabel: string;
  label: string;
}

interface SummarySection {
  period: SummaryPeriod;
  title: string;
  rangeLabel: string;
  activities: Activity[];
}

const METRICS: Metric[] = [
  { key: 'knock', shortLabel: 'K', label: '押下' },
  { key: 'interphone', shortLabel: 'I', label: '応答' },
  { key: 'contact', shortLabel: 'C', label: '対面接触' },
  { key: 'appointment', shortLabel: 'A', label: 'アポ取得' },
  { key: 'scheduledAppointment', shortLabel: 'A予', label: '予定アポ' },
  { key: 'appointmentVisit', shortLabel: 'A訪', label: 'アポ訪問' },
  { key: 'presentation', shortLabel: 'P', label: 'プレゼン' },
  { key: 'sale', shortLabel: 'S', label: '成約' },
];

const japanDateFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Asia/Tokyo',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const dateKey = (timestamp: number) => {
  const parts = japanDateFormatter.formatToParts(new Date(timestamp));
  const valueOf = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? '';
  return `${valueOf('year')}-${valueOf('month')}-${valueOf('day')}`;
};

const shiftDate = (date: string, days: number) => {
  const [year, month, day] = date.split('-').map(Number);
  const shifted = new Date(Date.UTC(year, month - 1, day + days));
  return [
    shifted.getUTCFullYear(),
    String(shifted.getUTCMonth() + 1).padStart(2, '0'),
    String(shifted.getUTCDate()).padStart(2, '0'),
  ].join('-');
};

const weekStart = (date: string) => {
  const [year, month, day] = date.split('-').map(Number);
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return shiftDate(date, -((weekday + 6) % 7));
};

const shortDate = (date: string) => {
  const [, month, day] = date.split('-');
  return `${Number(month)}/${Number(day)}`;
};

const countMetrics = (activities: Activity[]): Record<SummaryMetricKey, number> => ({
  knock: activities.filter((activity) => activity.type === 'interphone').length,
  interphone: activities.filter((activity) => activity.type === 'interphone_response')
    .length,
  contact: countFaceContacts(activities),
  appointment: activities.filter((activity) => activity.type === 'appointment').length,
  scheduledAppointment: activities.filter(
    (activity) =>
      activity.type === 'appointment' && activity.appointmentCategory === '予定アポ',
  ).length,
  appointmentVisit: activities.filter((activity) => activity.type === 'appointment_visit')
    .length,
  presentation: activities.filter((activity) => activity.type === 'presentation').length,
  sale: activities.filter((activity) => activity.type === 'sale').length,
});

const rate = (current: number, previous: number | undefined) => {
  if (previous === undefined || previous === 0) return '—';
  return `${Math.round((current / previous) * 100)}%`;
};

function TargetEditor({ onClose }: { onClose: () => void }) {
  const targets = useSummaryTargetStore((state) => state.targets);
  const setTargets = useSummaryTargetStore((state) => state.setTargets);
  const [draft, setDraft] = useState<Record<SummaryPeriod, SummaryTargets>>(() => ({
    daily: { ...targets.daily },
    weekly: { ...targets.weekly },
    monthly: { ...targets.monthly },
  }));

  const update = (period: SummaryPeriod, key: SummaryMetricKey, value: string) => {
    const parsed = value === '' ? null : Math.max(0, Number.parseInt(value, 10) || 0);
    setDraft((current) => ({
      ...current,
      [period]: { ...current[period], [key]: parsed },
    }));
  };

  const save = () => {
    setTargets('daily', draft.daily);
    setTargets('weekly', draft.weekly);
    setTargets('monthly', draft.monthly);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-3">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="summary-target-title"
        className="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-slate-50 shadow-xl"
      >
        <header className="flex items-center border-b border-slate-200 bg-white px-4 py-3">
          <div>
            <h2 id="summary-target-title" className="text-lg font-bold text-slate-800">目標値を設定</h2>
            <p className="text-xs text-slate-500">空欄の項目は目標未設定として表示されます</p>
          </div>
          <button type="button" onClick={onClose} className="tap-target ml-auto grid place-items-center rounded-xl text-slate-500 active:bg-slate-100" aria-label="目標設定を閉じる">
            <X size={22} />
          </button>
        </header>
        <div className="overflow-auto p-3">
          {(['daily', 'weekly', 'monthly'] as SummaryPeriod[]).map((period) => (
            <section key={period} className="mb-3 rounded-xl border border-slate-200 bg-white p-3 last:mb-0">
              <h3 className="mb-2 text-sm font-bold text-slate-700">{period === 'daily' ? '日次目標' : period === 'weekly' ? '週次目標' : '月次目標'}</h3>
              <div className="grid grid-cols-4 gap-2">
                {METRICS.map((metric) => (
                  <label key={metric.key} className="min-w-0 text-center text-[10px] font-bold text-slate-500">
                    {metric.shortLabel}
                    <input
                      type="number"
                      inputMode="numeric"
                      min="0"
                      value={draft[period][metric.key] ?? ''}
                      onChange={(event) => update(period, metric.key, event.target.value)}
                      aria-label={`${period} ${metric.label}の目標値`}
                      className="num mt-1 block w-full rounded-lg border border-slate-300 px-1 py-2 text-center text-base font-bold text-slate-800"
                    />
                  </label>
                ))}
              </div>
            </section>
          ))}
        </div>
        <footer className="border-t border-slate-200 bg-white p-3">
          <button type="button" onClick={save} className="tap-target w-full rounded-xl bg-cyan-700 px-3 py-2 text-sm font-bold text-white active:bg-cyan-800">保存する</button>
        </footer>
      </section>
    </div>
  );
}

export function SummaryDashboard({ activities, hydrated }: Props) {
  const [selectedDate, setSelectedDate] = useState(() => dateKey(Date.now()));
  const [editingTargets, setEditingTargets] = useState(false);
  const targets = useSummaryTargetStore((state) => state.targets);
  const sections = useMemo<SummarySection[]>(() => {
    const monday = weekStart(selectedDate);
    const sunday = shiftDate(monday, 6);
    const monthStart = `${selectedDate.slice(0, 8)}01`;
    const source = activities.filter(
      (activity) => activity.recordSource !== 'historical_confirmation',
    );
    const inRange = (start: string) =>
      source.filter((activity) => {
        const activityDate = dateKey(activity.timestamp);
        return activityDate >= start && activityDate <= selectedDate;
      });
    return [
      { period: 'daily', title: 'daily 進捗', rangeLabel: shortDate(selectedDate), activities: inRange(selectedDate) },
      { period: 'weekly', title: 'weekly 進捗', rangeLabel: `${shortDate(monday)}〜${shortDate(sunday)}`, activities: inRange(monday) },
      { period: 'monthly', title: 'monthly 進捗', rangeLabel: `${shortDate(monthStart)}〜${shortDate(selectedDate)}`, activities: inRange(monthStart) },
    ];
  }, [activities, selectedDate]);

  return (
    <main className="flex-1 overflow-y-auto px-3 pb-4">
      <div className="mb-3 flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/90 p-3 shadow-sm">
        <CalendarDays size={18} className="shrink-0 text-cyan-700" />
        <label className="min-w-0 flex-1">
          <span className="sr-only">集計基準日</span>
          <input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} className="num w-full bg-transparent text-sm font-bold text-slate-700 outline-none" />
        </label>
        <button type="button" onClick={() => setEditingTargets(true)} className="tap-target flex shrink-0 items-center gap-1 rounded-xl bg-orange-100 px-2 text-xs font-bold text-orange-800 active:bg-orange-200" aria-label="目標値を設定">
          <Target size={16} /> 目標
        </button>
      </div>

      {!hydrated ? (
        <div className="py-10 text-center text-sm text-slate-400">集計を読み込んでいます…</div>
      ) : (
        <div className="space-y-3">
          {sections.map((section) => {
            const actual = countMetrics(section.activities);
            const target = targets[section.period] ?? emptySummaryTargets();
            return (
              <section key={section.period} className="overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-sm">
                <header className="grid grid-cols-[minmax(0,1fr)_auto] border-b-2 border-slate-700">
                  <h2 className="bg-orange-300 px-3 py-2 text-center text-xl font-black tracking-tight text-slate-900">{section.title}</h2>
                  <p className="num flex min-w-24 items-center justify-center bg-slate-200 px-3 text-sm font-black text-slate-800">{section.rangeLabel}</p>
                </header>
                <div className="overflow-hidden">
                  <table className="summary-table w-full table-fixed border-collapse text-center">
                    <thead>
                      <tr>
                        <th scope="col" className="w-9 bg-slate-300 text-[10px] text-slate-600">項目</th>
                        {METRICS.map((metric) => <th key={metric.key} scope="col" title={metric.label} className="whitespace-nowrap bg-slate-300 px-0.5 py-2 text-base font-black text-slate-900">{metric.shortLabel}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <th scope="row" className="bg-slate-200 text-xs font-bold text-slate-700">目標</th>
                        {METRICS.map((metric) => <td key={metric.key} className="num truncate px-0.5 text-sm font-bold text-slate-700">{target[metric.key] ?? '—'}</td>)}
                      </tr>
                      <tr>
                        <th scope="row" className="bg-slate-200 text-xs font-bold text-slate-700">実績</th>
                        {METRICS.map((metric) => <td key={metric.key} className="num truncate px-0.5 text-base font-black text-cyan-800">{actual[metric.key]}</td>)}
                      </tr>
                      <tr>
                        <th scope="row" className="bg-slate-200 text-xs font-bold text-slate-700">移行率</th>
                        {METRICS.map((metric, index) => <td key={metric.key} className="num truncate px-0.5 text-[10px] font-bold text-slate-600">{rate(actual[metric.key], index === 0 ? undefined : actual[METRICS[index - 1].key])}</td>)}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>
            );
          })}
        </div>
      )}
      <p className="mt-3 px-1 text-[10px] leading-relaxed text-slate-500">K: 押下 / I: 応答 / C: 対面接触 / A: アポ取得 / A予: 予定アポ / A訪: アポ訪問 / P: プレゼン / S: 成約。移行率は左の項目に対する実績比です。</p>
      {editingTargets && <TargetEditor onClose={() => setEditingTargets(false)} />}
    </main>
  );
}
