'use client';

import { X } from 'lucide-react';
import type { Activity, ActivityType } from '@/types';

interface Props {
  activities: Activity[];
  onClose: () => void;
}

interface AnalysisMetric {
  label: string;
  description: string;
  numerator: ActivityType;
  denominator: ActivityType;
}

const FUNNEL_STEPS: { type: ActivityType; shortLabel: string }[] = [
  { type: 'interphone', shortLabel: 'インターホン' },
  { type: 'interphone_response', shortLabel: '応答' },
  { type: 'first_contact', shortLabel: '新規接触' },
  { type: 'appointment', shortLabel: 'アポ取得' },
  { type: 'appointment_visit', shortLabel: 'アポ訪問' },
  { type: 'presentation', shortLabel: 'プレゼン' },
  { type: 'sale', shortLabel: '成約' },
];

const METRICS: AnalysisMetric[] = [
  {
    label: 'インターホン応答率',
    description: '応答 ÷ インターホン',
    numerator: 'interphone_response',
    denominator: 'interphone',
  },
  {
    label: '新規接触化率',
    description: '新規接触 ÷ 応答',
    numerator: 'first_contact',
    denominator: 'interphone_response',
  },
  {
    label: '新規→アポ取得率',
    description: 'アポ取得 ÷ 新規接触',
    numerator: 'appointment',
    denominator: 'first_contact',
  },
  {
    label: 'アポ訪問率',
    description: 'アポ訪問 ÷ アポ取得',
    numerator: 'appointment_visit',
    denominator: 'appointment',
  },
  {
    label: '訪問→プレゼン率',
    description: 'プレゼン ÷ アポ訪問',
    numerator: 'presentation',
    denominator: 'appointment_visit',
  },
  {
    label: 'プレゼン→成約率',
    description: '成約 ÷ プレゼン',
    numerator: 'sale',
    denominator: 'presentation',
  },
  {
    label: 'プレゼン→見込率',
    description: '保留／見込 ÷ プレゼン',
    numerator: 'prospect',
    denominator: 'presentation',
  },
  {
    label: '新規→成約率',
    description: '成約 ÷ 新規接触',
    numerator: 'sale',
    denominator: 'first_contact',
  },
];

export function AnalysisModal({ activities, onClose }: Props) {
  const countOf = (type: ActivityType) =>
    activities.filter((activity) => activity.type === type).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-3">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="analysis-title"
        className="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-sm flex-col overflow-hidden rounded-2xl bg-slate-50 shadow-xl"
      >
        <header className="flex items-center border-b border-slate-200 bg-white px-4 py-3">
          <div>
            <h2 id="analysis-title" className="text-lg font-bold text-slate-800">
              営業分析
            </h2>
            <p className="text-xs text-slate-500">現在保存されている活動から算出</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="tap-target ml-auto grid place-items-center rounded-xl text-slate-500 active:bg-slate-100"
            aria-label="分析画面を閉じる"
          >
            <X size={22} />
          </button>
        </header>

        <div className="overflow-y-auto p-3">
          <section>
            <h3 className="mb-1.5 px-1 text-xs font-bold text-slate-500">
              営業ファネル
            </h3>
            <div className="grid grid-cols-4 gap-1.5">
              {FUNNEL_STEPS.map((step) => (
                <div
                  key={step.type}
                  className="min-w-0 rounded-lg bg-slate-700 px-0.5 py-2 text-center text-white"
                >
                  <p className="truncate text-[9px] font-semibold opacity-80">
                    {step.shortLabel}
                  </p>
                  <p className="num mt-1 text-lg font-bold leading-none">
                    {countOf(step.type)}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-3">
            <h3 className="mb-1.5 px-1 text-xs font-bold text-slate-500">
              コンバージョン率
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {METRICS.map((metric) => {
                const numerator = countOf(metric.numerator);
                const denominator = countOf(metric.denominator);
                const rate = denominator > 0 ? (numerator / denominator) * 100 : null;

                return (
                  <div
                    key={metric.label}
                    className="rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm"
                  >
                    <p className="truncate text-[11px] font-bold text-slate-700">
                      {metric.label}
                    </p>
                    <div className="mt-1 flex items-end justify-between gap-2">
                      <p className="num text-2xl font-bold leading-none text-cyan-700">
                        {rate === null ? '—' : `${rate.toFixed(1)}%`}
                      </p>
                      <p className="num whitespace-nowrap text-[10px] font-semibold text-slate-500">
                        {numerator} / {denominator}
                      </p>
                    </div>
                    <p className="mt-1 truncate text-[9px] text-slate-400">
                      {metric.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>

          <p className="mt-3 px-1 text-[10px] leading-relaxed text-slate-400">
            各率はボタンの累計件数から算出します。活動ごとの関連付けは行わないため、入力順や期間によって100%を超える場合があります。
          </p>
        </div>
      </div>
    </div>
  );
}
