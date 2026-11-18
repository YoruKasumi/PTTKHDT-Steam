/** Màn hình đã có trong Figma nhưng chưa dựng. Hiện node Figma để biết cần đọc phần nào. */
export default function ScreenPlaceholder({ screen }) {
  return (
    <div className="mx-auto w-full max-w-[1698px] px-4 pb-20 pt-[60px] md:px-[76px]">
      <h1 className="m-0 mb-2 text-3xl font-bold">{screen.title}</h1>
      <p className="text-white/62">Màn hình này đã có trong Figma, chưa được dựng thành mã.</p>
      <dl className="mt-6 grid grid-cols-[180px_1fr] gap-x-4 gap-y-2">
        <dt className="text-white/62">Node Figma</dt>
        <dd className="m-0">{screen.node}</dd>
        <dt className="text-white/62">Chức năng backend</dt>
        <dd className="m-0">{screen.uc}</dd>
      </dl>
    </div>
  );
}
