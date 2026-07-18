import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Activity, ActivityDetails, ActivityType } from '@/types';

/**
 * 記録形式は「1 タップ = 1 レコード」。
 * 集計だけならカウンター整数で足りるが、履歴 (時刻表示・時間帯分析) が
 * 要件なので生ログを持つ。日次リセット時は activities を空にする。
 */
interface CounterState {
  activities: Activity[];

  add: (type: ActivityType, details?: ActivityDetails) => void;
  undoLast: () => void; // 一番最後のレコードを削除（種別問わず）
  reset: () => void;

  countOf: (type: ActivityType) => number;
  totalCount: () => number;
}

const uid = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export const useCounterStore = create<CounterState>()(
  persist(
    (set, get) => ({
      activities: [],

      add: (type, details = {}) =>
        set((s) => ({
          activities: [
            ...s.activities,
            { id: uid(), type, timestamp: Date.now(), ...details },
          ],
        })),

      undoLast: () =>
        set((s) => ({
          activities: s.activities.slice(0, -1),
        })),

      reset: () => set({ activities: [] }),

      countOf: (type) =>
        get().activities.filter((a) => a.type === type).length,

      totalCount: () => get().activities.length,
    }),
    {
      name: 'sales-counter-store',
      version: 1,
    },
  ),
);
