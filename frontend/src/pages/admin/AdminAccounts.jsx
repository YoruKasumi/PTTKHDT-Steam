import { useEffect, useState } from 'react';
import AdminShell from '../../components/admin/AdminShell';
import { adminApi } from '../../api/admin';

const statuses = ['Active', 'Suspended', 'Banned'];

function StatusBadge({ status }) {
  const styles = {
    Active: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
    Suspended: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
    Banned: 'border-rose-500/30 bg-rose-500/10 text-rose-400',
  };
  return <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${styles[status] || ''}`}>{status}</span>;
}

export default function AdminAccounts() {
  const [accounts, setAccounts] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [pendingAction, setPendingAction] = useState(null);
  const [history, setHistory] = useState(null);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);

  const loadAccounts = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await adminApi.listAccounts({
        keyword: search.trim() || undefined,
        status: statusFilter || undefined,
        role: roleFilter || undefined,
      });
      setAccounts(data);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(loadAccounts, 250);
    return () => clearTimeout(timer);
  }, [search, statusFilter, roleFilter]);

  const submitStatus = async (event) => {
    event.preventDefault();
    if (!pendingAction || !reason.trim()) return;
    setLoading(true);
    setError('');
    try {
      await adminApi.setAccountStatus(pendingAction.account.accountId, pendingAction.status, reason.trim());
      setNotice(`Đã cập nhật trạng thái tài khoản ${pendingAction.account.username}.`);
      setPendingAction(null);
      setReason('');
      await loadAccounts();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  const openHistory = async (account) => {
    setError('');
    try {
      setHistory(await adminApi.getAccountHistory(account.accountId));
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  return (
    <AdminShell title="Kiểm soát tài khoản" description="Tìm tài khoản, xem lịch sử và áp dụng chế tài có ghi nhận lý do.">
      <section className="grid gap-3 sm:grid-cols-3">
        {statuses.map((status) => (
          <div key={status} className="rounded-xl border border-white/10 bg-card p-4">
            <p className="m-0 text-xs font-bold uppercase text-muted">{status}</p>
            <p className="mb-0 mt-2 text-2xl font-extrabold">{accounts.filter((account) => account.status === status).length}</p>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-indigo-950 bg-card p-5">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px_220px]">
          <label className="text-sm font-semibold text-muted">
            Tìm tài khoản
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Username, email hoặc AccountID" className="mt-2 w-full rounded-lg border border-line bg-page px-3 py-2.5 text-white" />
          </label>
          <label className="text-sm font-semibold text-muted">
            Trạng thái
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="mt-2 w-full rounded-lg border border-line bg-page px-3 py-2.5 text-white">
              <option value="">Tất cả</option>
              {statuses.map((status) => <option key={status}>{status}</option>)}
            </select>
          </label>
          <label className="text-sm font-semibold text-muted">
            Vai trò
            <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)} className="mt-2 w-full rounded-lg border border-line bg-page px-3 py-2.5 text-white">
              <option value="">Tất cả</option>
              {['Customer', 'Developer', 'Manager', 'Admin'].map((role) => <option key={role}>{role}</option>)}
            </select>
          </label>
        </div>

        {error ? <p role="alert" className="mt-4 text-sm text-red-400">{error}</p> : null}
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[850px] border-collapse text-left text-sm">
            <thead className="bg-page text-xs uppercase text-muted">
              <tr><th className="px-3 py-3">Tài khoản</th><th className="px-3 py-3">Vai trò</th><th className="px-3 py-3">Trạng thái</th><th className="px-3 py-3">Thao tác</th></tr>
            </thead>
            <tbody>
              {accounts.map((account) => {
                const isAdminAccount = (account.roles || []).includes('Admin');
                return (
                  <tr key={account.accountId} className="border-b border-white/5">
                    <td className="px-3 py-4">
                      <p className="m-0 font-bold">{account.username}</p>
                      <p className="m-0 mt-1 text-xs text-muted">{account.email} · {account.accountId}</p>
                    </td>
                    <td className="px-3 py-4">{(account.roles || []).join(', ') || '—'}</td>
                    <td className="px-3 py-4"><StatusBadge status={account.status} /></td>
                    <td className="px-3 py-4">
                      <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={() => openHistory(account)} className="rounded-lg border border-white/20 px-3 py-1.5 text-xs">Lịch sử</button>
                        {!isAdminAccount && account.status !== 'Active' && <button type="button" onClick={() => { setPendingAction({ account, status: 'Active' }); setReason(''); }} className="rounded-lg border border-emerald-500/30 px-3 py-1.5 text-xs text-emerald-400">Mở khóa</button>}
                        {!isAdminAccount && account.status === 'Active' && <button type="button" onClick={() => { setPendingAction({ account, status: 'Suspended' }); setReason(''); }} className="rounded-lg border border-amber-500/30 px-3 py-1.5 text-xs text-amber-400">Tạm khóa</button>}
                        {!isAdminAccount && account.status !== 'Banned' && <button type="button" onClick={() => { setPendingAction({ account, status: 'Banned' }); setReason(''); }} className="rounded-lg border border-rose-500/30 px-3 py-1.5 text-xs text-rose-400">Khóa vĩnh viễn</button>}
                        {isAdminAccount && <span className="text-xs text-muted">Tài khoản Admin được bảo vệ</span>}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!loading && accounts.length === 0 && <tr><td colSpan="4" className="px-3 py-10 text-center text-muted">Không tìm thấy tài khoản.</td></tr>}
            </tbody>
          </table>
          {loading && <p className="mt-3 text-sm text-muted">Đang tải...</p>}
        </div>
      </section>

      {notice && <p role="status" className="rounded-lg border border-emerald-500/30 p-3 text-sm text-emerald-300">{notice}</p>}

      {pendingAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <form onSubmit={submitStatus} className="w-full max-w-lg rounded-2xl border border-line bg-card p-6">
            <h2 className="mt-0 text-xl font-bold">Xác nhận {pendingAction.status}</h2>
            <p className="text-sm text-muted">{pendingAction.account.username}</p>
            <label className="block text-sm">Lý do<textarea required maxLength={500} value={reason} onChange={(event) => setReason(event.target.value)} rows={4} className="mt-2 w-full rounded-lg border border-line bg-page p-3 text-white" /></label>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setPendingAction(null)} className="rounded-lg border border-line px-4 py-2">Hủy</button>
              <button disabled={loading} className="rounded-lg bg-accent px-4 py-2 font-bold text-white disabled:opacity-50">Xác nhận</button>
            </div>
          </form>
        </div>
      )}

      {history && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/75 p-4" onClick={(event) => { if (event.target === event.currentTarget) setHistory(null); }}>
          <section role="dialog" aria-modal="true" className="max-h-[85vh] w-full max-w-3xl overflow-auto rounded-2xl border border-line bg-card p-6">
            <div className="flex items-center justify-between"><h2 className="m-0 text-xl font-bold">Lịch sử tài khoản</h2><button onClick={() => setHistory(null)} aria-label="Đóng">✕</button></div>
            <pre className="mt-4 overflow-auto rounded-lg bg-page p-4 text-xs text-muted">{JSON.stringify(history, null, 2)}</pre>
          </section>
        </div>
      )}
    </AdminShell>
  );
}
