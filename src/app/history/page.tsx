'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, Copy } from 'lucide-react';
import { useCounterStore } from '@/store/useCounterStore';
import { getActivityDef } from '@/lib/constants';
import type { Activity } from '@/types';

const activityDetailLabels = (activity: Activity): string[] => {
  const rejectionReason = activity.rejectionReason
    ? activity.rejectionReason === 'その他' && activity.rejectionReasonDetail
      ? `その他：${activity.rejectionReasonDetail}`
      : activity.rejectionReason
    : undefined;
  const appointmentSchedule = activity.appointmentDate
    ? `${activity.appointmentDate} ${activity.appointmentStartTime ?? ''}${
        activity.appointmentEndTime
          ? `〜${activity.appointmentEndTime}`
          : ''
      }`
    : undefined;
  const appointmentMemo = activity.appointmentMemo
    ? `メモ：${activity.appointmentMemo}`
    : undefined;

  return [
    activity.customerStatus,
    activity.ageGroup,
    activity.presentationLocation,
    rejectionReason,
    appointmentSchedule,
    appointmentMemo,
  ].filter((detail): detail is string => Boolean(detail));
};
/** yyyy-mm-dd 形式のローカル日付文字列。 */
const dateKey = (ts: number) => {
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

/** HH:mm:ss 形式のローカル時刻。 */
const timeStr = (ts: number) => {
  const d = new Date(ts);
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  const s = String(d.getSeconds()).padStart(2, '0');
  return `${h}:${m}:${s}`;
};

export default function HistoryPage() {
  const [hydrated, setHydrated] = useState(false);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'error'>('idle');
  useEffect(() => setHydrated(true), []);

  const activities = useCounterStore((s) => s.activities);

  // 日付別にグループ化、新しい日→古い日、日内は新しい順。
  const grouped = useMemo(() => {
    const map = new Map<string, typeof activities>();
    for (const a of activities) {
      const key = dateKey(a.timestamp);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(a);
    }
    return [...map.entries()]
      .map(([date, list]) => ({
        date,
        list: [...list].sort((a, b) => b.timestamp - a.timestamp),
      }))
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [activities]);

  const logText = useMemo(
    () =>
      grouped
        .map(({ date, list }) => {
          const lines = list.map((activity) => {
            const def = getActivityDef(activity.type);
            const details = activityDetailLabels(activity);
            const detailText =
              details.length > 0 ? `（${details.join(' / ')}）` : '';
            return `${timeStr(activity.timestamp)} ${def?.label ?? activity.type}${detailText}`;
          });
          return [date, ...lines].join('\n');
        })
        .join('\n\n'),
    [grouped],
  );

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(logText);
      setCopyStatus('copied');
    } catch {
      setCopyStatus('error');
    }
    window.setTimeout(() => setCopyStatus('idle'), 2000);
  };

  return (
    <>
      <header className="px-3 pt-2 pb-3 flex items-center gap-2">
        <Link
          href="/"
          className="tap-target -ml-1 p-1 text-stone-500"
          aria-label="戻る"
        >
          <ArrowLeft size={22} />
        </Link>
        <h1 className="font-semibold text-stone-700">履歴</h1>
        <button
          type="button"
          onClick={handleCopy}
          disabled={!hydrated || activities.length === 0}
          className="tap-target ml-auto flex items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-stone-600 shadow-sm disabled:opacity-40"
          aria-label="ログをコピー"
        >
          {copyStatus === 'copied' ? <Check size={16} /> : <Copy size={16} />}
          <span>{copyStatus === 'copied' ? 'コピーしました' : copyStatus === 'error' ? 'コピー失敗' : 'ログをコピー'}</span>
        </button>
      </header>

      <div className="flex-1 px-3 pb-4 space-y-4">
        {!hydrated ? (
          <div className="text-center text-sm text-stone-400 py-6">
            読み込み中…
          </div>
        ) : grouped.length === 0 ? (
          <div className="rounded-2xl bg-white/90 border border-stone-200 p-6 text-center text-sm text-stone-400">
            まだ記録がありません
          </div>
        ) : (
          grouped.map(({ date, list }) => (
            <section key={date}>
              <h2 className="text-xs font-semibold text-stone-500 px-2 mb-1">
                {date}（{list.length} 件）
              </h2>
              <div className="rounded-2xl bg-white/90 border border-stone-200 overflow-hidden divide-y divide-stone-100">
                {list.map((a) => {
                  const def = getActivityDef(a.type);
                  const color = def?.color ?? 'slate';
                  return (
                    <div
                      key={a.id}
                      className="flex items-center gap-3 px-3 py-2"
                    >
                      <span
                        className={`w-2.5 h-2.5 rounded-full bg-${color}-500`}
                        aria-hidden
                      />
                      <span className="flex-1 text-sm text-stone-700">
                        {def?.label ?? a.type}
                        {activityDetailLabels(a).length > 0 && (
                          <span className="ml-1 font-semibold text-stone-500">
                            （{activityDetailLabels(a).join(' / ')}）
                          </span>
                        )}
                      </span>
                      <span className="num text-xs text-stone-400">
                        {timeStr(a.timestamp)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>
          ))
        )}
      </div>
    </>
  );
}
