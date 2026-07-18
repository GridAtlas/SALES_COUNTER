// SALES_COUNTER のドメイン型定義。

export type ActivityType =
  | 'office_departure' // オフィス出発
  | 'site_arrival' // 現場到着
  | 'interphone' // インターホン
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

export interface Activity {
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
    | 'teal';
  icon: string; // lucide-react のアイコン名
}
