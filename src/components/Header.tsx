'use client';

interface Props {
  totalCount: number;
}

export function Header({ totalCount }: Props) {
  return (
    <header className="px-4 pt-2 pb-3 flex items-baseline justify-between">
      <h1 className="text-lg font-bold text-stone-700">SALES COUNTER</h1>
      <div className="text-sm text-stone-500">
        合計 <span className="num font-bold text-stone-800">{totalCount}</span>
      </div>
    </header>
  );
}
