"use client";

type Props = {
  title: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

// Vystředěný potvrzovací modal (mazání apod.). Renderuje se na úrovni stránky,
// aby nebyl uvězněný ve stacking kontextu seznamu a překryl i spodní navigaci.
export function ConfirmDialog({
  title,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
}: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-8"
      style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
      onClick={onCancel}
    >
      <div
        className="bg-white w-full max-w-sm rounded-3xl shadow-xl p-6 flex flex-col gap-5"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-center text-lg font-semibold text-ink">{title}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 h-14 rounded-full border border-sanddark bg-cream font-bold text-ink transition active:scale-[0.98]"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 h-14 rounded-full bg-brand text-white font-bold transition active:scale-[0.98]"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
