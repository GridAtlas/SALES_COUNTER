'use client';

import { CalendarClock, MapPin, StickyNote } from 'lucide-react';
import type { Activity } from '@/types';

interface Props {
  appointments: Activity[];
  hydrated: boolean;
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

export function AppointmentList({ appointments, hydrated }: Props) {
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
    <div className="flex-1 space-y-2 overflow-y-auto px-3 pb-3">
      {appointments.map((appointment) => {
        const hasGps =
          typeof appointment.gpsLatitude === 'number' &&
          typeof appointment.gpsLongitude === 'number';
        const schedule =
          appointment.appointmentDate &&
          appointment.appointmentStartTime &&
          appointment.appointmentEndTime;
        const recordedDate = new Date(appointment.timestamp).toLocaleDateString(
          'sv-SE',
        );
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
                <StickyNote size={15} className="mt-0.5 shrink-0" aria-hidden />
                <span className="whitespace-pre-wrap break-words">
                  {appointment.appointmentMemo}
                </span>
              </p>
            )}
          </article>
        );
      })}
    </div>
  );
}
