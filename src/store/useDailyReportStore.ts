import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Activity, DailyReport } from '@/types';
import { normalizeCarryoverActivities } from '@/lib/session';

interface DailyReportState {
  reports: DailyReport[];
  saveDailyReport: (
    date: string,
    activities: Activity[],
    endedAt: number,
  ) => string;
  autoSaveDailyReport: (date: string, activities: Activity[]) => string;
}

const uid = () =>
  `report-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export const useDailyReportStore = create<DailyReportState>()(
  persist(
    (set) => ({
      reports: [],

      saveDailyReport: (date, activities, endedAt) => {
        let reportId = '';
        const savedAt = Date.now();
        const snapshot = activities.map((activity) => ({ ...activity }));

        set((state) => {
          const existing = state.reports.find((report) => report.date === date);
          reportId = existing?.id ?? uid();
          const report: DailyReport = {
            id: reportId,
            date,
            endedAt,
            savedAt,
            activities: snapshot,
            isFinalized: true,
          };

          return {
            reports: existing
              ? state.reports.map((current) =>
                  current.id === existing.id ? report : current,
                )
              : [...state.reports, report],
          };
        });

        return reportId;
      },

      autoSaveDailyReport: (date, activities) => {
        let reportId = '';
        const savedAt = Date.now();
        const snapshot = activities.map((activity) => ({ ...activity }));

        set((state) => {
          const existing = state.reports.find((report) => report.date === date);
          reportId = existing?.id ?? uid();
          const report: DailyReport = {
            id: reportId,
            date,
            // 明示的に終了済みの日報を、バックグラウンド保存で未終了に戻さない。
            endedAt: existing?.isFinalized ? existing.endedAt : undefined,
            savedAt,
            activities: snapshot,
            isFinalized: existing?.isFinalized ?? false,
          };

          return {
            reports: existing
              ? state.reports.map((current) =>
                  current.id === existing.id ? report : current,
                )
              : [...state.reports, report],
          };
        });

        return reportId;
      },
    }),
    {
      name: 'sales-counter-daily-reports',
      version: 3,
      migrate: (persistedState) => {
        const state = persistedState as Partial<DailyReportState>;
        return {
          ...state,
          reports: (state.reports ?? []).map((report) => ({
            ...report,
            activities: normalizeCarryoverActivities(report.activities),
            // この変更以前の日報はすべて「活動終了」で保存されたもの。
            isFinalized: report.isFinalized ?? true,
          })),
        } as DailyReportState;
      },
    },
  ),
);
