import type { Activity, FaceContactKind } from '@/types';

export const isFaceContactActivity = (activity: Activity) =>
  activity.type === 'face_to_face_contact' ||
  activity.type === 'first_contact' ||
  activity.type === 'revisit';

export const faceContactKindOf = (
  activity: Activity,
): FaceContactKind | undefined => {
  if (activity.faceContactKind) return activity.faceContactKind;
  if (activity.type === 'first_contact') return '初回';
  if (activity.type === 'revisit') return '2回目以降';
  return undefined;
};

export const countFaceContacts = (
  activities: readonly Activity[],
  kind?: FaceContactKind,
) =>
  activities.filter(
    (activity) =>
      isFaceContactActivity(activity) &&
      (kind === undefined || faceContactKindOf(activity) === kind),
  ).length;
