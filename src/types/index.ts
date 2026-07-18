// SALES_COUNTER のドメイン型定義。

export type ActivityType =
  | 'interphone' // インターホン
  | 'first_contact' // 新規接触
  | 'revisit' // 再訪接触
  | 'appointment' // アポ取得
  | 'presentation' // プレゼン
  | 'sale'; // セールス

export interface Activity {
  id: string;
  type: ActivityType;
  timestamp: number; // ms epoch
}

export interface ActivityDef {
  type: ActivityType;
  label: string;
  color: 'slate' | 'sky' | 'indigo' | 'amber' | 'orange' | 'emerald';
  icon: string; // lucide-react のアイコン名
}
