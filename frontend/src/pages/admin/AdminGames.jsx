import { useEffect, useMemo, useState } from 'react';
import AdminShell from '../../components/admin/AdminShell';
import { adminApi } from '../../api/admin';
import { formatVnd } from '../../utils/format';

function formatBytes(bytes) {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function StatusBadge({ status }) {
  const map = {
    Approved: { label: '● Approved (Đang bán)', cls: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' },
    Pending: { label: '● Pending (Chờ duyệt)', cls: 'border-amber-500/30 bg-amber-500/10 text-amber-400' },
    Rejected: { label: '● Rejected (Từ chối)', cls: 'border-red-500/30 bg-red-500/10 text-red-400' },
    Delisted: { label: '● Delisted (Đã gỡ)', cls: 'border-zinc-500/30 bg-zinc-500/10 text-zinc-400' },
    Hidden: { label: '● Hidden (Đang ẩn)', cls: 'border-purple-500/30 bg-purple-500/10 text-purple-400' },
  };
  const item = map[status] || { label: status, cls: 'border-white/10 text-muted' };
  return <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-bold ${item.cls}`}>{item.label}</span>;
}

export default function AdminGames() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modal chi tiết & phê duyệt
  const [selectedGame, setSelectedGame] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');

  // Action modal / prompt
  const [actionTarget, setActionTarget] = useState(null); // { game, decision: 'Approved' | 'Rejected' | 'EmergencyDelist' }
  const [actionReason, setActionReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadGames = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await adminApi.listPendingGames();
      setGames(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.message || 'Lỗi tải danh sách game chờ duyệt.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGames();
  }, []);

  const openDetail = async (gameId) => {
    setDetailLoading(true);
    setDetailError('');
    setSelectedGame({ gameId });
    try {
      const detail = await adminApi.getGameDetail(gameId);
      setSelectedGame(detail);
    } catch (err) {
      setDetailError(err?.message || 'Không thể lấy thông tin chi tiết game.');
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setSelectedGame(null);
    setDetailError('');
  };

  const handleReview = async (e) => {
    e.preventDefault();
    if (!actionTarget) return;

    const { game, decision } = actionTarget;
    const reason = actionReason.trim();

    if (decision === 'Rejected' && !reason) {
      setError('Bắt buộc phải nhập lý do khi từ chối phát hành game.');
      return;
    }

    setSubmitting(true);
    setError('');
    setNotice('');
    try {
      const res = await adminApi.reviewGame(game.gameId ?? game.id, decision, reason || undefined);
      setNotice(
        `Game "${game.title}" đã được ${
          decision === 'Approved' ? 'phê duyệt thành công!' : decision === 'Rejected' ? 'từ chối.' : 'gỡ bỏ khẩn cấp.'
        }${res?.autoWrapped ? ' (Hệ thống đã tự động bọc DRM an toàn)' : ''}`,
      );
      setActionTarget(null);
      setActionReason('');
      if (selectedGame) closeDetail();
      await loadGames();
    } catch (err) {
      setError(err?.message || 'Thao tác kiểm duyệt thất bại.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredGames = useMemo(() => {
    return games.filter((g) => {
      const matchSearch =
        !search.trim() ||
        g.title?.toLowerCase().includes(search.toLowerCase()) ||
        g.developerName?.toLowerCase().includes(search.toLowerCase()) ||
        g.developerEmail?.toLowerCase().includes(search.toLowerCase());
      const matchStatus = !statusFilter || g.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [games, search, statusFilter]);

  return (
    <AdminShell
      title="Kiểm duyệt phát hành game"
      description="Xem xét hồ sơ game của Developer, kiểm tra tệp gói cài đặt .zip và tự động áp dụng bản quyền DRM khi phê duyệt."
    >
      {error && (
        <p role="alert" className="mb-4 rounded-lg border border-red-500/40 bg-red-950/30 p-3 text-sm text-red-300">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="mb-4 rounded-lg border border-emerald-500/40 bg-emerald-950/30 p-3 text-sm text-emerald-300">
          {notice}
        </p>
      )}

      {/* ── Bộ lọc & Tìm kiếm ── */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-card p-4">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên game hoặc Nhà phát hành..."
            className="w-full max-w-sm rounded-lg border border-line bg-page px-3 py-2 text-sm text-white outline-none focus:border-accent"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-line bg-page px-3 py-2 text-sm text-white outline-none focus:border-accent"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="Pending">Chờ duyệt (Pending)</option>
            <option value="Approved">Đã duyệt (Approved)</option>
            <option value="Rejected">Bị từ chối (Rejected)</option>
            <option value="Delisted">Đã gỡ (Delisted)</option>
          </select>
        </div>
        <button
          type="button"
          onClick={loadGames}
          disabled={loading}
          className="rounded-lg border border-line bg-page px-4 py-2 text-sm font-semibold text-zinc-300 hover:text-white"
        >
          {loading ? 'Đang tải...' : 'Làm mới'}
        </button>
      </div>

      {/* ── Bảng danh sách game ── */}
      <section className="overflow-hidden rounded-2xl border border-white/10 bg-card shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="border-b border-white/10 bg-page/80 text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3">Tên trò chơi</th>
                <th className="px-4 py-3">Nhà phát hành</th>
                <th className="px-4 py-3">Giá bán</th>
                <th className="px-4 py-3">Phiên bản</th>
                <th className="px-4 py-3">Dung lượng build</th>
                <th className="px-4 py-3">Ngày upload</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredGames.map((game) => (
                <tr key={game.gameId} className="hover:bg-white/[0.02]">
                  <td className="px-4 py-3 font-bold text-white">
                    <button
                      type="button"
                      onClick={() => openDetail(game.gameId)}
                      className="text-left hover:text-accent-light hover:underline"
                    >
                      {game.title}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <p className="m-0 font-medium">{game.developerName || '—'}</p>
                    <p className="m-0 text-xs text-muted">{game.developerEmail}</p>
                  </td>
                  <td className="px-4 py-3 font-semibold text-emerald-400">
                    {formatVnd(game.price)}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-indigo-300">
                    {game.versionNumber ? `v${game.versionNumber}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-400">
                    {formatBytes(game.fileSize)}
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-400">
                    {game.uploadDate ? new Date(game.uploadDate).toLocaleDateString('vi-VN') : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={game.status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => openDetail(game.gameId)}
                        className="rounded-md border border-white/10 px-2.5 py-1 text-xs font-semibold hover:border-accent"
                      >
                        Chi tiết
                      </button>
                      {game.status === 'Pending' && (
                        <>
                          <button
                            type="button"
                            onClick={() => setActionTarget({ game, decision: 'Approved' })}
                            className="rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-emerald-500"
                          >
                            Duyệt
                          </button>
                          <button
                            type="button"
                            onClick={() => setActionTarget({ game, decision: 'Rejected' })}
                            className="rounded-md bg-red-600/80 px-2.5 py-1 text-xs font-bold text-white hover:bg-red-500"
                          >
                            Từ chối
                          </button>
                        </>
                      )}
                      {game.status === 'Approved' && (
                        <button
                          type="button"
                          onClick={() => setActionTarget({ game, decision: 'EmergencyDelist' })}
                          className="rounded-md border border-amber-500/40 px-2.5 py-1 text-xs font-bold text-amber-400 hover:bg-amber-500/10"
                        >
                          Gỡ khẩn cấp
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {!filteredGames.length && !loading && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-muted">
                    Không có trò chơi nào phù hợp với bộ lọc.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Modal Chi tiết Game ── */}
      {selectedGame && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <section className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-indigo-900 bg-zinc-950 p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="m-0 text-xl font-bold text-white">
                Chi tiết hồ sơ: {selectedGame.title || 'Đang tải...'}
              </h3>
              <button onClick={closeDetail} className="text-lg text-muted hover:text-white">✕</button>
            </div>

            {detailLoading ? (
              <p className="text-sm text-muted">Đang tải thông tin chi tiết...</p>
            ) : detailError ? (
              <p className="text-sm text-red-400">{detailError}</p>
            ) : (
              <div className="space-y-4 text-sm">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <span className="text-xs text-muted">Nhà phát hành:</span>
                    <p className="m-0 font-bold">{selectedGame.developerName || '—'}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted">Giá niêm yết:</span>
                    <p className="m-0 font-bold text-emerald-400">{formatVnd(selectedGame.price)}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted">Trạng thái hiện tại:</span>
                    <div className="mt-1"><StatusBadge status={selectedGame.status} /></div>
                  </div>
                  <div>
                    <span className="text-xs text-muted">Phiên bản gói build:</span>
                    <p className="m-0 font-mono font-bold text-indigo-300">v{selectedGame.versionNumber || '—'}</p>
                  </div>
                </div>

                <div>
                  <span className="text-xs text-muted">Mô tả sản phẩm:</span>
                  <div className="mt-1 rounded-lg bg-page p-3 text-zinc-300 leading-relaxed border border-white/5 whitespace-pre-wrap">
                    {selectedGame.description || 'Chưa có mô tả.'}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <span className="text-xs text-muted">Cấu hình tối thiểu:</span>
                    <p className="m-0 mt-1 rounded bg-page p-2 font-mono text-xs text-zinc-400">{selectedGame.minSpec || '—'}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted">Cấu hình đề nghị:</span>
                    <p className="m-0 mt-1 rounded bg-page p-2 font-mono text-xs text-zinc-400">{selectedGame.recSpec || '—'}</p>
                  </div>
                </div>

                <div className="rounded-xl border border-indigo-500/20 bg-page/50 p-3 space-y-1.5 font-mono text-xs">
                  <p className="m-0 font-bold text-accent-light">Thông số gói cài đặt .zip</p>
                  <p className="m-0 text-zinc-400">File key: {selectedGame.buildFile || '—'}</p>
                  <p className="m-0 text-zinc-400">Dung lượng: {formatBytes(selectedGame.fileSize)}</p>
                  <p className="m-0 text-zinc-400 truncate" title={selectedGame.sha256}>SHA-256: {selectedGame.sha256 || '—'}</p>
                  <p className="m-0 text-zinc-400">Changelog: {selectedGame.changeLog || '—'}</p>
                </div>

                <div className="rounded-lg bg-indigo-950/40 p-3 text-xs text-violet-300 border border-indigo-500/30">
                  ℹ Lưu ý kiểm duyệt: Khi bấm <strong>Phê duyệt</strong>, hệ thống sẽ tự động quét virus và bọc DRM HTML5 qua <code>autoDrmPackager</code> nếu game chưa tích hợp sẵn DRM SDK.
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                  <button
                    type="button"
                    onClick={closeDetail}
                    className="rounded-lg border border-line px-4 py-2 text-xs font-semibold text-muted hover:text-white"
                  >
                    Đóng
                  </button>
                  {selectedGame.status === 'Pending' && (
                    <>
                      <button
                        type="button"
                        onClick={() => setActionTarget({ game: selectedGame, decision: 'Rejected' })}
                        className="rounded-lg bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-500"
                      >
                        Từ chối phát hành
                      </button>
                      <button
                        type="button"
                        onClick={() => setActionTarget({ game: selectedGame, decision: 'Approved' })}
                        className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500"
                      >
                        Phê duyệt phát hành
                      </button>
                    </>
                  )}
                  {selectedGame.status === 'Approved' && (
                    <button
                      type="button"
                      onClick={() => setActionTarget({ game: selectedGame, decision: 'EmergencyDelist' })}
                      className="rounded-lg bg-amber-600 px-4 py-2 text-xs font-bold text-white hover:bg-amber-500"
                    >
                      Gỡ khẩn cấp
                    </button>
                  )}
                </div>
              </div>
            )}
          </section>
        </div>
      )}

      {/* ── Modal Xác nhận Quyết định Kiểm duyệt ── */}
      {actionTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <form
            onSubmit={handleReview}
            className="w-full max-w-md rounded-2xl border border-indigo-900 bg-zinc-950 p-6 shadow-2xl space-y-4"
          >
            <h3 className="m-0 text-lg font-bold text-white">
              {actionTarget.decision === 'Approved'
                ? `Phê duyệt phát hành: ${actionTarget.game.title}`
                : actionTarget.decision === 'Rejected'
                ? `Từ chối phát hành: ${actionTarget.game.title}`
                : `Gỡ bỏ khẩn cấp: ${actionTarget.game.title}`}
            </h3>

            {actionTarget.decision === 'Approved' ? (
              <p className="m-0 text-sm text-zinc-300">
                Xác nhận phê duyệt trò chơi này? Hệ thống sẽ mở bán trên cửa hàng và tự động áp dụng DRM.
              </p>
            ) : (
              <div>
                <label className="block text-xs font-bold text-muted mb-1">
                  Lý do {actionTarget.decision === 'Rejected' ? '(bắt buộc)' : '(tùy chọn)'}:
                </label>
                <textarea
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  placeholder="Ghi rõ lý do quyết định để gửi thông báo cho Nhà phát hành..."
                  rows={4}
                  className="w-full rounded-lg border border-line bg-page p-3 text-sm text-white outline-none focus:border-accent"
                  required={actionTarget.decision === 'Rejected'}
                />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => { setActionTarget(null); setActionReason(''); }}
                disabled={submitting}
                className="rounded-lg border border-line px-4 py-2 text-xs font-semibold text-muted hover:text-white"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={submitting || (actionTarget.decision === 'Rejected' && !actionReason.trim())}
                className={`rounded-lg px-4 py-2 text-xs font-bold text-white disabled:opacity-50 ${
                  actionTarget.decision === 'Approved'
                    ? 'bg-emerald-600 hover:bg-emerald-500'
                    : 'bg-red-600 hover:bg-red-500'
                }`}
              >
                {submitting ? 'Đang xử lý...' : 'Xác nhận quyết định'}
              </button>
            </div>
          </form>
        </div>
      )}
    </AdminShell>
  );
}
