/** Ô nhập kiểu Figma: nền đen, viền #281e3c, biểu tượng emoji phía trước. */
export default function Field({ label, icon, right, error, className = '', id, ...input }) {
  return (
    <div className={className}>
      <div className="mb-2 flex items-center justify-between">
        <label htmlFor={id} className="text-xs font-bold text-muted">{label}</label>
        {right}
      </div>
      <div className="relative">
        <span className="pointer-events-none absolute left-[13px] top-1/2 -translate-y-1/2 text-xs" aria-hidden="true">{icon}</span>
        <input
          id={id}
          className={`h-[54px] w-full rounded-[10px] border bg-black pl-10 pr-12 text-[13px] text-white outline-none placeholder:text-muted focus:border-accent ${
            error ? 'border-red-500' : 'border-line'
          }`}
          {...input}
        />
      </div>
      {error ? <p className="mt-1 text-[11px] text-red-400">{error}</p> : null}
    </div>
  );
}
