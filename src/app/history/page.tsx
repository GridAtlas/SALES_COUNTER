'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useCounterStore } from '@/store/useCounterStore';
import { getActivityDef } from '@/lib/constants';

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
                        {a.ageGroup && (
                          <span className="ml-1 font-semibold text-stone-500">
                            （{a.ageGroup}）
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
