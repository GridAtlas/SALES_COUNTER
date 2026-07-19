'use client';

import { useState } from 'react';
import {
  CalendarClock,
  CalendarDays,
  MapPin,
  StickyNote,
  Trash2,
} from 'lucide-react';
import { AppointmentModal } from '@/components/AppointmentModal';
import type { Activity, AppointmentDetails } from '@/types';

interface Props {
  appointments: Activity[];
  hydrated: boolean;
  onReschedule: (id: string, details: AppointmentDetails) => void;
  onCancelAppointment: (id: string) => void;
}

const dateLabel = (date: string) => {
  const value = new Date(`${date}T00:00:00`);
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  }).format(value);
};

const mapsUrl = (latitude: number, longitude: number) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${latitude},${longitude}`,
  )}`;

export function AppointmentList({
  appointments,
  hydrated,
  onReschedule,
  onCancelAppointment,
}: Props) {
  const [editingAppointment, setEditingAppointment] =
    useState<Activity | null>(null);
  const [cancelingAppointment, setCancelingAppointment] =
    useState<Activity | null>(null);

  if (!hydrated) {
    return (
      <div className="flex-1 px-3 py-6 text-center text-sm text-stone-400">
        読み込み中…
      </div>
    );
  }

  if (appointments.length === 0) {
    return (
      <div className="flex-1 px-3">
        <div className="rounded-2xl border border-stone-200 bg-white/90 p-6 text-center text-sm text-stone-400">
          まだアポがありません
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex-1 space-y-2 overflow-y-auto px-3 pb-3">
        {appointments.map((appointment) => {
          const hasGps =
            typeof appointment.gpsLatitude === 'number' &&
            typeof appointment.gpsLongitude === 'number';
          const schedule =
            appointment.appointmentDate &&
            appointment.appointmentStartTime &&
            appointment.appointmentEndTime;
          const recordedDate = new Date(
            appointment.timestamp,
          ).toLocaleDateString('sv-SE');
          const category =
            appointment.appointmentCategory ??
            (appointment.appointmentDate === recordedDate
              ? '当日取得アポ'
              : '予定アポ');

          return (
            <article
              key={appointment.id}
              className="rounded-2xl border border-amber-200 bg-white/95 p-3 shadow-sm"
            >
              <div className="flex items-start gap-3">
                <div className="flex min-w-0 flex-1 gap-2">
                  <CalendarClock
                    size={19}
                    className="mt-0.5 shrink-0 text-amber-600"
                    aria-hidden
                  />
                  <div className="min-w-0">
                    {schedule ? (
                      <>
                        <h2 className="text-sm font-bold text-stone-700">
                          {dateLabel(appointment.appointmentDate!)}
                        </h2>
                        <p className="num mt-0.5 text-sm font-semibold text-amber-700">
                          {appointment.appointmentStartTime}〜
                          {appointment.appointmentEndTime}
                        </p>
                      </>
                    ) : (
                      <h2 className="text-sm font-bold text-stone-500">
                        日時未設定のアポ
                      </h2>
                    )}
                    <p className="mt-1 text-[10px] font-semibold text-stone-400">
                      {category}
                      {appointment.appointmentAcquisitionKind
                        ? ` ・ ${appointment.appointmentAcquisitionKind}`
                        : ''}
                    </p>
                  </div>
                </div>

                {hasGps ? (
                  <a
                    href={mapsUrl(
                      appointment.gpsLatitude!,
                      appointment.gpsLongitude!,
                    )}
                    target="_blank"
                    rel="noreferrer"
                    className="tap-target flex shrink-0 items-center gap-1 rounded-xl bg-blue-50 px-3 text-xs font-bold text-blue-700 active:bg-blue-100"
                    aria-label="GPSで地図を開く"
                  >
                    <MapPin size={16} />
                    GPS
                  </a>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="tap-target flex shrink-0 items-center gap-1 rounded-xl bg-stone-100 px-3 text-xs font-bold text-stone-400"
                    aria-label="GPS未取得"
                  >
                    <MapPin size={16} />
                    GPS
                  </button>
                )}
              </div>

              {appointment.appointmentMemo && (
                <p className="mt-2 flex items-start gap-1.5 rounded-xl bg-stone-50 p-2 text-xs leading-relaxed text-stone-600">
                  <StickyNote
                    size={15}
                    className="mt-0.5 shrink-0"
                    aria-hidden
                  />
                  <span className="whitespace-pre-wrap break-words">
                    {appointment.appointmentMemo}
                  </span>
                </p>
              )}

              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setEditingAppointment(appointment)}
                  className="tap-target flex items-center justify-center gap-2 rounded-xl bg-amber-50 px-2 text-xs font-bold text-amber-700 active:bg-amber-100"
                  aria-label="アポをリスケする"
                >
                  <CalendarDays size={16} aria-hidden />
                  <span>
                    リスケ
                    <span className="block text-[9px]">日付変更</span>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setCancelingAppointment(appointment)}
                  className="tap-target flex items-center justify-center gap-2 rounded-xl bg-rose-50 px-2 text-xs font-bold text-rose-700 active:bg-rose-100"
                  aria-label="アポをキャンセルして削除する"
                >
                  <Trash2 size={16} aria-hidden />
                  <span>
                    キャンセル
                    <span className="block text-[9px]">削除</span>
                  </span>
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {editingAppointment && (
        <AppointmentModal
          title="アポをリスケ"
          description="新しい日付と時間帯を入力してください"
          submitLabel="変更を保存"
          initialDetails={{
            appointmentDate: editingAppointment.appointmentDate,
            appointmentStartTime: editingAppointment.appointmentStartTime,
            appointmentEndTime: editingAppointment.appointmentEndTime,
            appointmentMemo: editingAppointment.appointmentMemo,
          }}
          onSave={(details) => {
            onReschedule(editingAppointment.id, details);
            setEditingAppointment(null);
          }}
          onCancel={() => setEditingAppointment(null)}
        />
      )}

      {cancelingAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="appointment-cancel-title"
            className="w-full max-w-sm rounded-2xl bg-white p-4 shadow-xl"
          >
            <h2
              id="appointment-cancel-title"
              className="text-center text-lg font-bold text-stone-800"
            >
              アポをキャンセル
            </h2>
            <p className="mt-2 text-center text-sm leading-relaxed text-stone-500">
              このアポを一覧から削除します。
              <br />
              この操作は元に戻せません。
            </p>
            <button
              type="button"
              onClick={() => {
                const id = cancelingAppointment.id;
                setCancelingAppointment(null);
                onCancelAppointment(id);
              }}
              className="tap-target mt-4 w-full rounded-xl bg-rose-600 px-3 py-2 text-sm font-bold text-white active:bg-rose-700"
            >
              キャンセルして削除
            </button>
            <button
              type="button"
              onClick={() => setCancelingAppointment(null)}
              className="tap-target mt-2 w-full rounded-xl bg-stone-100 px-3 py-2 text-sm font-semibold text-stone-600 active:bg-stone-200"
            >
              戻る
            </button>
          </div>
        </div>
      )}
    </>
  );
}
