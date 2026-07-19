'use client';

import { X } from 'lucide-react';
import type { Activity, ActivityType } from '@/types';

interface Props {
  activities: Activity[];
  onClose: () => void;
}

type AnalysisCountKey =
  | ActivityType
  | 'face_contact_total'
  | 'face_contact_initial';

interface AnalysisMetric {
  label: string;
  description: string;
  numerator: AnalysisCountKey;
  denominator: AnalysisCountKey;
}

const FUNNEL_STEPS: { key: AnalysisCountKey; shortLabel: string }[] = [
  { key: 'interphone', shortLabel: '押下' },
  { key: 'interphone_response', shortLabel: '応答' },
  { key: 'face_contact_total', shortLabel: '対面接触' },
  { key: 'appointment', shortLabel: 'アポ取得' },
  { key: 'appointment_visit', shortLabel: 'アポ訪問' },
  { key: 'presentation', shortLabel: 'プレゼン' },
  { key: 'sale', shortLabel: '成約' },
];

const METRICS: AnalysisMetric[] = [
  { label: 'インターホン応答率', description: '応答世帯 ÷ 押下世帯', numerator: 'interphone_response', denominator: 'interphone' },
  { label: '対面接触化率', description: '対面接触世帯 ÷ 応答世帯', numerator: 'face_contact_total', denominator: 'interphone_response' },
  { label: '初回→アポ取得率', description: 'アポ取得世帯 ÷ 初回対面世帯', numerator: 'appointment', denominator: 'face_contact_initial' },
  { label: 'アポ訪問率', description: 'アポ訪問世帯 ÷ アポ取得世帯', numerator: 'appointment_visit', denominator: 'appointment' },
  { label: '訪問→プレゼン率', description: 'プレゼン世帯 ÷ アポ訪問世帯', numerator: 'presentation', denominator: 'appointment_visit' },
  { label: 'プレゼン→成約率', description: '成約世帯 ÷ プレゼン世帯', numerator: 'sale', denominator: 'presentation' },
  { label: 'プレゼン→見込率', description: '保留／見込世帯 ÷ プレゼン世帯', numerator: 'prospect', denominator: 'presentation' },
  { label: '初回→成約率', description: '成約世帯 ÷ 初回対面世帯', numerator: 'sale', denominator: 'face_contact_initial' },
];

const sessionKey = (activity: Activity) =>
  activity.sessionId ?? 'legacy-' + activity.id;

export function AnalysisModal({ activities, onClose }: Props) {
  const sessionsFor = (predicate: (activity: Activity) => boolean) =>
    new Set(activities.filter(predicate).map(sessionKey));

  const pressCount = activities.filter(
    (activity) => activity.type === 'interphone',
  ).length;
  const noResponsePresses = activities.filter(
    (activity) =>
      activity.type === 'interphone' &&
      activity.interphoneAttemptOutcome === '無応答',
  ).length;

  const sessionsForKey = (key: AnalysisCountKey) => {
    if (key === 'face_contact_total') {
      return sessionsFor(
        (activity) => activity.type === 'face_to_face_contact',
      );
    }
    if (key === 'face_contact_initial') {
      return sessionsFor(
        (activity) =>
          activity.type === 'face_to_face_contact' &&
          activity.faceContactKind === '初回',
      );
    }
    return sessionsFor((activity) => activity.type === key);
  };

  const countOf = (key: AnalysisCountKey) => sessionsForKey(key).size;

  const currentPresentationSessions = sessionsForKey('presentation');
  const carryoverSales = [...sessionsForKey('sale')].filter((id) => !currentPresentationSessions.has(id)).length;

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
            <p className="text-xs text-slate-500">世帯セッションごとの到達状況</p>
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
            <div className="mb-1.5 flex items-end justify-between px-1">
              <h3 className="text-xs font-bold text-slate-500">営業ファネル</h3>
              <div className="text-right text-[10px] text-slate-400">
                <p>実押下 {pressCount}回・無応答 {noResponsePresses}回</p>
                {carryoverSales > 0 && (
                  <p>前日以前からの持越し成約 {carryoverSales}件</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {FUNNEL_STEPS.map((step) => (
                <div
                  key={step.key}
                  className="min-w-0 rounded-lg bg-slate-700 px-0.5 py-2 text-center text-white"
                >
                  <p className="truncate text-[9px] font-semibold opacity-80">
                    {step.shortLabel}
                  </p>
                  <p className="num mt-1 text-lg font-bold leading-none">
                    {countOf(step.key)}
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
                const denominatorSessions = sessionsForKey(
                  metric.denominator,
                );
                const numerator = [
                  ...sessionsForKey(metric.numerator),
                ].filter((id) => denominatorSessions.has(id)).length;
                const denominator = denominatorSessions.size;
                const rate =
                  denominator > 0
                    ? (numerator / denominator) * 100
                    : null;
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
                        {rate === null ? '—' : rate.toFixed(1) + '%'}
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
            同じ世帯セッション内の各段階は1回だけ集計します。前日以前からの持越しは当日の率計算から除外します。
          </p>
        </div>
      </div>
    </div>
  );
}
