'use client';

import { useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { FUNNEL_STAGE_ORDER, reachedStageIndex } from '@/lib/session';
import type { Activity, ActivityType, FunnelStage } from '@/types';

interface Props {
  activities: Activity[];
  onClose: () => void;
}

type AnalysisCountKey =
  | ActivityType
  | 'face_contact_total'
  | 'face_contact_initial';

type AnalysisPeriod = 'today' | '7days' | '30days' | 'all' | 'custom';

interface AnalysisMetric {
  label: string;
  description: string;
  numerator: AnalysisCountKey;
  denominator: AnalysisCountKey;
}

const PERIOD_OPTIONS: { value: AnalysisPeriod; label: string }[] = [
  { value: 'today', label: '今日' },
  { value: '7days', label: '7日' },
  { value: '30days', label: '30日' },
  { value: 'all', label: '全期間' },
  { value: 'custom', label: '指定' },
];

const FUNNEL_STEPS: { key: FunnelStage; shortLabel: string }[] = [
  { key: 'interphone', shortLabel: '押下' },
  { key: 'interphone_response', shortLabel: '応答' },
  { key: 'face_to_face_contact', shortLabel: '対面接触' },
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

const localDateInputValue = (timestamp: number) => {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const periodBounds = (
  period: AnalysisPeriod,
  now: number,
  customStart: string,
  customEnd: string,
) => {
  if (period === 'all') {
    return { startAt: Number.NEGATIVE_INFINITY, endAt: now };
  }
  if (period === 'custom') {
    const startAt = new Date(`${customStart}T00:00:00`).getTime();
    const selectedEnd = new Date(`${customEnd}T23:59:59.999`).getTime();
    if (!Number.isNaN(startAt) && !Number.isNaN(selectedEnd)) {
      return {
        startAt,
        endAt: Math.min(selectedEnd, now),
      };
    }
  }
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  if (period === '7days') start.setDate(start.getDate() - 6);
  if (period === '30days') start.setDate(start.getDate() - 29);
  return { startAt: start.getTime(), endAt: now };
};

export function AnalysisModal({ activities, onClose }: Props) {
  const [period, setPeriod] = useState<AnalysisPeriod>('today');
  const now = Date.now();
  const today = localDateInputValue(now);
  const [customStart, setCustomStart] = useState(today);
  const [customEnd, setCustomEnd] = useState(today);
  const { startAt, endAt } = periodBounds(
    period,
    now,
    customStart,
    customEnd,
  );

  const periodActivities = useMemo(
    () =>
      activities.filter(
        (activity) =>
          activity.timestamp >= startAt && activity.timestamp <= endAt,
      ),
    [activities, endAt, startAt],
  );

  const activeSessionIds = useMemo(
    () =>
      new Set(
        periodActivities
          .filter(
            (activity) =>
              activity.sessionId ||
              FUNNEL_STAGE_ORDER.includes(activity.type as FunnelStage) ||
              activity.type === 'prospect',
          )
          .map(sessionKey),
      ),
    [periodActivities],
  );

  const activitiesBySession = useMemo(() => {
    const grouped = new Map<string, Activity[]>();
    activities.forEach((activity) => {
      const key = sessionKey(activity);
      const group = grouped.get(key) ?? [];
      group.push(activity);
      grouped.set(key, group);
    });
    return grouped;
  }, [activities]);

  const furthestStageIndex = (id: string) =>
    (activitiesBySession.get(id) ?? []).reduce((furthest, activity) => {
      const actualIndex = FUNNEL_STAGE_ORDER.indexOf(
        activity.type as FunnelStage,
      );
      const priorIndex = reachedStageIndex(activity.priorReachedThrough);
      return Math.max(furthest, actualIndex, priorIndex);
    }, -1);

  const sessionsForKey = (key: AnalysisCountKey) => {
    const matching = new Set<string>();
    activeSessionIds.forEach((id) => {
      const sessionActivities = activitiesBySession.get(id) ?? [];
      if (key === 'face_contact_total') {
        if (
          furthestStageIndex(id) >=
          FUNNEL_STAGE_ORDER.indexOf('face_to_face_contact')
        ) {
          matching.add(id);
        }
        return;
      }
      if (key === 'face_contact_initial') {
        if (
          sessionActivities.some(
            (activity) =>
              activity.type === 'face_to_face_contact' &&
              activity.faceContactKind === '初回',
          )
        ) {
          matching.add(id);
        }
        return;
      }
      const funnelIndex = FUNNEL_STAGE_ORDER.indexOf(key as FunnelStage);
      if (funnelIndex >= 0) {
        if (furthestStageIndex(id) >= funnelIndex) matching.add(id);
        return;
      }
      if (sessionActivities.some((activity) => activity.type === key)) {
        matching.add(id);
      }
    });
    return matching;
  };

  const countOf = (key: AnalysisCountKey) => sessionsForKey(key).size;
  const actualCountOf = (key: FunnelStage) =>
    periodActivities.filter((activity) => activity.type === key).length;
  const pressCount = periodActivities.filter(
    (activity) => activity.type === 'interphone',
  ).length;
  const noResponsePresses = periodActivities.filter(
    (activity) =>
      activity.type === 'interphone' &&
      activity.interphoneAttemptOutcome === '無応答',
  ).length;
  const periodPresentationSessions = new Set(
    periodActivities
      .filter((activity) => activity.type === 'presentation')
      .map(sessionKey),
  );
  const periodSaleSessions = new Set(
    periodActivities
      .filter((activity) => activity.type === 'sale')
      .map(sessionKey),
  );
  const carryoverSales = [...periodSaleSessions].filter(
    (id) => !periodPresentationSessions.has(id),
  ).length;
  const carryoverSessions = [...activeSessionIds].filter((id) => {
    const sessionActivities = activitiesBySession.get(id) ?? [];
    return (
      sessionActivities.some(
        (activity) => activity.sessionOrigin === 'carryover',
      ) ||
      sessionActivities.some((activity) => activity.timestamp < startAt)
    );
  }).length;

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
          <div className="mb-3 grid grid-cols-5 gap-1 rounded-xl bg-slate-200 p-1">
            {PERIOD_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setPeriod(option.value)}
                className={`rounded-lg px-1 py-1.5 text-xs font-bold transition ${
                  period === option.value
                    ? 'bg-white text-cyan-700 shadow-sm'
                    : 'text-slate-500'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          {period === 'custom' && (
            <div className="mb-3 grid gap-2 rounded-xl border border-slate-200 bg-white p-2.5">
              <label className="grid gap-1 text-xs font-bold text-slate-600">
                開始日
                <input
                  type="date"
                  value={customStart}
                  max={customEnd}
                  onChange={(event) => setCustomStart(event.target.value)}
                  className="min-w-0 w-full max-w-full appearance-none rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-800"
                />
              </label>
              <label className="grid gap-1 text-xs font-bold text-slate-600">
                終了日
                <input
                  type="date"
                  value={customEnd}
                  min={customStart}
                  max={today}
                  onChange={(event) => setCustomEnd(event.target.value)}
                  className="min-w-0 w-full max-w-full appearance-none rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-800"
                />
              </label>
            </div>
          )}

          <section>
            <div className="mb-1.5 flex items-end justify-between px-1">
              <div>
                <h3 className="text-xs font-bold text-slate-500">期間実績</h3>
                <p className="text-[9px] text-slate-400">期間内に記録された件数</p>
              </div>
              <div className="text-right text-[10px] text-slate-400">
                <p>無応答 {noResponsePresses}回</p>
                {carryoverSales > 0 && <p>持越し成約 {carryoverSales}件</p>}
              </div>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {FUNNEL_STEPS.map((step) => (
                <div
                  key={step.key}
                  className="min-w-0 rounded-lg bg-cyan-700 px-0.5 py-2 text-center text-white"
                >
                  <p className="truncate text-[9px] font-semibold opacity-80">
                    {step.shortLabel}
                  </p>
                  <p className="num mt-1 text-lg font-bold leading-none">
                    {actualCountOf(step.key)}
                  </p>
                </div>
              ))}
            </div>
          </section>
          <section className="mt-3">
            <div className="mb-1.5 flex items-end justify-between px-1">
              <div>
                <h3 className="text-xs font-bold text-slate-500">
                  世帯ファネル到達
                </h3>
                <p className="text-[9px] text-slate-400">
                  過去の到達確認を含む1世帯1回の集計
                </p>
              </div>
              <div className="text-right text-[10px] text-slate-400">
                <p>実押下 {pressCount}回</p>
                {carryoverSessions > 0 && (
                  <p>過去活動からの継続 {carryoverSessions}世帯</p>
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
              世帯ファネル到達率
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {METRICS.map((metric) => {
                const denominatorSessions = sessionsForKey(metric.denominator);
                const numerator = [...sessionsForKey(metric.numerator)].filter(
                  (id) => denominatorSessions.has(id),
                ).length;
                const denominator = denominatorSessions.size;
                const rate =
                  denominator > 0 ? (numerator / denominator) * 100 : null;
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
            期間実績は、その期間に保存された記録をそのまま表示します。世帯ファネル到達と到達率は、期間内に活動した世帯の以前の到達確認も含めます。
          </p>
        </div>
      </div>
    </div>
  );
}
