import { useEffect, useState } from 'react';
import AdminShell from '../../components/admin/AdminShell';
import { adminApi } from '../../api/admin';

const emptyFilters = { accountId: '', action: '', fromDate: '', toDate: '' };

function formatDetail(detail) {
  if (!detail) return '—';
  try {
    const parsed = JSON.parse(detail);
    return JSON.stringify(parsed, null, 2);
  } catch {
    return detail;
  }
}

export default function AdminAuditLogs() {
  const [filters, setFilters] = useState(emptyFilters);
  const [logs, setLogs] = useState([]);
  const [selectedLog, setSelectedLog] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const search = async (event) => {
    if (event) event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([, value]) => value));
      setLogs(await adminApi.listAuditLogs(params));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  const resetFilters = () => {
    setFilters(emptyFilters);
    setTimeout(search, 0);
  };

  const openDetail = async (log) => {
    setDetailLoading(true);
    try {
      const fullLog = await adminApi.getAuditLogDetail(log.logId);
      setSelectedLog(fullLog || log);
    } catch {
      setSelectedLog(log);
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => { search(); }, []);

  return (
    <AdminShell title="Nhật ký quản trị" description="Tra cứu lịch sử thao tác theo tài khoản, hành động và khoảng ngày.">
      <form onSubmit={search} className="grid gap-3 rounded-2xl border border-white/10 bg-card p-5 md:grid-cols-4">
        <label className="text-xs text-muted">
          AccountID
          <input
            value={filters.accountId}
            onChange={(event) => setFilters({ ...filters, accountId: event.target.value })}
            placeholder="Mã tài khoản..."
            className="mt-1 w-full rounded-lg border border-line bg-page p-2.5 text-white"
          />
        </label>
        <label className="text-xs text-muted">
          Action
          <input
            value={filters.action}
            onChange={(event) => setFilters({ ...filters, action: event.target.value })}
            placeholder="APPROVE_GAME, SUSPEND..."
            className="mt-1 w-full rounded-lg border border-line bg-page p-2.5 text-white"
          />
        </label>
        <label className="text-xs text-muted">
          Từ ngày
          <input
            type="date"
            value={filters.fromDate}
            onChange={(event) => setFilters({ ...filters, fromDate: event.target.value })}
            className="mt-1 w-full rounded-lg border border-line bg-page p-2.5 text-white"
          />
        </label>
        <label className="text-xs text-muted">
          Đến ngày
          <input
            type="date"
            value={filters.toDate}
            onChange={(event) => setFilters({ ...filters, toDate: event.target.value })}
            className="mt-1 w-full rounded-lg border border-line bg-page p-2.5 text-white"
          />
        </label>
        <div className="flex flex-wrap gap-2 md:col-span-4">
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-accent px-4 py-2 font-bold text-white disabled:opacity-50"
          >
            {loading ? 'Đang lọc...' : 'Lọc nhật ký'}
          </button>
          <button
            type="button"
            onClick={resetFilters}
            className="rounded-lg border border-line px-4 py-2 text-sm text-muted hover:text-white"
          >
            Đặt lại bộ lọc
          </button>
        </div>
      </form>

      {error && <p role="alert" className="text-sm text-red-400">{error}</p>}

      <section className="overflow-x-auto rounded-2xl border border-white/10 bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="m-0 text-xs font-semibold uppercase text-muted">Tổng cộng: {logs.length} bản ghi</p>
        </div>
        <table className="w-full min-w-[780px] text-left text-sm">
          <thead className="bg-page text-xs uppercase text-muted">
            <tr>
              <th className="p-3">Thời điểm</th>
              <th className="p-3">Tài khoản</th>
              <th className="p-3">Hành động</th>
              <th className="p-3">Đối tượng</th>
              <th className="p-3">Chi tiết</th>
              <th className="p-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.logId} className="border-t border-white/5 hover:bg-white/[0.02]">
                <td className="p-3 text-xs text-muted">
                  {log.logAt ? new Date(log.logAt).toLocaleString('vi-VN') : '—'}
                </td>
                <td className="p-3">
                  <span className="font-semibold text-white">{log.username}</span>
                  <small className="block text-muted">{log.accountId}</small>
                </td>
                <td className="p-3">
                  <code className="rounded bg-white/10 px-2 py-0.5 text-xs text-amber-300">{log.action}</code>
                </td>
                <td className="p-3 font-mono text-xs text-muted">{log.target}</td>
                <td className="max-w-72 truncate p-3 text-xs text-muted">{log.detail || '—'}</td>
                <td className="p-3 text-right">
                  <button
                    type="button"
                    onClick={() => openDetail(log)}
                    className="rounded border border-white/20 px-2.5 py-1 text-xs text-muted hover:border-white hover:text-white"
                  >
                    Xem
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && !logs.length && (
          <p className="p-8 text-center text-sm text-muted">Không tìm thấy bản ghi nhật ký phù hợp.</p>
        )}
      </section>

      {/* Modal chi tiết bản ghi nhật ký */}
      {selectedLog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
          onClick={(event) => { if (event.target === event.currentTarget) setSelectedLog(null); }}
        >
          <section
            role="dialog"
            aria-modal="true"
            className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-2xl border border-line bg-card p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h2 className="m-0 text-lg font-bold">Chi tiết bản ghi nhật ký #{selectedLog.logId}</h2>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                aria-label="Đóng"
                className="rounded-lg p-1 text-muted hover:bg-white/10 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3 overflow-auto text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-white/10 bg-page p-3">
                  <p className="m-0 text-xs text-muted">Người thực hiện</p>
                  <p className="m-0 mt-1 font-bold text-white">{selectedLog.username}</p>
                  <p className="m-0 text-xs font-mono text-muted">{selectedLog.accountId}</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-page p-3">
                  <p className="m-0 text-xs text-muted">Thời điểm ghi nhận</p>
                  <p className="m-0 mt-1 font-bold text-white">
                    {selectedLog.logAt ? new Date(selectedLog.logAt).toLocaleString('vi-VN') : '—'}
                  </p>
                </div>
              </div>

              <div className="rounded-lg border border-white/10 bg-page p-3">
                <p className="m-0 text-xs text-muted">Hành động & Đối tượng tác động</p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <span className="rounded bg-amber-500/20 px-2.5 py-1 font-mono text-xs font-bold text-amber-300">
                    {selectedLog.action}
                  </span>
                  <span className="text-muted">→</span>
                  <span className="rounded bg-white/10 px-2.5 py-1 font-mono text-xs text-white">
                    {selectedLog.target}
                  </span>
                </div>
              </div>

              <div className="rounded-lg border border-white/10 bg-page p-3">
                <p className="m-0 mb-2 text-xs text-muted">Nội dung chi tiết (Detail)</p>
                <pre className="m-0 max-h-60 overflow-auto whitespace-pre-wrap break-all rounded bg-black/40 p-3 font-mono text-xs text-muted">
                  {formatDetail(selectedLog.detail)}
                </pre>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="rounded-lg border border-line px-4 py-2 text-sm text-white hover:bg-white/10"
              >
                Đóng
              </button>
            </div>
          </section>
        </div>
      )}
    </AdminShell>
  );
}
