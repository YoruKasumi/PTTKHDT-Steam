import { useMemo, useState } from 'react';
import DeveloperShell from '../../components/developer/DeveloperShell';
import NewProjectModal from '../../components/developer/NewProjectModal';
import { formatVnd } from '../../utils/format';

const initialProjects = [
  { id: 'GAME-01', title: 'R.E.P.O.', genres: 'Kinh dị Co-op, Hành động', status: 'Approved', build: 'v1.2.4', price: 180000, discount: 35, startDate: '2026-11-01', endDate: '2026-11-30' },
  { id: 'GAME-02', title: 'Tiny Pasture', genres: 'Mô phỏng, Phiêu lưu', status: 'Approved', build: 'v2.0.1', price: 95000, discount: 20, startDate: '2026-11-10', endDate: '2026-11-25' },
  { id: 'GAME-03', title: 'Cyber Odyssey 2088', genres: 'Nhập vai RPG, Hành động', status: 'Approved', build: 'v1.0.8', price: 450000, discount: 0 },
  { id: 'GAME-04', title: 'Sky: Light Awaits', genres: 'Phiêu lưu', status: 'Pending', build: 'v1.0.0', price: 250000, discount: 0 },
];

const panelClass = 'rounded-2xl border border-white/10 bg-card p-5';
const controlClass = 'mt-2 w-full rounded-lg border border-line bg-page px-3 py-2.5 text-sm text-white outline-none focus:border-accent';

function StatusBadge({ status }) {
  const isApproved = status === 'Approved';
  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${isApproved ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' : 'border-amber-500/30 bg-amber-500/10 text-amber-400'}`}>
      {isApproved ? '● Approved (Đang bán)' : '● Pending (Chờ duyệt)'}
    </span>
  );
}

export default function DeveloperGames() {
  const [projects, setProjects] = useState(initialProjects);
  const [showCreate, setShowCreate] = useState(false);
  const [priceGameId, setPriceGameId] = useState(initialProjects[0].id);
  const [newPrice, setNewPrice] = useState('');
  const [saleGameId, setSaleGameId] = useState(initialProjects[0].id);
  const [discount, setDiscount] = useState(25);
  const [startDate, setStartDate] = useState('2026-11-16');
  const [endDate, setEndDate] = useState('2026-11-30');
  const [message, setMessage] = useState('');

  const priceGame = projects.find((project) => project.id === priceGameId);
  const saleGame = projects.find((project) => project.id === saleGameId);
  const salePrice = saleGame ? Math.round(saleGame.price * (1 - Number(discount) / 100)) : 0;
  const saleCount = useMemo(() => projects.filter((project) => project.discount > 0).length, [projects]);

  const createProject = (project) => {
    const newProject = {
      ...project,
      id: `GAME-${String(projects.length + 1).padStart(2, '0')}`,
      genres: project.genres.join(', '),
      status: 'Pending',
      build: 'v1.0.0',
      discount: 0,
    };
    setProjects((current) => [...current, newProject]);
    setShowCreate(false);
    setMessage('Đã gửi yêu cầu. Xin vui lòng đợi xét duyệt của quản trị viên!');
  };

  const savePrice = (event) => {
    event.preventDefault();
    if (!priceGame) return;
    if (priceGame.discount > 0) {
      setMessage(`${priceGame.title} đang chạy Sale. Hãy kết thúc chiến dịch trước khi đổi giá gốc.`);
      return;
    }
    const price = Number(newPrice);
    if (!Number.isInteger(price) || price < 0) {
      setMessage('Giá bán mới phải là số nguyên VND không âm.');
      return;
    }
    setProjects((current) => current.map((project) => project.id === priceGame.id ? { ...project, price } : project));
    setMessage(`Đã cập nhật giá của ${priceGame.title} thành ${formatVnd(price)}.`);
  };

  const saveSale = (event) => {
    event.preventDefault();
    const percent = Number(discount);
    if (!saleGame || !Number.isInteger(percent) || percent < 1 || percent > 90) {
      setMessage('Mức giảm giá phải là số nguyên từ 1% đến 90%.');
      return;
    }
    if (!startDate || !endDate || startDate > endDate) {
      setMessage('Ngày bắt đầu và kết thúc của chiến dịch chưa hợp lệ.');
      return;
    }
    setProjects((current) => current.map((project) => project.id === saleGame.id
      ? { ...project, discount: percent, startDate, endDate }
      : project));
    setMessage(`Đã lưu chiến dịch Sale ${percent}% cho ${saleGame.title}.`);
  };

  const endSale = () => {
    if (!saleGame || saleGame.discount === 0) return;
    setProjects((current) => current.map((project) => project.id === saleGame.id
      ? { ...project, discount: 0, startDate: undefined, endDate: undefined }
      : project));
    setMessage(`Đã kết thúc chiến dịch Sale của ${saleGame.title}.`);
  };

  return (
    <DeveloperShell
      title="Danh mục Dự án Game của Nhà Phát Hành"
      description="Theo dõi trạng thái phát hành, build, giá niêm yết và chiến dịch khuyến mãi của Studio."
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ['Tổng dự án của Studio', `${projects.length} Tựa game`],
          ['Chiến dịch Sale đang chạy', `${saleCount} Chiến dịch`],
          ['Tổng bản quyền đã cấp (LICENSE)', '1,842 Bản'],
          ['Quy chuẩn ảnh Poster cửa hàng', 'Tỉ lệ 2:3 (180×270)'],
        ].map(([label, value], index) => (
          <section key={label} className={`${panelClass} ${index === 1 ? 'border-accent shadow-lg shadow-accent/10' : ''}`}>
            <p className="m-0 text-xs font-bold uppercase text-muted">{label}</p>
            <p className={`mb-0 mt-3 text-xl font-extrabold ${index === 1 ? 'text-accent-light' : ''}`}>{value}</p>
          </section>
        ))}
      </div>

      <section className={`${panelClass} min-w-0`}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
          <h2 className="m-0 text-lg font-bold">Danh mục Dự án Game của Nhà Phát Hành</h2>
          <button type="button" onClick={() => setShowCreate(true)} className="rounded-lg border border-accent/40 bg-accent/10 px-4 py-2 text-sm font-bold text-accent-light">
            + Thêm dự án game mới
          </button>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[1100px] border-collapse text-left text-sm">
            <thead className="bg-page text-xs uppercase text-muted">
              <tr>
                <th className="px-3 py-3">Tựa Game & Mã Dự Án</th>
                <th className="px-3 py-3">Trạng thái</th>
                <th className="px-3 py-3">Build hiện hành</th>
                <th className="px-3 py-3">Giá gốc</th>
                <th className="px-3 py-3">Chiến dịch Sale</th>
                <th className="px-3 py-3">Giá thực bán</th>
                <th className="px-3 py-3">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => (
                <tr key={project.id} className="border-b border-white/5 align-middle">
                  <td className="px-3 py-4">
                    <p className="m-0 font-bold">{project.title}</p>
                    <p className="m-0 mt-1 text-xs text-muted">{project.id} · {project.genres}</p>
                  </td>
                  <td className="px-3 py-4"><StatusBadge status={project.status} /></td>
                  <td className="px-3 py-4 font-mono text-accent-light">{project.build}</td>
                  <td className="whitespace-nowrap px-3 py-4 font-mono">{formatVnd(project.price)}</td>
                  <td className="px-3 py-4">
                    {project.discount > 0 ? (
                      <span className="whitespace-nowrap rounded-full bg-accent px-3 py-1 text-xs font-bold">
                        -{project.discount}% ({project.startDate} → {project.endDate})
                      </span>
                    ) : <span className="text-muted">Không giảm giá</span>}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 font-mono font-bold text-emerald-400">
                    {formatVnd(Math.round(project.price * (1 - project.discount / 100)))}
                  </td>
                  <td className="px-3 py-4">
                    <div className="flex gap-2">
                      <button type="button" onClick={() => { setPriceGameId(project.id); setNewPrice(String(project.price)); }} className="rounded-lg border border-line px-3 py-1.5 text-xs font-bold hover:border-accent">
                        Đổi giá VND
                      </button>
                      <button type="button" onClick={() => { setSaleGameId(project.id); setDiscount(project.discount || 25); }} className="rounded-lg border border-accent/30 bg-accent/10 px-3 py-1.5 text-xs font-bold text-accent-light">
                        Sale
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-2">
        <form onSubmit={savePrice} className={panelClass}>
          <h2 className="m-0 border-b border-white/10 pb-4 text-lg font-bold">Thiết lập giá bán VND</h2>
          <label className="mt-4 block text-sm font-semibold text-muted">
            Chọn tựa game cần điều chỉnh giá gốc
            <select value={priceGameId} onChange={(event) => { setPriceGameId(event.target.value); setNewPrice(String(projects.find((item) => item.id === event.target.value)?.price ?? '')); }} className={controlClass}>
              {projects.map((project) => <option key={project.id} value={project.id}>{project.title}</option>)}
            </select>
          </label>
          {priceGame?.discount ? (
            <p className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">
              <strong>CẢNH BÁO!</strong> {priceGame.title} đang trong chiến dịch Sale (-{priceGame.discount}%). Hệ thống khóa điều chỉnh giá gốc cho đến khi đợt Sale kết thúc.
            </p>
          ) : null}
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <p className="m-0 rounded-lg bg-page p-3 text-sm">Giá gốc hiện tại: <strong>{priceGame ? formatVnd(priceGame.price) : '—'}</strong></p>
            <label className="text-sm text-muted">
              Mức giá bán mới (VND ≥ 0)
              <input type="number" min="0" step="1" value={newPrice} onChange={(event) => setNewPrice(event.target.value)} className={controlClass} />
            </label>
          </div>
          <button type="submit" disabled={!priceGame || priceGame.discount > 0} className="mt-4 rounded-lg bg-accent px-4 py-2.5 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50">
            Cập nhật giá bán VND
          </button>
        </form>

        <form onSubmit={saveSale} className={panelClass}>
          <h2 className="m-0 border-b border-white/10 pb-4 text-lg font-bold">Lên chiến dịch khuyến mãi Sale</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-semibold text-muted">
              Chọn tựa game áp dụng Sale
              <select value={saleGameId} onChange={(event) => setSaleGameId(event.target.value)} className={controlClass}>
                {projects.map((project) => <option key={project.id} value={project.id}>{project.title}</option>)}
              </select>
            </label>
            <label className="text-sm font-semibold text-muted">
              Tỷ lệ giảm giá (1%–90%)
              <input type="number" min="1" max="90" value={discount} onChange={(event) => setDiscount(event.target.value)} className={controlClass} />
            </label>
            <label className="text-sm font-semibold text-muted">
              Ngày bắt đầu
              <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className={controlClass} />
            </label>
            <label className="text-sm font-semibold text-muted">
              Ngày kết thúc
              <input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} className={controlClass} />
            </label>
          </div>
          <p className="mt-4 rounded-lg border border-white/10 bg-page p-3 text-sm text-muted">
            Giá sau khuyến mãi dự kiến:{' '}
            <strong className="font-mono text-accent-light">{saleGame ? formatVnd(salePrice) : '—'}</strong>
          </p>
          <div className="flex flex-wrap justify-end gap-3">
            <button type="button" onClick={endSale} disabled={!saleGame || saleGame.discount === 0} className="rounded-lg border border-line px-4 py-2.5 text-sm font-bold disabled:opacity-50">
              Kết thúc đợt Sale hiện tại
            </button>
            <button type="submit" className="rounded-lg bg-accent px-4 py-2.5 text-sm font-bold">Lưu lịch chiến dịch Sale</button>
          </div>
        </form>
      </div>

      {message ? <p role="status" className="m-0 rounded-lg border border-accent/30 bg-card p-3 text-sm text-accent-light">{message}</p> : null}
      {showCreate ? <NewProjectModal onClose={() => setShowCreate(false)} onCreate={createProject} /> : null}
    </DeveloperShell>
  );
}
