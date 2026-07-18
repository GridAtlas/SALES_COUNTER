// SALES_COUNTER のドメイン型定義。

export type ActivityType =
  | 'office_departure' // オフィス出発
  | 'site_arrival' // 現場到着
  | 'interphone' // インターホン
  | 'interphone_response' // インターホン応答
  | 'first_contact' // 新規接触
  | 'revisit' // 再訪接触
  | 'rejection_close' // 拒否クローズ
  | 'appointment' // アポ取得
  | 'appointment_visit' // アポ訪問
  | 'pre_presentation_rejection' // プレゼン前拒否
  | 'presentation' // プレゼン
  | 'post_presentation_rejection' // プレゼン後拒否
  | 'sale' // セールス
  | 'break_start' // 休憩開始
  | 'break_end' // 休憩終了
  | 'site_departure' // 現場出発
  | 'office_arrival'; // オフィス到着

export type AgeGroup =
  | '10代以下'
  | '20代'
  | '30代'
  | '40代'
  | '50代'
  | '60代'
  | '70代'
  | '80代以上'
  | '不明';

export type CustomerStatus = '新規' | '既加入';

export type PresentationLocation = '玄関外' | '玄関内' | '宅内';

export type RejectionReason =
  | '営業されたくない'
  | '必要性を感じない'
  | '料金が高い'
  | 'やるなら連絡する'
  | 'その他';

export type GpsStatus =
  | 'pending'
  | 'captured'
  | 'denied'
  | 'unavailable'
  | 'timeout'
  | 'error';

export interface GpsDetails {
  gpsStatus: GpsStatus;
  gpsLatitude?: number;
  gpsLongitude?: number;
  gpsAccuracy?: number;
  gpsCapturedAt?: number;
}

export interface AppointmentDetails {
  appointmentDate: string;
  appointmentStartTime: string;
  appointmentEndTime: string;
  appointmentMemo?: string;
}

export interface ActivityDetails {
  ageGroup?: AgeGroup;
  customerStatus?: CustomerStatus;
  presentationLocation?: PresentationLocation;
  rejectionReason?: RejectionReason;
  rejectionReasonDetail?: string;
  appointmentDate?: string;
  appointmentStartTime?: string;
  appointmentEndTime?: string;
  appointmentMemo?: string;
  gpsStatus?: GpsStatus;
  gpsLatitude?: number;
  gpsLongitude?: number;
  gpsAccuracy?: number;
  gpsCapturedAt?: number;
}

export interface Activity extends ActivityDetails {
  id: string;
  type: ActivityType;
  timestamp: number; // ms epoch
}

export interface ActivityDef {
  type: ActivityType;
  label: string;
  color:
    | 'slate'
    | 'sky'
    | 'indigo'
    | 'amber'
    | 'rose'
    | 'orange'
    | 'emerald'
    | 'blue'
    | 'cyan'
    | 'violet'
    | 'fuchsia'
    | 'teal'
    | 'zinc'
    | 'red';
  icon: string; // lucide-react のアイコン名
}
