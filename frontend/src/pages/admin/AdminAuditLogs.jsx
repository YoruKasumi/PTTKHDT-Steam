import { useEffect, useState } from 'react';
import AdminShell from '../../components/admin/AdminShell';
import { adminApi } from '../../api/admin';

const emptyFilters = { accountId: '', action: '', fromDate: '', toDate: '' };

export default function AdminAuditLogs() {
  const [filters, setFilters] = useState(emptyFilters);
  const [logs, setLogs] = useState([]);
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
  useEffect(() => { search(); }, []);

  return (
    <AdminShell title="Nhật ký quản trị" description="Tra cứu lịch sử thao tác theo tài khoản, hành động và khoảng ngày.">
      <form onSubmit={search} className="grid gap-3 rounded-2xl border border-white/10 bg-card p-5 md:grid-cols-4">
        <label className="text-xs text-muted">AccountID<input value={filters.accountId} onChange={(event) => setFilters({ ...filters, accountId: event.target.value })} className="mt-1 w-full rounded-lg border border-line bg-page p-2.5 text-white" /></label>
        <label className="text-xs text-muted">Action<input value={filters.action} onChange={(event) => setFilters({ ...filters, action: event.target.value })} className="mt-1 w-full rounded-lg border border-line bg-page p-2.5 text-white" /></label>
        <label className="text-xs text-muted">Từ ngày<input type="date" value={filters.fromDate} onChange={(event) => setFilters({ ...filters, fromDate: event.target.value })} className="mt-1 w-full rounded-lg border border-line bg-page p-2.5 text-white" /></label>
        <label className="text-xs text-muted">Đến ngày<input type="date" value={filters.toDate} onChange={(event) => setFilters({ ...filters, toDate: event.target.value })} className="mt-1 w-full rounded-lg border border-line bg-page p-2.5 text-white" /></label>
        <button disabled={loading} className="rounded-lg bg-accent px-4 py-2 font-bold text-white md:col-span-4 md:justify-self-start">Lọc nhật ký</button>
      </form>
      {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
      <section className="overflow-x-auto rounded-2xl border border-white/10 bg-card p-4">
        <table className="w-full min-w-[780px] text-left text-sm">
          <thead className="text-xs uppercase text-muted"><tr><th className="p-3">Thời điểm</th><th className="p-3">Tài khoản</th><th className="p-3">Hành động</th><th className="p-3">Đối tượng</th><th className="p-3">Chi tiết</th></tr></thead>
          <tbody>{logs.map((log) => <tr key={log.logId} className="border-t border-white/5"><td className="p-3">{new Date(log.logAt).toLocaleString()}</td><td className="p-3">{log.username}<small className="block text-muted">{log.accountId}</small></td><td className="p-3"><code>{log.action}</code></td><td className="p-3">{log.target}</td><td className="max-w-80 p-3 text-xs text-muted">{log.detail}</td></tr>)}</tbody>
        </table>
        {!loading && !logs.length && <p className="p-4 text-center text-sm text-muted">Không có nhật ký phù hợp.</p>}
      </section>
    </AdminShell>
  );
}
