'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { BarChart3, Clock3, X } from 'lucide-react';
import { ACTIVITIES, getActivityDef } from '@/lib/constants';
import type { Activity, ActivityDef, DailyReport } from '@/types';

interface Props {
  report: DailyReport;
  onClose: () => void;
}

type DetailView = 'summary' | 'timeline';

const movementActivities = ACTIVITIES.slice(0, 6);
const salesActivities = ACTIVITIES.slice(6);

const timeString = (timestamp: number) =>
  new Intl.DateTimeFormat('ja-JP', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(new Date(timestamp));

const activityDetails = (activity: Activity): string[] => {
  const rejectionReason = activity.rejectionReason
    ? activity.rejectionReason === 'その他' && activity.rejectionReasonDetail
      ? `その他：${activity.rejectionReasonDetail}`
      : activity.rejectionReason
    : undefined;
  const appointmentSchedule = activity.appointmentDate
    ? `${activity.appointmentDate} ${activity.appointmentStartTime ?? ''}${
        activity.appointmentEndTime ? `〜${activity.appointmentEndTime}` : ''
      }`
    : undefined;

  return [
    activity.customerStatus,
    activity.interphoneResponseKind,
    activity.ageGroup,
    activity.appointmentVisitKind,
    activity.presentationLocation,
    rejectionReason,
    appointmentSchedule,
    activity.appointmentMemo ? `メモ：${activity.appointmentMemo}` : undefined,
    activity.prospectRating
      ? `見込度：${'★'.repeat(activity.prospectRating)}（${activity.prospectRating}/5）`
      : undefined,
    activity.prospectComment
      ? `コメント：${activity.prospectComment}`
      : undefined,
  ].filter((detail): detail is string => Boolean(detail));
};

export function DailyReportDetailModal({ report, onClose }: Props) {
  const [activeView, setActiveView] = useState<DetailView>('summary');
  const sortedActivities = useMemo(
    () => [...report.activities].sort((left, right) => left.timestamp - right.timestamp),
    [report.activities],
  );
  const countOf = (def: ActivityDef) =>
    report.activities.filter((activity) => activity.type === def.type).length;
  const sectionTotal = (defs: ActivityDef[]) =>
    defs.reduce((sum, def) => sum + countOf(def), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-3">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="daily-report-title"
        className="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-sm flex-col overflow-hidden rounded-2xl bg-slate-50 shadow-xl"
      >
        <header className="flex items-center border-b border-slate-200 bg-white px-4 py-3">
          <div>
            <h2 id="daily-report-title" className="text-lg font-bold text-slate-800">
              {report.date} 日報
            </h2>
            <p className="text-xs text-slate-500">
              営業終了 {timeString(report.endedAt)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="tap-target ml-auto grid place-items-center rounded-xl text-slate-500 active:bg-slate-100"
            aria-label="日報詳細を閉じる"
          >
            <X size={22} />
          </button>
        </header>

        <div className="grid grid-cols-2 border-b border-slate-200 bg-white p-1" role="tablist" aria-label="日報表示切り替え">
          <DetailTab
            selected={activeView === 'summary'}
            label="集計結果"
            icon={<BarChart3 size={16} />}
            onClick={() => setActiveView('summary')}
          />
          <DetailTab
            selected={activeView === 'timeline'}
            label="タイムライン"
            icon={<Clock3 size={16} />}
            onClick={() => setActiveView('timeline')}
          />
        </div>

        <div className="overflow-y-auto p-3">
          {activeView === 'summary' ? (
            <>
              <div className="grid grid-cols-3 gap-2">
                <SummaryTotal label="合計" count={report.activities.length} emphasized />
                <SummaryTotal label="移動・休憩" count={sectionTotal(movementActivities)} />
                <SummaryTotal label="営業活動" count={sectionTotal(salesActivities)} />
              </div>
              <ReportCountSection title="移動・休憩" defs={movementActivities} countOf={countOf} />
              <ReportCountSection title="営業活動" defs={salesActivities} countOf={countOf} />
            </>
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white divide-y divide-slate-100">
              {sortedActivities.map((activity) => {
                const details = activityDetails(activity);
                return (
                  <div key={activity.id} className="flex gap-2 px-3 py-2">
                    <span className="num w-[62px] shrink-0 text-xs text-slate-400">
                      {timeString(activity.timestamp)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-700">
                        {getActivityDef(activity.type)?.label ?? activity.type}
                      </p>
                      {details.length > 0 && (
                        <p className="mt-0.5 text-[11px] leading-snug text-slate-500">
                          {details.join(' / ')}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
              <div className="flex gap-2 bg-rose-50 px-3 py-2">
                <span className="num w-[62px] shrink-0 text-xs text-rose-500">
                  {timeString(report.endedAt)}
                </span>
                <p className="text-sm font-bold text-rose-700">活動終了</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailTab({
  selected,
  label,
  icon,
  onClick,
}: {
  selected: boolean;
  label: string;
  icon: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={selected}
      onClick={onClick}
      className={[
        'tap-target flex items-center justify-center gap-1 rounded-lg text-xs font-bold',
        selected ? 'bg-slate-700 text-white' : 'text-slate-500',
      ].join(' ')}
    >
      {icon}
      {label}
    </button>
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
    <div className={[
      'rounded-xl px-2 py-2 text-center',
      emphasized ? 'bg-slate-700 text-white' : 'bg-white text-slate-700 shadow-sm',
    ].join(' ')}>
      <p className="truncate text-[10px] font-semibold opacity-75">{label}</p>
      <p className="num mt-0.5 text-xl font-bold leading-none">{count}</p>
    </div>
  );
}

function ReportCountSection({
  title,
  defs,
  countOf,
}: {
  title: string;
  defs: ActivityDef[];
  countOf: (def: ActivityDef) => number;
}) {
  return (
    <section className="mt-3">
      <h3 className="mb-1 px-1 text-xs font-bold text-slate-500">🔲 {title}</h3>
      <div className="grid grid-cols-2 gap-1.5">
        {defs.map((def) => (
          <div key={def.type} className="flex min-w-0 items-center rounded-lg border border-slate-200 bg-white px-2 py-1.5">
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
  );
}
