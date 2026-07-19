'use client';

import { useMemo, useState } from 'react';
import { ChevronRight, FileText } from 'lucide-react';
import { DailyReportDetailModal } from '@/components/DailyReportDetailModal';
import type { DailyReport } from '@/types';

interface Props {
  reports: DailyReport[];
  hydrated: boolean;
}

const dateLabel = (date: string) =>
  new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  }).format(new Date(`${date}T00:00:00`));

const timeLabel = (timestamp: number) =>
  new Intl.DateTimeFormat('ja-JP', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(timestamp));

export function DailyReportList({ reports, hydrated }: Props) {
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const sortedReports = useMemo(
    () => [...reports].sort((left, right) => right.date.localeCompare(left.date) || right.savedAt - left.savedAt),
    [reports],
  );
  const selectedReport = reports.find((report) => report.id === selectedReportId);

  if (!hydrated) {
    return <div className="flex-1 py-8 text-center text-sm text-stone-400">読み込み中…</div>;
  }

  return (
    <>
      <div className="flex-1 space-y-2 overflow-y-auto px-3 pb-3">
        {sortedReports.length === 0 ? (
          <div className="rounded-2xl border border-stone-200 bg-white/90 p-6 text-center text-sm text-stone-400">
            保存済みの日報はありません
          </div>
        ) : (
          sortedReports.map((report) => (
            <button
              key={report.id}
              type="button"
              onClick={() => setSelectedReportId(report.id)}
              className="tap-target flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white/95 p-3 text-left shadow-sm active:bg-slate-50"
              aria-label={`${report.date}の日報を開く`}
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600">
                <FileText size={20} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold text-slate-700">
                  {dateLabel(report.date)}
                </span>
                <span className="mt-0.5 block text-xs text-slate-500">
                  {report.activities.length}件・活動終了 {timeLabel(report.endedAt)}
                </span>
              </span>
              <ChevronRight size={18} className="shrink-0 text-slate-400" />
            </button>
          ))
        )}
      </div>

      {selectedReport && (
        <DailyReportDetailModal
          report={selectedReport}
          onClose={() => setSelectedReportId(null)}
        />
      )}
    </>
  );
}
