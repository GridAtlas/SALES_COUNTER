// SALES_COUNTER のドメイン型定義。

export type ActivityType =
  | 'office_departure' // オフィス出発
  | 'site_arrival' // 現場到着
  | 'break_start' // 休憩開始
  | 'travel_start' // 移動開始
  | 'site_departure' // 現場出発
  | 'office_arrival' // オフィス到着
  | 'interphone' // インターホン
  | 'interphone_response' // インターホン応答
  | 'face_to_face_contact' // 対面接触
  | 'first_contact' // 新規接触（旧データ互換）
  | 'revisit' // 再訪接触（旧データ互換）
  | 'rejection_close' // 拒否クローズ
  | 'appointment' // アポ取得
  | 'appointment_visit' // アポ訪問
  | 'pre_presentation_rejection' // プレゼン前拒否
  | 'presentation' // プレゼン
  | 'post_presentation_rejection' // プレゼン後拒否
  | 'sale' // セールス
  | 'prospect' // 保留／見込
  | 'break_end'; // 休憩終了（旧データ互換）

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

export type CustomerStatus = '新規' | '既加入' | '過去解約';

export type FaceContactKind = '初回' | '2回目以降';

export type InterphoneResponseKind = '初回応答' | '2回目以降';

export type AppointmentVisitKind = '予定アポ' | '当日取得アポ';

export type AppointmentAcquisitionKind = '対面取得' | 'その他取得';

export type PresentationEntryKind = '即プレゼン' | 'アポ訪問';

export type SaleEntryKind = '新規プレゼン' | '保留／見込からの成約';

export type ProspectRating = 1 | 2 | 3 | 4 | 5;

export type PresentationLocation = '玄関外' | '玄関内' | '宅内';

export type RejectionReason =
  | '営業されたくない'
  | '必要性を感じない'
  | '料金が高い'
  | 'タイミングが悪い'
  | '私ではわからない'
  | 'やるなら連絡する' // 旧データ互換
  | 'その他';

export type ActivityRecordSource = 'manual' | 'auto_backfill' | 'legacy';

export type InterphoneAttemptOutcome = '無応答' | '応答';

export type GpsStatus =
  | 'disabled'
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
  faceContactKind?: FaceContactKind;
  customerStatus?: CustomerStatus;
  interphoneResponseKind?: InterphoneResponseKind;
  interphoneAttemptOutcome?: InterphoneAttemptOutcome;
  appointmentAcquisitionKind?: AppointmentAcquisitionKind;
  appointmentCategory?: AppointmentVisitKind;
  appointmentVisitKind?: AppointmentVisitKind;
  linkedAppointmentId?: string;
  linkedAppointmentLabel?: string;
  linkedProspectId?: string;
  linkedProspectLabel?: string;
  presentationEntryKind?: PresentationEntryKind;
  presentationLocation?: PresentationLocation;
  saleEntryKind?: SaleEntryKind;
  rejectionReason?: RejectionReason;
  rejectionReasonDetail?: string;
  appointmentDate?: string;
  appointmentStartTime?: string;
  appointmentEndTime?: string;
  appointmentMemo?: string;
  prospectRating?: ProspectRating;
  prospectComment?: string;
  sessionId?: string;
  operationId?: string;
  recordSource?: ActivityRecordSource;
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

export interface DailyReport {
  id: string;
  date: string;
  endedAt: number;
  savedAt: number;
  activities: Activity[];
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
