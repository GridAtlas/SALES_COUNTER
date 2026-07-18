import type { ActivityDef } from '@/types';

/**
 * 訪問営業の実施ファネル 7 段。
 * 上から下へ、順序は保存されるので UI ではこの順で並べる。
 */
export const ACTIVITIES: ActivityDef[] = [
  { type: 'interphone', label: 'インターホン', color: 'slate', icon: 'DoorClosed' },
  { type: 'first_contact', label: '新規接触', color: 'sky', icon: 'UserPlus' },
  { type: 'revisit', label: '再訪接触', color: 'indigo', icon: 'RefreshCcw' },
  { type: 'appointment', label: 'アポ取得', color: 'amber', icon: 'CalendarCheck' },
  { type: 'appointment_visit', label: 'アポ訪問', color: 'rose', icon: 'MapPinHouse' },
  { type: 'presentation', label: 'プレゼン', color: 'orange', icon: 'Presentation' },
  { type: 'sale', label: 'セールス', color: 'emerald', icon: 'ShoppingBag' },
];

export const getActivityDef = (type: string): ActivityDef | undefined =>
  ACTIVITIES.find((a) => a.type === type);
