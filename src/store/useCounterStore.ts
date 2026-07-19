import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Activity, ActivityDetails, ActivityType } from '@/types';
import { normalizeCarryoverActivities } from '@/lib/session';

interface CounterState {
  activities: Activity[];
  periodStartedAt: number;
  activeSessionId?: string;

  add: (
    type: ActivityType,
    details?: ActivityDetails,
    timestamp?: number,
    id?: string,
  ) => string;
  updateActivity: (id: string, details: ActivityDetails) => void;
  setActiveSessionId: (sessionId?: string) => void;
  undoLast: () => void;
  reset: () => void;

  countOf: (type: ActivityType) => number;
  totalCount: () => number;
}

const uid = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const SESSION_ACTIVITY_TYPES = new Set<ActivityType>([
  'interphone',
  'interphone_response',
  'face_to_face_contact',
  'first_contact',
  'revisit',
  'rejection_close',
  'appointment',
  'appointment_visit',
  'pre_presentation_rejection',
  'presentation',
  'post_presentation_rejection',
  'prospect',
  'sale',
]);

const TERMINAL_ACTIVITY_TYPES = new Set<ActivityType>([
  'rejection_close',
  'pre_presentation_rejection',
  'post_presentation_rejection',
  'sale',
]);

const migrateActivities = (activities: Activity[]) => {
  let currentSessionId: string | undefined;

  const migrated = activities.map((source): Activity => {
    let activity = source;
    if (activity.type === 'first_contact') {
      activity = {
        ...activity,
        type: 'face_to_face_contact',
        faceContactKind: '初回',
      };
    } else if (activity.type === 'revisit') {
      activity = {
        ...activity,
        type: 'face_to_face_contact',
        faceContactKind: '2回目以降',
      };
    }

    if (activity.type === 'interphone') {
      currentSessionId = activity.sessionId ?? `legacy-session-${activity.id}`;
    } else if (
      SESSION_ACTIVITY_TYPES.has(activity.type) &&
      !activity.sessionId &&
      !currentSessionId
    ) {
      currentSessionId = `legacy-session-${activity.id}`;
    }

    const migrated: Activity = {
      ...activity,
      sessionId:
        activity.sessionId ??
        (SESSION_ACTIVITY_TYPES.has(activity.type)
          ? currentSessionId
          : undefined),
      operationId: activity.operationId ?? activity.id,
      recordSource: activity.recordSource ?? 'legacy',
    };

    if (TERMINAL_ACTIVITY_TYPES.has(migrated.type)) {
      currentSessionId = undefined;
    }
    return migrated;
  });

  return normalizeCarryoverActivities(migrated);
};

const isSameLocalDay = (left: number, right: number) => {
  const a = new Date(left);
  const b = new Date(right);
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
};

const reusableSessionId = (
  activities: Activity[],
  candidate?: string,
  now = Date.now(),
) => {
  if (!candidate) return undefined;
  const sessionActivities = activities.filter(
    (activity) => activity.sessionId === candidate,
  );
  const latest = sessionActivities[sessionActivities.length - 1];
  if (
    !latest ||
    !isSameLocalDay(latest.timestamp, now) ||
    sessionActivities.some((activity) =>
      TERMINAL_ACTIVITY_TYPES.has(activity.type),
    )
  ) {
    return undefined;
  }
  return candidate;
};

const recomputeInterphoneOutcomes = (
  activities: Activity[],
  affectedSessionId: string | undefined,
  activeSessionId: string | undefined,
) => {
  if (!affectedSessionId) return activities;
  const sessionPresses = activities.filter(
    (activity) =>
      activity.sessionId === affectedSessionId &&
      activity.type === 'interphone',
  );
  if (sessionPresses.length === 0) return activities;
  const responded = activities.some(
    (activity) =>
      activity.sessionId === affectedSessionId &&
      activity.type === 'interphone_response',
  );
  const latestPressId = sessionPresses[sessionPresses.length - 1].id;

  return activities.map((activity) => {
    if (
      activity.sessionId !== affectedSessionId ||
      activity.type !== 'interphone'
    ) {
      return activity;
    }
    const interphoneAttemptOutcome: Activity['interphoneAttemptOutcome'] =
      responded
        ? activity.id === latestPressId
          ? '応答'
          : '無応答'
        : activity.id === latestPressId &&
            activeSessionId === affectedSessionId
          ? undefined
          : '無応答';
    return { ...activity, interphoneAttemptOutcome };
  });
};

export const useCounterStore = create<CounterState>()(
  persist(
    (set, get) => ({
      activities: [],
      periodStartedAt: 0,
      activeSessionId: undefined,

      add: (type, details = {}, timestamp = Date.now(), requestedId) => {
        const id = requestedId ?? uid();
        set((state) => ({
          activities: [
            ...state.activities,
            { id, type, timestamp, ...details },
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

      setActiveSessionId: (activeSessionId) =>
        set((state) => ({
          activities:
            activeSessionId === state.activeSessionId
              ? state.activities
              : recomputeInterphoneOutcomes(
                  state.activities,
                  state.activeSessionId,
                  activeSessionId,
                ),
          activeSessionId,
        })),

      undoLast: () =>
        set((state) => {
          const last = state.activities[state.activities.length - 1];
          if (!last) return state;
          const remaining = last.operationId
            ? state.activities.filter(
                (activity) => activity.operationId !== last.operationId,
              )
            : state.activities.slice(0, -1);
          const activeStillExists =
            state.activeSessionId &&
            remaining.some(
              (activity) => activity.sessionId === state.activeSessionId,
            );
          const nextActiveSessionId = activeStillExists
            ? state.activeSessionId
            : undefined;
          return {
            activities: recomputeInterphoneOutcomes(
              remaining,
              last.sessionId,
              nextActiveSessionId,
            ),
            activeSessionId: nextActiveSessionId,
          };
        }),

      reset: () =>
        set((state) => ({
          activities: recomputeInterphoneOutcomes(
            state.activities,
            state.activeSessionId,
            undefined,
          ),
          periodStartedAt: Date.now(),
          activeSessionId: undefined,
        })),

      countOf: (type) =>
        get().activities.filter((activity) => activity.type === type).length,

      totalCount: () => get().activities.length,
    }),
    {
      name: 'sales-counter-store',
      version: 4,
      migrate: (persistedState) => {
        const state = persistedState as Partial<CounterState>;
        const activities = migrateActivities(state.activities ?? []);
        return {
          ...state,
          activities,
          periodStartedAt: state.periodStartedAt ?? 0,
          activeSessionId: reusableSessionId(
            activities,
            state.activeSessionId,
          ),
        } as CounterState;
      },
    },
  ),
);
