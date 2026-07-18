'use client';

import { MapPin, MessageSquareText, Star } from 'lucide-react';
import type { Activity } from '@/types';

interface Props {
  prospects: Activity[];
  hydrated: boolean;
}

const recordedAt = (timestamp: number) =>
  new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(timestamp));

const mapsUrl = (latitude: number, longitude: number) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${latitude},${longitude}`,
  )}`;

export function ProspectList({ prospects, hydrated }: Props) {
  if (!hydrated) {
    return (
      <div className="flex-1 px-3 py-6 text-center text-sm text-stone-400">
        読み込み中…
      </div>
    );
  }

  if (prospects.length === 0) {
    return (
      <div className="flex-1 px-3">
        <div className="rounded-2xl border border-stone-200 bg-white/90 p-6 text-center text-sm text-stone-400">
          まだ保留／見込がありません
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-2 overflow-y-auto px-3 pb-3">
      {prospects.map((prospect) => {
        const hasGps =
          typeof prospect.gpsLatitude === 'number' &&
          typeof prospect.gpsLongitude === 'number';

        return (
          <article
            key={prospect.id}
            className="rounded-2xl border border-amber-200 bg-white/95 p-3 shadow-sm"
          >
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1 text-amber-500">
                  <Star size={18} fill="currentColor" aria-hidden />
                  <span className="text-sm font-bold text-amber-700">
                    見込度 {prospect.prospectRating ?? 0} / 5
                  </span>
                </p>
                <p className="mt-1 text-xs text-stone-500">
                  {recordedAt(prospect.timestamp)}
                </p>
              </div>

              {hasGps ? (
                <a
                  href={mapsUrl(prospect.gpsLatitude!, prospect.gpsLongitude!)}
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

            {prospect.prospectComment && (
              <p className="mt-2 flex items-start gap-1.5 rounded-xl bg-stone-50 p-2 text-xs leading-relaxed text-stone-600">
                <MessageSquareText
                  size={15}
                  className="mt-0.5 shrink-0"
                  aria-hidden
                />
                <span className="whitespace-pre-wrap break-words">
                  {prospect.prospectComment}
                </span>
              </p>
            )}
          </article>
        );
      })}
    </div>
  );
}
