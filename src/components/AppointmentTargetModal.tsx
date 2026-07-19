'use client';

import { CalendarClock, MapPinHouse } from 'lucide-react';
import type { Activity } from '@/types';

interface Props {
  appointments: Activity[];
  onSelect: (appointment: Activity) => void;
  onCreate: () => void;
  fallbackLabel?: string;
  onCancel: () => void;
}

const dateLabel = (date?: string) => {
  if (!date) return '日時未設定';
  const value = new Date(`${date}T00:00:00`);
  return new Intl.DateTimeFormat('ja-JP', {
    month: 'numeric',
    day: 'numeric',
    weekday: 'short',
  }).format(value);
};

export function AppointmentTargetModal({
  appointments,
  onSelect,
  onCreate,
  fallbackLabel = '対象アポがない・新規登録',
  onCancel,
}: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-3">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="appointment-target-title"
        className="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-sm flex-col overflow-hidden rounded-2xl bg-white shadow-xl"
      >
        <header className="border-b border-stone-100 px-4 py-3 text-center">
          <h2 id="appointment-target-title" className="text-lg font-bold text-stone-800">
            対象アポを選択
          </h2>
          <p className="mt-0.5 text-xs text-stone-500">
            登録済みのアポから訪問先を選択してください
          </p>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          {appointments.length > 0 ? (
            <div className="space-y-2">
              {appointments.map((appointment) => (
                <button
                  key={appointment.id}
                  type="button"
                  onClick={() => onSelect(appointment)}
                  className="tap-target flex w-full items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-left active:bg-amber-100"
                >
                  <CalendarClock size={18} className="mt-0.5 shrink-0 text-amber-700" aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold text-stone-700">
                      {dateLabel(appointment.appointmentDate)}
                      {appointment.appointmentStartTime && (
                        <span className="num ml-2 text-amber-700">
                          {appointment.appointmentStartTime}
                          {appointment.appointmentEndTime ? `〜${appointment.appointmentEndTime}` : ''}
                        </span>
                      )}
                    </span>
                    {appointment.appointmentMemo && (
                      <span className="mt-0.5 block truncate text-xs text-stone-500">
                        {appointment.appointmentMemo}
                      </span>
                    )}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <p className="rounded-xl bg-stone-50 px-3 py-5 text-center text-sm text-stone-500">
              該当するアポはありません
            </p>
          )}
        </div>

        <div className="border-t border-stone-100 p-3">
          <button
            type="button"
            onClick={onCreate}
            className="tap-target flex w-full items-center justify-center gap-1.5 rounded-xl bg-amber-500 px-3 py-2 text-sm font-bold text-white active:bg-amber-600"
          >
            <MapPinHouse size={17} aria-hidden />
            {fallbackLabel}
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
    </div>
  );
}
