'use client';

import { useState } from 'react';
import {
  Building,
  Building2,
  CirclePlay,
  Coffee,
  LogOut,
  MapPinCheck,
  DoorClosed,
  UserPlus,
  RefreshCcw,
  CalendarCheck,
  MapPinHouse,
  Presentation,
  ShoppingBag,
  type LucideIcon,
} from 'lucide-react';
import type { ActivityDef } from '@/types';

// アイコン名 → コンポーネントのマップ。lucide の tree-shake を効かせるため
// 使う分だけを import してマップに載せる（constants に文字列で持たせて
// ここで解決するアプローチ）。
const ICONS: Record<string, LucideIcon> = {
  Building,
  Building2,
  CirclePlay,
  Coffee,
  LogOut,
  MapPinCheck,
  DoorClosed,
  UserPlus,
  RefreshCcw,
  CalendarCheck,
  MapPinHouse,
  Presentation,
  ShoppingBag,
};

interface Props {
  def: ActivityDef;
  count: number;
  onTap: () => void;
}

export function ActivityButton({ def, count, onTap }: Props) {
  const [pulse, setPulse] = useState(false);
  const Icon = ICONS[def.icon] ?? UserPlus;
  const color = def.color;

  const handleTap = () => {
    setPulse(true);
    onTap();
    // 短時間でリセット。連打時も再トリガーされる。
    setTimeout(() => setPulse(false), 180);
  };

  return (
    <button
      type="button"
      onClick={handleTap}
      className={[
        'tap-target relative flex flex-col items-center justify-center',
        'min-h-16 rounded-xl px-1 py-1.5 shadow-sm select-none',
        `bg-${color}-500 active:bg-${color}-600`,
        'text-white font-semibold',
        'transition-transform duration-150',
        pulse ? 'scale-95' : 'scale-100',
      ].join(' ')}
      aria-label={def.label}
    >
      <Icon size={21} strokeWidth={2.2} className="mb-0.5" />
      <span className="text-[11px] leading-tight whitespace-nowrap">{def.label}</span>
      <span className="num text-xl mt-0.5 leading-none">{count}</span>
    </button>
  );
}
