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

  add: (type: ActivityType, details?: ActivityDetails) => string;
  updateActivity: (id: string, details: ActivityDetails) => void;
  undoLast: () => void; // 一番最後のレコードを削除（種別問わず）
  reset: () => void;

  countOf: (type: ActivityType) => number;
  totalCount: () => number;
}

const uid = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const migrateContactActivities = (activities: Activity[]) =>
  activities.map((activity): Activity => {
    if (activity.type === 'first_contact') {
      return {
        ...activity,
        type: 'face_to_face_contact',
        faceContactKind: '初回',
      };
    }
    if (activity.type === 'revisit') {
      return {
        ...activity,
        type: 'face_to_face_contact',
        faceContactKind: '2回目以降',
      };
    }
    return activity;
  });

export const useCounterStore = create<CounterState>()(
  persist(
    (set, get) => ({
      activities: [],

      add: (type, details = {}) => {
        const id = uid();
        set((state) => ({
          activities: [
            ...state.activities,
            { id, type, timestamp: Date.now(), ...details },
          ],
        }));
        return id;
      },

      updateActivity: (id, details) =>
        set((state) => ({
          activities: state.activities.map((activity) =>
            activity.id === id ? { ...activity, ...details } : activity,
          ),
        })),

      undoLast: () =>
        set((state) => ({
          activities: state.activities.slice(0, -1),
        })),

      reset: () => set({ activities: [] }),

      countOf: (type) =>
        get().activities.filter((activity) => activity.type === type).length,

      totalCount: () => get().activities.length,
    }),
    {
      name: 'sales-counter-store',
      version: 2,
      migrate: (persistedState) => {
        const state = persistedState as Partial<CounterState>;
        return {
          ...state,
          activities: migrateContactActivities(state.activities ?? []),
        } as CounterState;
      },
    },
  ),
);
