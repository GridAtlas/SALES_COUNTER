import type {
  ActivityDef,
  AgeGroup,
  AppointmentAcquisitionKind,
  AppointmentVisitKind,
  FaceContactKind,
  InterphoneResponseKind,
  PresentationEntryKind,
  PresentationLocation,
  ProspectRating,
  RejectionReason,
  SaleEntryKind,
} from '@/types';

/**
 * 訪問営業の移動・休憩と実施ファネル 17 項目。
 * 上から下へ、順序は保存されるので UI ではこの順で並べる。
 */
export const ACTIVITIES: ActivityDef[] = [
  { type: 'office_departure', label: 'オフィス出発', color: 'blue', icon: 'Building2' },
  { type: 'site_arrival', label: '現場到着', color: 'cyan', icon: 'MapPinCheck' },
  { type: 'break_start', label: '休憩開始', color: 'violet', icon: 'Coffee' },
  { type: 'travel_start', label: '移動開始', color: 'blue', icon: 'Navigation' },
  { type: 'site_departure', label: '現場出発', color: 'indigo', icon: 'LogOut' },
  { type: 'office_arrival', label: 'オフィス到着', color: 'teal', icon: 'Building' },
  { type: 'interphone', label: 'インターホン押下', color: 'slate', icon: 'DoorClosed' },
  { type: 'interphone_response', label: 'インターホン応答', color: 'zinc', icon: 'PhoneCall' },
  { type: 'face_to_face_contact', label: '対面接触', color: 'sky', icon: 'UserPlus' },
  { type: 'rejection_close', label: '拒否クローズ', color: 'red', icon: 'CircleX' },
  { type: 'appointment', label: 'アポ取得', color: 'amber', icon: 'CalendarCheck' },
  { type: 'appointment_visit', label: 'アポ訪問', color: 'rose', icon: 'MapPinHouse' },
  { type: 'pre_presentation_rejection', label: 'プレゼン前拒否', color: 'red', icon: 'CircleX' },
  { type: 'presentation', label: 'プレゼン', color: 'orange', icon: 'Presentation' },
  { type: 'post_presentation_rejection', label: 'プレゼン後拒否', color: 'red', icon: 'CircleX' },
  { type: 'prospect', label: '保留／見込', color: 'amber', icon: 'Star' },
  { type: 'sale', label: 'セールス', color: 'emerald', icon: 'ShoppingBag' },
];

const LEGACY_ACTIVITIES: ActivityDef[] = [
  { type: 'first_contact', label: '新規接触', color: 'sky', icon: 'UserPlus' },
  { type: 'revisit', label: '再訪接触', color: 'indigo', icon: 'RefreshCcw' },
  { type: 'break_end', label: '休憩終了', color: 'fuchsia', icon: 'CirclePlay' },
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

export const FACE_CONTACT_KINDS: FaceContactKind[] = [
  '初回',
  '2回目以降',
];

export const INTERPHONE_RESPONSE_KINDS: InterphoneResponseKind[] = [
  '初回応答',
  '2回目以降',
];

export const APPOINTMENT_VISIT_KINDS: AppointmentVisitKind[] = [
  '予定アポ',
  '当日取得アポ',
];

export const APPOINTMENT_ACQUISITION_KINDS: AppointmentAcquisitionKind[] = [
  '対面取得',
  'その他取得',
];

export const PRESENTATION_ENTRY_KINDS: PresentationEntryKind[] = [
  '即プレゼン',
  'アポ訪問',
];

export const SALE_ENTRY_KINDS: SaleEntryKind[] = [
  '新規プレゼン',
  '保留／見込からの成約',
];

export const PROSPECT_RATINGS: ProspectRating[] = [1, 2, 3, 4, 5];

export const PRESENTATION_LOCATIONS: PresentationLocation[] = [
  '玄関外',
  '玄関内',
  '宅内',
];

export const REJECTION_REASONS: RejectionReason[] = [
  '営業されたくない',
  '必要性を感じない',
  '料金が高い',
  'タイミングが悪い',
  '私ではわからない',
  'その他',
];

export const getActivityDef = (type: string): ActivityDef | undefined =>
  [...ACTIVITIES, ...LEGACY_ACTIVITIES].find((activity) => activity.type === type);
