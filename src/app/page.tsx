'use client';

import { useEffect, useState } from 'react';
import { ActivityButton } from '@/components/ActivityButton';
import { BottomBar } from '@/components/BottomBar';
import { Header } from '@/components/Header';
import { ACTIVITIES } from '@/lib/constants';
import { useCounterStore } from '@/store/useCounterStore';

export default function HomePage() {
  // SSR ハイドレーション対策: localStorage を安全に読むため、初回は
  // 静的なゼロ値でレンダリング → mount 後に本物の store を反映。
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  const activities = useCounterStore((s) => s.activities);
  const add = useCounterStore((s) => s.add);
  const undoLast = useCounterStore((s) => s.undoLast);
  const reset = useCounterStore((s) => s.reset);

  const countOf = (type: string) =>
    hydrated ? activities.filter((a) => a.type === type).length : 0;
  const total = hydrated ? activities.length : 0;

  return (
    <>
      <Header totalCount={total} />

      <div className="px-3 grid grid-cols-2 gap-3">
        {ACTIVITIES.map((def) => (
          <ActivityButton
            key={def.type}
            def={def}
            count={countOf(def.type)}
            onTap={() => add(def.type)}
          />
        ))}
      </div>

      <BottomBar
        disableUndo={total === 0}
        onUndo={undoLast}
        onReset={reset}
      />
    </>
  );
}
