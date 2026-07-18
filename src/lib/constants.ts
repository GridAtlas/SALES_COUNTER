import type { ActivityDef, AgeGroup } from '@/types';

/**
 * 訪問営業の移動・休憩と実施ファネル 14 項目。
 * 上から下へ、順序は保存されるので UI ではこの順で並べる。
 */
export const ACTIVITIES: ActivityDef[] = [
  { type: 'office_departure', label: 'オフィス出発', color: 'blue', icon: 'Building2' },
  { type: 'site_arrival', label: '現場到着', color: 'cyan', icon: 'MapPinCheck' },
  { type: 'interphone', label: 'インターホン', color: 'slate', icon: 'DoorClosed' },
  { type: 'interphone_response', label: 'インターホン応答', color: 'zinc', icon: 'PhoneCall' },
  { type: 'first_contact', label: '新規接触', color: 'sky', icon: 'UserPlus' },
  { type: 'revisit', label: '再訪接触', color: 'indigo', icon: 'RefreshCcw' },
  { type: 'appointment', label: 'アポ取得', color: 'amber', icon: 'CalendarCheck' },
  { type: 'appointment_visit', label: 'アポ訪問', color: 'rose', icon: 'MapPinHouse' },
  { type: 'presentation', label: 'プレゼン', color: 'orange', icon: 'Presentation' },
  { type: 'sale', label: 'セールス', color: 'emerald', icon: 'ShoppingBag' },
  { type: 'break_start', label: '休憩開始', color: 'violet', icon: 'Coffee' },
  { type: 'break_end', label: '休憩終了', color: 'fuchsia', icon: 'CirclePlay' },
  { type: 'site_departure', label: '現場出発', color: 'indigo', icon: 'LogOut' },
  { type: 'office_arrival', label: 'オフィス到着', color: 'teal', icon: 'Building' },
];

export const AGE_GROUPS: AgeGroup[] = [
  '10代以下',
  '20代',
  '30代',
  '40代',
  '50代',
  '60代',
  '70代',
  '80代以上',
  '不明',
];

export const getActivityDef = (type: string): ActivityDef | undefined =>
  ACTIVITIES.find((a) => a.type === type);
