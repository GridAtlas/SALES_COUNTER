import type { Activity, FunnelStage } from '@/types';

export const FUNNEL_STAGE_ORDER: FunnelStage[] = [
  'interphone',
  'interphone_response',
  'face_to_face_contact',
  'appointment',
  'appointment_visit',
  'presentation',
  'sale',
];

export const PREREQUISITE_STAGE_ORDER = FUNNEL_STAGE_ORDER.slice(
  0,
  -1,
) as Exclude<FunnelStage, 'sale'>[];

export const reachedStageIndex = (stage?: FunnelStage) =>
  stage ? FUNNEL_STAGE_ORDER.indexOf(stage) : -1;

export const laterStage = <T extends FunnelStage>(
  left: T | undefined,
  right: T | undefined,
): T | undefined =>
  reachedStageIndex(left) >= reachedStageIndex(right) ? left : right;

export const normalizeCarryoverActivities = (
  activities: Activity[],
): Activity[] => {
  const priorStageBySession = new Map<
    string,
    Exclude<FunnelStage, 'sale'>
  >();

  activities.forEach((activity) => {
    if (
      activity.recordSource !== 'historical_confirmation' ||
      !activity.sessionId ||
      !PREREQUISITE_STAGE_ORDER.includes(
        activity.type as Exclude<FunnelStage, 'sale'>,
      )
    ) {
      return;
    }
    const stage = activity.type as Exclude<FunnelStage, 'sale'>;
    priorStageBySession.set(
      activity.sessionId,
      laterStage(priorStageBySession.get(activity.sessionId), stage) ?? stage,
    );
  });

  return activities
    .filter((activity) => activity.recordSource !== 'historical_confirmation')
    .map((activity) => {
      if (!activity.sessionId) return activity;
      const migratedStage = priorStageBySession.get(activity.sessionId);
      const priorReachedThrough = laterStage(
        activity.priorReachedThrough,
        migratedStage,
      );
      if (!priorReachedThrough) return activity;
      return {
        ...activity,
        sessionOrigin: 'carryover',
        priorReachedThrough,
      };
    });
};
