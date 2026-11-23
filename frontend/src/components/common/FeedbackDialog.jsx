import { useEffect } from 'react';

export default function FeedbackDialog({ open, title = 'Thông báo', message, tone = 'success', onClose, onConfirm, confirmLabel = 'Đồng ý', cancelLabel = 'Hủy' }) {
  useEffect(() => {
    if (!open) return undefined;
    const closeOnEscape = (event) => { if (event.key === 'Escape' && !onConfirm) onClose?.(); };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [open, onClose, onConfirm]);

  if (!open) return null;
  const toneClass = tone === 'error' ? 'border-rose-400/40 text-rose-200' : 'border-accent/40 text-accent-light';
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget && !onConfirm) onClose?.(); }}>
      <section role={onConfirm ? 'alertdialog' : 'dialog'} aria-modal="true" aria-labelledby="feedback-dialog-title" className={`w-full max-w-md rounded-2xl border bg-card p-6 shadow-2xl shadow-black/60 ${toneClass}`}>
        <div className="flex items-start justify-between gap-4">
          <h2 id="feedback-dialog-title" className="m-0 text-xl font-bold text-white">{title}</h2>
          {!onConfirm ? <button type="button" aria-label="Đóng thông báo" onClick={onClose} className="rounded-lg border border-line px-2.5 py-1 text-muted hover:text-white">✕</button> : null}
        </div>
        <p className="mb-0 mt-4 whitespace-pre-wrap text-sm leading-6 text-zinc-200">{message}</p>
        <div className="mt-6 flex justify-end gap-3">
          {onConfirm ? <>
            <button type="button" onClick={onClose} className="rounded-lg border border-line px-4 py-2.5 font-semibold text-muted hover:text-white">{cancelLabel}</button>
            <button type="button" onClick={onConfirm} className="rounded-lg bg-accent px-4 py-2.5 font-bold text-white hover:bg-accent/80">{confirmLabel}</button>
          </> : <button type="button" onClick={onClose} className="rounded-lg bg-accent px-4 py-2.5 font-bold text-white hover:bg-accent/80">Đóng</button>}
        </div>
      </section>
    </div>
  );
}
