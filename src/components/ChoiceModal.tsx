'use client';

interface Props<T extends string> {
  title: string;
  description: string;
  options: readonly T[];
  onSelect: (value: T) => void;
  onCancel: () => void;
}

export function ChoiceModal<T extends string>({
  title,
  description,
  options,
  onSelect,
  onCancel,
}: Props<T>) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="w-full max-w-sm rounded-2xl bg-white p-4 shadow-xl"
      >
        <h2 className="text-center text-lg font-bold text-stone-800">
          {title}
        </h2>
        <p className="mt-1 text-center text-xs text-stone-500">
          {description}
        </p>

        <div className="mt-4 grid grid-cols-2 gap-3">
          {options.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => onSelect(option)}
              className="tap-target rounded-xl bg-blue-50 px-3 py-4 text-sm font-bold text-blue-700 active:bg-blue-100"
            >
              {option}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="tap-target mt-3 w-full rounded-xl bg-stone-100 px-3 py-2 text-sm font-semibold text-stone-600 active:bg-stone-200"
        >
          キャンセル
        </button>
      </div>
    </div>
  );
}
