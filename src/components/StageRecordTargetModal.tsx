'use client';

import type { Activity } from '@/types';

interface Props {
  stageLabel: string;
  records: Activity[];
  onSelect: (activity: Activity) => void;
  onBack: () => void;
  onCancel: () => void;
}

const timeString = (timestamp: number) =>
  new Intl.DateTimeFormat('ja-JP', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(new Date(timestamp));

const recordDetails = (activity: Activity) =>
  [
    activity.customerStatus,
    activity.ageGroup,
    activity.appointmentDate,
    activity.appointmentStartTime,
    activity.presentationLocation,
  ]
    .filter(Boolean)
    .join(' / ');

export function StageRecordTargetModal({
  stageLabel,
  records,
  onSelect,
  onBack,
  onCancel,
}: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="stage-record-title"
        className="flex max-h-[calc(100dvh-2rem)] w-full max-w-sm flex-col rounded-2xl bg-white p-4 shadow-xl"
      >
        <h2
          id="stage-record-title"
          className="text-center text-lg font-bold text-stone-800"
        >
          登録済みログを選択
        </h2>
        <p className="mt-1 text-center text-xs leading-relaxed text-stone-500">
          このお客さまの「{stageLabel}」を選んでください
        </p>

        <div className="mt-4 min-h-0 space-y-2 overflow-y-auto">
          {records.map((activity) => {
            const details = recordDetails(activity);
            return (
              <button
                key={activity.id}
                type="button"
                onClick={() => onSelect(activity)}
                className="tap-target w-full rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-left active:bg-blue-100"
              >
                <span className="num block text-sm font-bold text-blue-700">
                  {timeString(activity.timestamp)}
                </span>
                {details && (
                  <span className="mt-0.5 block text-xs text-stone-600">
                    {details}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={onBack}
          className="tap-target mt-3 w-full rounded-xl bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 active:bg-blue-100"
        >
          選択肢へ戻る
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="tap-target mt-2 w-full rounded-xl bg-stone-100 px-3 py-2 text-sm font-semibold text-stone-600 active:bg-stone-200"
        >
          キャンセル
        </button>
      </div>
    </div>
  );
}
