'use client';

interface Props {
  activityCount: number;
  reportDate: string;
  willUpdate: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ActivityEndModal({
  activityCount,
  reportDate,
  willUpdate,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="activity-end-title"
        className="w-full max-w-sm rounded-2xl bg-white p-4 shadow-xl"
      >
        <h2
          id="activity-end-title"
          className="text-center text-lg font-bold text-slate-800"
        >
          営業稼働を終了しますか？
        </h2>
        <p className="mt-2 text-center text-sm leading-relaxed text-slate-600">
          {reportDate} の活動 {activityCount} 件を
          <br />
          デイリー記録として{willUpdate ? '更新' : '保存'}します。
        </p>
        <p className="mt-2 rounded-xl bg-slate-50 px-3 py-2 text-center text-xs text-slate-500">
          現在のカウンターと履歴はそのまま残ります
        </p>

        <button
          type="button"
          onClick={onConfirm}
          className="tap-target mt-4 w-full rounded-xl bg-rose-600 px-3 py-2 text-sm font-bold text-white active:bg-rose-700"
        >
          活動終了を確認して{willUpdate ? '更新' : '保存'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="tap-target mt-2 w-full rounded-xl bg-stone-100 px-3 py-2 text-sm font-semibold text-stone-600 active:bg-stone-200"
        >
          キャンセル
        </button>
      </div>
    </div>
  );
}
