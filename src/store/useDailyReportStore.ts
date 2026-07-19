import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Activity, DailyReport } from '@/types';

interface DailyReportState {
  reports: DailyReport[];
  saveDailyReport: (
    date: string,
    activities: Activity[],
    endedAt: number,
  ) => string;
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
      version: 1,
    },
  ),
);
