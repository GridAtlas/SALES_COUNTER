'use client';

import { useState } from 'react';
import {
  MapPin,
  MessageSquareText,
  Pencil,
  Star,
  Trash2,
} from 'lucide-react';
import { ProspectModal } from '@/components/ProspectModal';
import type { Activity, ProspectRating } from '@/types';

interface Props {
  prospects: Activity[];
  hydrated: boolean;
  onUpdate: (
    id: string,
    details: { prospectRating: ProspectRating; prospectComment?: string },
  ) => void;
  onDelete: (id: string) => void;
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

export function ProspectList({
  prospects,
  hydrated,
  onUpdate,
  onDelete,
}: Props) {
  const [editingProspect, setEditingProspect] = useState<Activity | null>(null);
  const [deletingProspect, setDeletingProspect] = useState<Activity | null>(null);

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
    <>
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

              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setEditingProspect(prospect)}
                  className="tap-target flex items-center justify-center gap-2 rounded-xl bg-amber-50 px-2 text-xs font-bold text-amber-700 active:bg-amber-100"
                >
                  <Pencil size={16} aria-hidden />
                  編集
                </button>
                <button
                  type="button"
                  onClick={() => setDeletingProspect(prospect)}
                  className="tap-target flex items-center justify-center gap-2 rounded-xl bg-rose-50 px-2 text-xs font-bold text-rose-700 active:bg-rose-100"
                >
                  <Trash2 size={16} aria-hidden />
                  削除
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {editingProspect && (
        <ProspectModal
          title="保留／見込を編集"
          submitLabel="変更を保存"
          initialRating={editingProspect.prospectRating ?? 1}
          initialComment={editingProspect.prospectComment}
          onSave={(prospectRating, prospectComment) => {
            onUpdate(editingProspect.id, { prospectRating, prospectComment });
            setEditingProspect(null);
          }}
          onCancel={() => setEditingProspect(null)}
        />
      )}

      {deletingProspect && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="prospect-delete-title"
            className="w-full max-w-sm rounded-2xl bg-white p-4 shadow-xl"
          >
            <h2
              id="prospect-delete-title"
              className="text-center text-lg font-bold text-stone-800"
            >
              保留／見込を削除
            </h2>
            <p className="mt-2 text-center text-sm leading-relaxed text-stone-500">
              この保留／見込を一覧から削除します。
              <br />
              この操作は元に戻せません。
            </p>
            <button
              type="button"
              onClick={() => {
                const id = deletingProspect.id;
                setDeletingProspect(null);
                onDelete(id);
              }}
              className="tap-target mt-4 w-full rounded-xl bg-rose-600 px-3 py-2 text-sm font-bold text-white active:bg-rose-700"
            >
              削除する
            </button>
            <button
              type="button"
              onClick={() => setDeletingProspect(null)}
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
