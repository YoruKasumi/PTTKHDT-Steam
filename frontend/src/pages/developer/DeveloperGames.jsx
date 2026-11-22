import { useCallback, useEffect, useMemo, useState } from 'react';
import DeveloperShell from '../../components/developer/DeveloperShell';
import NewProjectModal from '../../components/developer/NewProjectModal';
import { formatVnd } from '../../utils/format';
import { gameApi } from '../../api/game';
import http from '../../api/http';

// ─── Lớp CSS dùng lại ────────────────────────────────────────────────────────
const panelClass = 'rounded-2xl border border-white/10 bg-card p-5';
const controlClass =
  'mt-2 w-full rounded-lg border border-line bg-page px-3 py-2.5 text-sm text-white outline-none focus:border-accent';
const inputClass =
  'mt-1.5 w-full rounded-lg border border-line bg-page px-3 py-2.5 text-sm text-white outline-none focus:border-accent';

// ─── Hàm định dạng dung lượng ────────────────────────────────────────────────
function formatBytes(bytes) {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

// ─── Badge trạng thái phát hành ──────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    Approved: { label: '● Approved (Đang bán)', cls: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' },
    Pending: { label: '● Pending (Chờ duyệt)', cls: 'border-amber-500/30 bg-amber-500/10 text-amber-400' },
    Rejected: { label: '● Rejected (Bị từ chối)', cls: 'border-red-500/30 bg-red-500/10 text-red-400' },
    Delisted: { label: '● Delisted (Đã gỡ)', cls: 'border-gray-500/30 bg-gray-500/10 text-gray-400' },
    Hidden: { label: '● Hidden (Đang ẩn)', cls: 'border-purple-500/30 bg-purple-500/10 text-purple-400' },
  };
  const { label, cls } = map[status] ?? { label: `● ${status}`, cls: 'border-white/20 text-muted' };
  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${cls}`}>{label}</span>
  );
}

// ─── Badge DRM ───────────────────────────────────────────────────────────────
function DrmBadge({ hasDrmJs, hasManifest, status }) {
  if (status === 'Pending') {
    return (
      <span className="inline-flex rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-xs font-bold text-amber-400">
        ⏳ Chờ duyệt
      </span>
    );
  }
  if (hasDrmJs && hasManifest) {
    return (
      <span className="inline-flex rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-xs font-bold text-emerald-400">
        ✅ DRM tích hợp sẵn
      </span>
    );
  }
  return (
    <span className="inline-flex rounded-full border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 text-xs font-bold text-blue-400">
      🔧 Auto-DRM bởi nền tảng
    </span>
  );
}

// ─── Modal Upload Patch ───────────────────────────────────────────────────────
function UploadPatchModal({ game, onClose, onSuccess }) {
  const [versionNumber, setVersionNumber] = useState('');
  const [changeLog, setChangeLog] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    if (!versionNumber.trim()) { setError('Nhập số phiên bản mới (VD: 1.1.0).'); return; }
    if (!file || !file.name.toLowerCase().endsWith('.zip')) {
      setError('Chọn tệp .zip hợp lệ.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('gameId', game.id ?? game.GameID);
      formData.append('versionNumber', versionNumber.trim());
      formData.append('changeLog', changeLog.trim() || `Cập nhật v${versionNumber.trim()}`);
      formData.append('buildFile', file);
      const res = await gameApi.uploadPatch(formData);
      onSuccess(res);
    } catch (err) {
      setError(err?.response?.data?.message ?? err?.message ?? 'Lỗi upload patch.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
      <section className="w-full max-w-[500px] rounded-2xl border border-indigo-900 bg-zinc-950 p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-bold">Upload Patch — {game.title}</h3>
          <button onClick={onClose} className="text-muted hover:text-white">✕</button>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <label className="block text-sm text-muted">
            Số phiên bản mới (VD: 1.1.0)
            <input
              value={versionNumber}
              onChange={(e) => setVersionNumber(e.target.value)}
              placeholder="1.1.0"
              className={inputClass}
            />
          </label>
          <label className="block text-sm text-muted">
            Changelog
            <textarea
              value={changeLog}
              onChange={(e) => setChangeLog(e.target.value)}
              rows="2"
              placeholder="Mô tả nội dung cập nhật..."
              className={inputClass}
            />
          </label>
          <label className="block text-sm text-muted">
            Tệp build mới (.zip)
            <input
              type="file"
              accept=".zip,application/zip"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className={`${inputClass} file:mr-3 file:rounded file:border-0 file:bg-accent file:px-2 file:py-1 file:text-white`}
            />
          </label>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg border border-line bg-page px-4 py-2 text-sm font-bold">
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-bold disabled:opacity-50"
            >
              {loading ? '⏳ Đang upload...' : 'Upload Patch'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

// ─── Modal Rollback ───────────────────────────────────────────────────────────
function RollbackModal({ game, onClose, onSuccess }) {
  const gameId = game.id ?? game.GameID;
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [rolling, setRolling] = useState(false);

  useEffect(() => {
    gameApi.listVersions(gameId)
      .then((res) => {
        const list = Array.isArray(res) ? res : (res?.items || []);
        setVersions(list);
        // Chọn mặc định phiên bản không current đầu tiên
        const nonCurrent = list.find((v) => !v.IsCurrent && !v.isCurrent);
        if (nonCurrent) setSelectedId(nonCurrent.VersionID ?? nonCurrent.versionId ?? '');
      })
      .catch((err) => setError(err?.response?.data?.message ?? 'Không tải được danh sách phiên bản.'))
      .finally(() => setLoading(false));
  }, [gameId]);

  const doRollback = async () => {
    if (!selectedId) return;
    setRolling(true);
    try {
      const res = await gameApi.rollback(gameId, selectedId);
      onSuccess(res);
    } catch (err) {
      setError(err?.response?.data?.message ?? 'Rollback thất bại.');
      setRolling(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
      <section className="w-full max-w-[520px] rounded-2xl border border-indigo-900 bg-zinc-950 p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-bold">Rollback phiên bản — {game.title}</h3>
          <button onClick={onClose} className="text-muted hover:text-white">✕</button>
        </div>

        {loading && <p className="text-sm text-muted">Đang tải danh sách phiên bản...</p>}
        {error && <p className="text-sm text-red-400">{error}</p>}

        {!loading && !error && (
          <>
            <table className="w-full border-collapse text-sm">
              <thead className="bg-page text-xs uppercase text-muted">
                <tr>
                  <th className="px-3 py-2">Phiên bản</th>
                  <th className="px-3 py-2">Ngày upload</th>
                  <th className="px-3 py-2">Trạng thái</th>
                  <th className="px-3 py-2">Chọn</th>
                </tr>
              </thead>
              <tbody>
                {versions.map((v) => {
                  const vid = v.VersionID ?? v.versionId;
                  const isCurrent = v.IsCurrent === 1 || v.IsCurrent === true || v.isCurrent;
                  return (
                    <tr key={vid} className="border-b border-white/5">
                      <td className="px-3 py-2 font-mono text-accent-light">
                        v{v.VersionNumber ?? v.versionNumber}
                      </td>
                      <td className="px-3 py-2 text-muted text-xs">
                        {v.UploadDate ? new Date(v.UploadDate).toLocaleDateString('vi-VN') : '—'}
                      </td>
                      <td className="px-3 py-2">
                        {isCurrent ? (
                          <span className="text-xs font-bold text-emerald-400">● Hiện hành</span>
                        ) : (
                          <span className="text-xs text-muted">Cũ</span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        {!isCurrent && (
                          <input
                            type="radio"
                            name="rollback-version"
                            value={vid}
                            checked={selectedId === vid}
                            onChange={() => setSelectedId(vid)}
                          />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {versions.length < 2 && (
              <p className="mt-3 text-sm text-amber-400">
                ⚠ Cần ít nhất 2 phiên bản để thực hiện rollback.
              </p>
            )}

            <div className="mt-4 flex justify-end gap-3">
              <button onClick={onClose} className="rounded-lg border border-line bg-page px-4 py-2 text-sm font-bold">
                Hủy
              </button>
              <button
                onClick={doRollback}
                disabled={!selectedId || rolling || versions.length < 2}
                className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
              >
                {rolling ? '⏳ Đang hoàn nguyên...' : '↩ Hoàn nguyên phiên bản'}
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

// ─── Trang chính DeveloperGames ───────────────────────────────────────────────
export default function DeveloperGames() {
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [projectsError, setProjectsError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [patchTarget, setPatchTarget] = useState(null);   // game đang upload patch
  const [rollbackTarget, setRollbackTarget] = useState(null); // game đang rollback
  const [priceGameId, setPriceGameId] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [saleGameId, setSaleGameId] = useState('');
  const [discount, setDiscount] = useState(25);
  const [startDate, setStartDate] = useState('2026-11-16');
  const [endDate, setEndDate] = useState('2026-11-30');
  const [message, setMessage] = useState('');

  // ── Tải danh sách game của developer từ API ──────────────────────────────
  const loadProjects = useCallback(async () => {
    setLoadingProjects(true);
    setProjectsError('');
    try {
      const response = await gameApi.listMyGames();
      const list = (Array.isArray(response) ? response : []).map((game) => ({
        id: game.GameID,
        title: game.Title,
        genres: game.Genres || '—',
        status: game.Status,
        build: game.VersionNumber ? `v${game.VersionNumber}` : 'v1.0.0',
        price: Number(game.Price || 0),
        discount: Number(game.Discount || 0),
        startDate: game.SaleStart,
        endDate: game.SaleEnd,
        fileSize: game.FileSize,
        sha256: game.Sha256,
        hasDrmJs: game.HasDrmJs || false,
        hasManifest: game.HasManifest || false,
      }));
      // Endpoint đã có dữ liệu thật; danh sách rỗng được hiển thị như trạng thái chưa có dự án, không thay bằng mock.
      setProjects(list);
      if (!priceGameId && list.length) setPriceGameId(list[0].id);
      if (!saleGameId && list.length) setSaleGameId(list[0].id);
    } catch (error) {
      setProjectsError(error?.message || 'Không thể tải danh sách dự án.');
    } finally {
      setLoadingProjects(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { loadProjects(); }, [loadProjects]);

  // Khởi tạo selector khi projects thay đổi
  useEffect(() => {
    if (projects.length && !priceGameId) setPriceGameId(projects[0].id);
    if (projects.length && !saleGameId) setSaleGameId(projects[0].id);
  }, [projects]); // eslint-disable-line react-hooks/exhaustive-deps

  const priceGame = projects.find((p) => p.id === priceGameId);
  const saleGame = projects.find((p) => p.id === saleGameId);
  const salePrice = saleGame ? Math.round(saleGame.price * (1 - Number(discount) / 100)) : 0;
  const saleCount = useMemo(() => projects.filter((p) => p.discount > 0).length, [projects]);

  // ── Tạo dự án mới (callback từ modal) ────────────────────────────────────
  const handleCreate = (data) => {
    setProjects((current) => [...current, { ...data, discount: 0 }]);
    setShowCreate(false);
    setMessage('Đã gửi yêu cầu. Vui lòng chờ Manager kiểm duyệt!');
    if (!priceGameId) setPriceGameId(data.gameId);
    if (!saleGameId) setSaleGameId(data.gameId);
  };

  // ── Upload patch thành công ───────────────────────────────────────────────
  const handlePatchSuccess = (data) => {
    setProjects((current) =>
      current.map((p) =>
        p.id === (patchTarget?.id ?? patchTarget?.GameID)
          ? { ...p, build: `v${data.versionNumber ?? ''}`, sha256: data.sha256, fileSize: data.fileSize }
          : p,
      ),
    );
    setPatchTarget(null);
    setMessage(`Đã upload patch v${data.versionNumber} thành công!`);
  };

  // ── Rollback thành công ───────────────────────────────────────────────────
  const handleRollbackSuccess = (data) => {
    setProjects((current) =>
      current.map((p) =>
        p.id === (rollbackTarget?.id ?? rollbackTarget?.GameID)
          ? { ...p, build: `v${data.versionNumber ?? ''}` }
          : p,
      ),
    );
    setRollbackTarget(null);
    setMessage(`Đã hoàn nguyên về phiên bản v${data.versionNumber ?? ''} thành công!`);
  };

  // ── Lưu giá bán (mock — gọi API thực khi có endpoint) ───────────────────
  const savePrice = async (event) => {
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
    try {
      await http.post('/game/yeuCauThietLapGia', { gameId: priceGame.id, newPrice: price });
    } catch (error) {
      setMessage(error?.message || 'Không thể cập nhật giá bán.');
      return;
    }
    setProjects((current) =>
      current.map((p) => (p.id === priceGame.id ? { ...p, price } : p)),
    );
    setMessage(`Đã cập nhật giá của ${priceGame.title} thành ${formatVnd(price)}.`);
  };

  // ── Lưu chiến dịch Sale (mock) ───────────────────────────────────────────
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
    setProjects((current) =>
      current.map((p) =>
        p.id === saleGame.id ? { ...p, discount: percent, startDate, endDate } : p,
      ),
    );
    setMessage(`Đã lưu chiến dịch Sale ${percent}% cho ${saleGame.title}.`);
  };

  const endSale = () => {
    if (!saleGame || saleGame.discount === 0) return;
    setProjects((current) =>
      current.map((p) =>
        p.id === saleGame.id ? { ...p, discount: 0, startDate: undefined, endDate: undefined } : p,
      ),
    );
    setMessage(`Đã kết thúc chiến dịch Sale của ${saleGame.title}.`);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <DeveloperShell
      title="Danh mục Dự án Game của Nhà Phát Hành"
      description="Theo dõi trạng thái phát hành, build, giá niêm yết và chiến dịch khuyến mãi của Studio."
    >
      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ['Tổng dự án của Studio', `${projects.length} Tựa game`],
          ['Chiến dịch Sale đang chạy', `${saleCount} Chiến dịch`],
          ['Tổng bản quyền đã cấp (LICENSE)', '—'],
          ['Quy chuẩn ảnh Poster cửa hàng', 'Tỉ lệ 2:3 (180×270)'],
        ].map(([label, value], index) => (
          <section
            key={label}
            className={`${panelClass} ${index === 1 ? 'border-accent shadow-lg shadow-accent/10' : ''}`}
          >
            <p className="m-0 text-xs font-bold uppercase text-muted">{label}</p>
            <p className={`mb-0 mt-3 text-xl font-extrabold ${index === 1 ? 'text-accent-light' : ''}`}>
              {value}
            </p>
          </section>
        ))}
      </div>

      {/* Bảng danh sách game */}
      <section className={`${panelClass} min-w-0`}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
          <h2 className="m-0 text-lg font-bold">Danh mục Dự án Game của Nhà Phát Hành</h2>
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="rounded-lg border border-accent/40 bg-accent/10 px-4 py-2 text-sm font-bold text-accent-light"
          >
            + Thêm dự án game mới
          </button>
        </div>

        {projectsError ? (
          <p role="alert" className="mt-6 text-center text-red-400">{projectsError}</p>
        ) : loadingProjects ? (
          <p className="mt-6 text-center text-muted">Đang tải danh sách game...</p>
        ) : projects.length === 0 ? (
          <p className="mt-6 text-center text-muted">
            Bạn chưa có dự án nào. Nhấn &ldquo;+ Thêm dự án game mới&rdquo; để bắt đầu.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[1200px] border-collapse text-left text-sm">
              <thead className="bg-page text-xs uppercase text-muted">
                <tr>
                  <th className="px-3 py-3">Tựa Game & Mã Dự Án</th>
                  <th className="px-3 py-3">Trạng thái</th>
                  <th className="px-3 py-3">Build hiện hành</th>
                  <th className="px-3 py-3">DRM</th>
                  <th className="px-3 py-3">Dung lượng / SHA-256</th>
                  <th className="px-3 py-3">Giá gốc</th>
                  <th className="px-3 py-3">Sale</th>
                  <th className="px-3 py-3">Giá thực bán</th>
                  <th className="px-3 py-3">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project) => (
                  <tr key={project.id} className="border-b border-white/5 align-middle">
                    <td className="px-3 py-4">
                      <p className="m-0 font-bold">{project.title}</p>
                      <p className="m-0 mt-1 text-xs text-muted">
                        {project.id} · {project.genres}
                      </p>
                    </td>
                    <td className="px-3 py-4">
                      <StatusBadge status={project.status} />
                    </td>
                    <td className="px-3 py-4 font-mono text-accent-light">{project.build}</td>
                    <td className="px-3 py-4">
                      <DrmBadge
                        hasDrmJs={project.hasDrmJs}
                        hasManifest={project.hasManifest}
                        status={project.status}
                      />
                    </td>
                    <td className="px-3 py-4">
                      <p className="m-0 text-xs text-muted">{formatBytes(project.fileSize)}</p>
                      {project.sha256 && (
                        <p className="m-0 mt-0.5 font-mono text-xs text-muted" title={project.sha256}>
                          {project.sha256.slice(0, 12)}…
                        </p>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 font-mono">
                      {formatVnd(project.price)}
                    </td>
                    <td className="px-3 py-4">
                      {project.discount > 0 ? (
                        <span className="whitespace-nowrap rounded-full bg-accent px-3 py-1 text-xs font-bold">
                          -{project.discount}% ({project.startDate} → {project.endDate})
                        </span>
                      ) : (
                        <span className="text-muted">Không giảm</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 font-mono font-bold text-emerald-400">
                      {formatVnd(Math.round(project.price * (1 - project.discount / 100)))}
                    </td>
                    <td className="px-3 py-4">
                      <div className="flex flex-col gap-1.5">
                        <button
                          type="button"
                          onClick={() => { setPriceGameId(project.id); setNewPrice(String(project.price)); }}
                          className="rounded-lg border border-line px-3 py-1.5 text-xs font-bold hover:border-accent"
                        >
                          Đổi giá
                        </button>
                        <button
                          type="button"
                          onClick={() => { setSaleGameId(project.id); setDiscount(project.discount || 25); }}
                          className="rounded-lg border border-accent/30 bg-accent/10 px-3 py-1.5 text-xs font-bold text-accent-light"
                        >
                          Sale
                        </button>
                        <button
                          type="button"
                          onClick={() => setPatchTarget(project)}
                          className="rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-1.5 text-xs font-bold text-blue-400"
                        >
                          Upload Patch
                        </button>
                        <button
                          type="button"
                          onClick={() => setRollbackTarget(project)}
                          className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-bold text-amber-400"
                        >
                          ↩ Rollback
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Panel thiết lập giá + Sale */}
      {projects.length > 0 && (
        <div className="grid gap-5 xl:grid-cols-2">
          {/* Thiết lập giá */}
          <form onSubmit={savePrice} className={panelClass}>
            <h2 className="m-0 border-b border-white/10 pb-4 text-lg font-bold">Thiết lập giá bán VND</h2>
            <label className="mt-4 block text-sm font-semibold text-muted">
              Chọn tựa game cần điều chỉnh giá gốc
              <select
                value={priceGameId}
                onChange={(event) => {
                  setPriceGameId(event.target.value);
                  setNewPrice(
                    String(projects.find((item) => item.id === event.target.value)?.price ?? ''),
                  );
                }}
                className={controlClass}
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
            </label>
            {priceGame?.discount ? (
              <p className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">
                <strong>CẢNH BÁO!</strong> {priceGame.title} đang trong chiến dịch Sale (-
                {priceGame.discount}%). Hệ thống khóa điều chỉnh giá gốc cho đến khi đợt Sale kết thúc.
              </p>
            ) : null}
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <p className="m-0 rounded-lg bg-page p-3 text-sm">
                Giá gốc hiện tại: <strong>{priceGame ? formatVnd(priceGame.price) : '—'}</strong>
              </p>
              <label className="text-sm text-muted">
                Mức giá bán mới (VND ≥ 0)
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={newPrice}
                  onChange={(event) => setNewPrice(event.target.value)}
                  className={controlClass}
                />
              </label>
            </div>
            <button
              type="submit"
              disabled={!priceGame || priceGame.discount > 0}
              className="mt-4 rounded-lg bg-accent px-4 py-2.5 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cập nhật giá bán VND
            </button>
          </form>

          {/* Sale */}
          <form onSubmit={saveSale} className={panelClass}>
            <h2 className="m-0 border-b border-white/10 pb-4 text-lg font-bold">Lên chiến dịch khuyến mãi Sale</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-semibold text-muted">
                Chọn tựa game áp dụng Sale
                <select
                  value={saleGameId}
                  onChange={(event) => setSaleGameId(event.target.value)}
                  className={controlClass}
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-semibold text-muted">
                Tỷ lệ giảm giá (1%–90%)
                <input
                  type="number"
                  min="1"
                  max="90"
                  value={discount}
                  onChange={(event) => setDiscount(event.target.value)}
                  className={controlClass}
                />
              </label>
              <label className="text-sm font-semibold text-muted">
                Ngày bắt đầu
                <input
                  type="date"
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                  className={controlClass}
                />
              </label>
              <label className="text-sm font-semibold text-muted">
                Ngày kết thúc
                <input
                  type="date"
                  value={endDate}
                  onChange={(event) => setEndDate(event.target.value)}
                  className={controlClass}
                />
              </label>
            </div>
            <p className="mt-4 rounded-lg border border-white/10 bg-page p-3 text-sm text-muted">
              Giá sau khuyến mãi dự kiến:{' '}
              <strong className="font-mono text-accent-light">{saleGame ? formatVnd(salePrice) : '—'}</strong>
            </p>
            <div className="flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={endSale}
                disabled={!saleGame || saleGame.discount === 0}
                className="rounded-lg border border-line px-4 py-2.5 text-sm font-bold disabled:opacity-50"
              >
                Kết thúc đợt Sale hiện tại
              </button>
              <button type="submit" className="rounded-lg bg-accent px-4 py-2.5 text-sm font-bold">
                Lưu lịch chiến dịch Sale
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Thông báo */}
      {message ? (
        <p
          role="status"
          className="m-0 rounded-lg border border-accent/30 bg-card p-3 text-sm text-accent-light"
        >
          {message}
        </p>
      ) : null}

      {/* Modal tạo dự án mới */}
      {showCreate ? (
        <NewProjectModal onClose={() => setShowCreate(false)} onCreate={handleCreate} />
      ) : null}

      {/* Modal upload patch */}
      {patchTarget ? (
        <UploadPatchModal
          game={patchTarget}
          onClose={() => setPatchTarget(null)}
          onSuccess={handlePatchSuccess}
        />
      ) : null}

      {/* Modal rollback */}
      {rollbackTarget ? (
        <RollbackModal
          game={rollbackTarget}
          onClose={() => setRollbackTarget(null)}
          onSuccess={handleRollbackSuccess}
        />
      ) : null}
    </DeveloperShell>
  );
}
