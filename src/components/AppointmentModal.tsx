'use client';

import { useState, type FormEvent } from 'react';
import type { AppointmentDetails } from '@/types';

interface Props {
  onSave: (details: AppointmentDetails) => void;
  onCancel: () => void;
}

const todayValue = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export function AppointmentModal({ onSave, onCancel }: Props) {
  const [appointmentDate, setAppointmentDate] = useState(todayValue);
  const [appointmentStartTime, setAppointmentStartTime] = useState('');
  const [appointmentEndTime, setAppointmentEndTime] = useState('');
  const [appointmentMemo, setAppointmentMemo] = useState('');

  const invalidTimeRange =
    Boolean(appointmentStartTime && appointmentEndTime) &&
    appointmentEndTime <= appointmentStartTime;
  const canSave =
    Boolean(appointmentDate && appointmentStartTime && appointmentEndTime) &&
    !invalidTimeRange;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSave) return;

    onSave({
      appointmentDate,
      appointmentStartTime,
      appointmentEndTime,
      appointmentMemo: appointmentMemo.trim() || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-3">
      <form
        onSubmit={handleSubmit}
        role="dialog"
        aria-modal="true"
        aria-labelledby="appointment-title"
        className="appointment-dialog max-h-[calc(100dvh-1.5rem)] overflow-x-hidden overflow-y-auto rounded-2xl bg-white p-4 shadow-xl"
      >
        <h2
          id="appointment-title"
          className="text-center text-lg font-bold text-stone-800"
        >
          アポ日時
        </h2>
        <p className="mt-1 text-center text-xs text-stone-500">
          日付と時間帯を入力すると記録されます
        </p>

        <label className="mt-4 block min-w-0 text-xs font-semibold text-stone-600">
          日付
          <input
            type="date"
            value={appointmentDate}
            onChange={(event) => setAppointmentDate(event.target.value)}
            required
            className="appointment-field mt-1 min-h-11 rounded-xl border border-stone-300 bg-white px-3 text-stone-700"
          />
        </label>

        <div className="mt-3 grid min-w-0 grid-cols-1 gap-2">
          <label className="block min-w-0 text-xs font-semibold text-stone-600">
            開始時間
            <input
              type="time"
              value={appointmentStartTime}
              onChange={(event) => setAppointmentStartTime(event.target.value)}
              step={900}
              required
              className="appointment-field mt-1 min-h-11 rounded-xl border border-stone-300 bg-white px-3 text-stone-700"
            />
          </label>
          <label className="block min-w-0 text-xs font-semibold text-stone-600">
            終了時間
            <input
              type="time"
              value={appointmentEndTime}
              onChange={(event) => setAppointmentEndTime(event.target.value)}
              step={900}
              required
              className="appointment-field mt-1 min-h-11 rounded-xl border border-stone-300 bg-white px-3 text-stone-700"
            />
          </label>
        </div>

        {invalidTimeRange && (
          <p className="mt-2 text-xs font-semibold text-red-600">
            終了時間は開始時間より後にしてください
          </p>
        )}

        <label className="mt-3 block min-w-0 text-xs font-semibold text-stone-600">
          メモ（任意）
          <textarea
            value={appointmentMemo}
            onChange={(event) => setAppointmentMemo(event.target.value)}
            maxLength={200}
            rows={3}
            placeholder="訪問先や会話内容など"
            className="appointment-field mt-1 resize-none rounded-xl border border-stone-300 bg-white p-3 text-stone-700"
          />
        </label>

        <button
          type="submit"
          disabled={!canSave}
          className="tap-target mt-3 w-full rounded-xl bg-amber-500 px-3 py-2 text-sm font-bold text-white active:bg-amber-600 disabled:opacity-40"
        >
          アポを記録
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="tap-target mt-2 w-full rounded-xl bg-stone-100 px-3 py-2 text-sm font-semibold text-stone-600 active:bg-stone-200"
        >
          キャンセル
        </button>
      </form>
    </div>
  );
}
