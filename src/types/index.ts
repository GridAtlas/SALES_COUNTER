// SALES_COUNTER のドメイン型定義。

export type ActivityType =
  | 'office_departure' // オフィス出発
  | 'site_arrival' // 現場到着
  | 'interphone' // インターホン
  | 'interphone_response' // インターホン応答
  | 'first_contact' // 新規接触
  | 'revisit' // 再訪接触
  | 'appointment' // アポ取得
  | 'appointment_visit' // アポ訪問
  | 'presentation' // プレゼン
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

export interface Activity {
  id: string;
  type: ActivityType;
  timestamp: number; // ms epoch
  ageGroup?: AgeGroup;
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
    | 'zinc';
  icon: string; // lucide-react のアイコン名
}
