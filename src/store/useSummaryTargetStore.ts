import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const SUMMARY_METRIC_KEYS = [
  'knock',
  'interphone',
  'contact',
  'appointment',
  'scheduledAppointment',
  'appointmentVisit',
  'presentation',
  'sale',
] as const;

export type SummaryMetricKey = (typeof SUMMARY_METRIC_KEYS)[number];
export type SummaryPeriod = 'daily' | 'weekly' | 'monthly';
export type SummaryTargets = Record<SummaryMetricKey, number | null>;

export const emptySummaryTargets = (): SummaryTargets => ({
  knock: null,
  interphone: null,
  contact: null,
  appointment: null,
  scheduledAppointment: null,
  appointmentVisit: null,
  presentation: null,
  sale: null,
});

interface SummaryTargetState {
  targets: Record<SummaryPeriod, SummaryTargets>;
  setTargets: (period: SummaryPeriod, targets: SummaryTargets) => void;
}

export const useSummaryTargetStore = create<SummaryTargetState>()(
  persist(
    (set) => ({
      targets: {
        daily: emptySummaryTargets(),
        weekly: emptySummaryTargets(),
        monthly: emptySummaryTargets(),
      },
      setTargets: (period, targets) =>
        set((state) => ({
          targets: { ...state.targets, [period]: targets },
        })),
    }),
    {
      name: 'sales-counter-summary-targets',
      version: 1,
    },
  ),
);
