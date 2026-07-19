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
  const pressedHouseholds = sessionsFor(
    (activity) => activity.type === 'interphone',
  ).size;
  const noResponsePresses = activities.filter(
    (activity) =>
      activity.type === 'interphone' &&
      activity.interphoneAttemptOutcome === '無応答',
  ).length;

  const stageSessions = (type: ActivityType) =>
    sessionsFor((activity) => activity.type === type);

  const prerequisiteChain: Partial<Record<ActivityType, ActivityType[]>> = {
    interphone_response: ['interphone'],
    face_to_face_contact: ['interphone', 'interphone_response'],
    appointment: ['interphone', 'interphone_response', 'face_to_face_contact'],
    appointment_visit: [
      'interphone',
      'interphone_response',
      'face_to_face_contact',
      'appointment',
    ],
    presentation: [
      'interphone',
      'interphone_response',
      'face_to_face_contact',
      'appointment',
      'appointment_visit',
    ],
    prospect: [
      'interphone',
      'interphone_response',
      'face_to_face_contact',
      'appointment',
      'appointment_visit',
      'presentation',
    ],
    sale: [
      'interphone',
      'interphone_response',
      'face_to_face_contact',
      'appointment',
      'appointment_visit',
      'presentation',
    ],
  };

  const reachedSessions = (type: ActivityType) => {
    const reached = stageSessions(type);
    for (const prerequisite of prerequisiteChain[type] ?? []) {
      const prerequisiteSessions = stageSessions(prerequisite);
      for (const id of reached) {
        if (!prerequisiteSessions.has(id)) reached.delete(id);
      }
    }
    return reached;
  };

  const countOf = (key: AnalysisCountKey) => {
    if (key === 'interphone') return pressedHouseholds;
    if (key === 'face_contact_total') {
      return reachedSessions('face_to_face_contact').size;
    }
    if (key === 'face_contact_initial') {
      const initial = sessionsFor(
        (activity) =>
          activity.type === 'face_to_face_contact' &&
          activity.faceContactKind === '初回',
      );
      const reached = reachedSessions('face_to_face_contact');
      return [...initial].filter((id) => reached.has(id)).length;
    }
    return reachedSessions(key).size;
  };

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
              <p className="text-[10px] text-slate-400">
                実押下 {pressCount}回・無応答 {noResponsePresses}回
              </p>
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
            押下回数以外は同じ世帯セッション内で各段階を1回だけ集計します。自動補完された到達も含みます。
          </p>
        </div>
      </div>
    </div>
  );
}
