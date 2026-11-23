import { useEffect, useState } from 'react';
import AdminShell from '../../components/admin/AdminShell';
import { adminApi } from '../../api/admin';
import FeedbackDialog from '../../components/common/FeedbackDialog';

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
  const [historyTab, setHistoryTab] = useState('orders');
  const [reason, setReason] = useState('');
  const [suspensionHours, setSuspensionHours] = useState('');
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
      await adminApi.setAccountStatus(
        pendingAction.account.accountId,
        pendingAction.status,
        reason.trim(),
        pendingAction.status === 'Suspended' ? Number(suspensionHours) : undefined,
      );
      setNotice(`Đã cập nhật trạng thái tài khoản ${pendingAction.account.username}.`);
      setPendingAction(null);
      setReason('');
      setSuspensionHours('');
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
      <FeedbackDialog open={Boolean(notice)} title="Trạng thái tài khoản" message={notice} onClose={() => setNotice('')} />
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
                    <td className="px-3 py-4">
                      <StatusBadge status={account.status} />
                      {account.status === 'Suspended' && account.suspendUntil && (
                        <p className="mb-0 mt-1 text-xs text-muted">
                          Tự mở khóa: {new Date(account.suspendUntil).toLocaleString('vi-VN')}
                        </p>
                      )}
                    </td>
                    <td className="px-3 py-4">
                      <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={() => openHistory(account)} className="rounded-lg border border-white/20 px-3 py-1.5 text-xs">Lịch sử</button>
                        {!isAdminAccount && account.status !== 'Active' && <button type="button" onClick={() => { setPendingAction({ account, status: 'Active' }); setReason(''); }} className="rounded-lg border border-emerald-500/30 px-3 py-1.5 text-xs text-emerald-400">Mở khóa</button>}
                        {!isAdminAccount && account.status === 'Active' && <button type="button" onClick={() => { setPendingAction({ account, status: 'Suspended' }); setReason(''); setSuspensionHours(''); }} className="rounded-lg border border-amber-500/30 px-3 py-1.5 text-xs text-amber-400">Tạm khóa</button>}
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


      {pendingAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <form onSubmit={submitStatus} className="w-full max-w-lg rounded-2xl border border-line bg-card p-6">
            <h2 className="mt-0 text-xl font-bold">Xác nhận {pendingAction.status}</h2>
            <p className="text-sm text-muted">{pendingAction.account.username}</p>
            {pendingAction.status === 'Active' && pendingAction.account.status === 'Banned' ? (
              <p role="alert" className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-300">
                Mở khóa tài khoản từng bị khóa vĩnh viễn sẽ không tự khôi phục bản quyền hoặc thiết bị. Khách hàng cần liên hệ hỗ trợ để được xem xét.
              </p>
            ) : null}
            {pendingAction.status === 'Suspended' && (
              <label className="mb-4 block text-sm">
                Thời hạn tạm khóa (giờ)
                <input
                  type="number"
                  required
                  min="1"
                  max="87600"
                  step="1"
                  value={suspensionHours}
                  onChange={(event) => setSuspensionHours(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-line bg-page px-3 py-2.5 text-white"
                />
              </label>
            )}
            <label className="block text-sm">Lý do<textarea required maxLength={500} value={reason} onChange={(event) => setReason(event.target.value)} rows={4} className="mt-2 w-full rounded-lg border border-line bg-page p-3 text-white" /></label>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setPendingAction(null)} className="rounded-lg border border-line px-4 py-2">Hủy</button>
              <button disabled={loading} className="rounded-lg bg-accent px-4 py-2 font-bold text-white disabled:opacity-50">Xác nhận</button>
            </div>
          </form>
        </div>
      )}

      {history && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/75 p-4"
          onClick={(event) => { if (event.target === event.currentTarget) setHistory(null); }}
        >
          <section
            role="dialog"
            aria-modal="true"
            className="flex max-h-[90vh] w-full max-w-4xl flex-col rounded-2xl border border-line bg-card p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between border-b border-white/10 pb-4">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="m-0 text-xl font-bold">{history.account?.username || 'Chi tiết tài khoản'}</h2>
                  <StatusBadge status={history.account?.status} />
                  {(history.roles || []).map((r) => (
                    <span key={r} className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-semibold text-muted">
                      {r}
                    </span>
                  ))}
                </div>
                <p className="m-0 mt-1 text-xs text-muted">
                  Email: <span className="text-white">{history.account?.email}</span> · Mã TK: <span className="text-white">{history.account?.accountId}</span> · Ngày tạo: {history.account?.createdAt ? new Date(history.account.createdAt).toLocaleString('vi-VN') : '—'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setHistory(null)}
                aria-label="Đóng"
                className="rounded-lg p-1 text-muted hover:bg-white/10 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Quick summary stats */}
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-lg border border-white/10 bg-page p-3">
                <p className="m-0 text-xs text-muted">Số dư ví</p>
                <p className="m-0 mt-1 text-base font-bold text-emerald-400">
                  {history.wallet ? `${Number(history.wallet.balance).toLocaleString('vi-VN')} ₫` : 'Không có ví'}
                </p>
              </div>
              <div className="rounded-lg border border-white/10 bg-page p-3">
                <p className="m-0 text-xs text-muted">Đơn hàng</p>
                <p className="m-0 mt-1 text-base font-bold text-white">{history.orders?.length || 0}</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-page p-3">
                <p className="m-0 text-xs text-muted">Game sở hữu</p>
                <p className="m-0 mt-1 text-base font-bold text-white">{history.licenses?.length || 0}</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-page p-3">
                <p className="m-0 text-xs text-muted">Nhật ký & Vi phạm</p>
                <p className="m-0 mt-1 text-base font-bold text-rose-400">{history.violations?.length || 0}</p>
              </div>
            </div>

            {/* Tabs */}
            <div className="mt-4 flex gap-2 border-b border-white/10 pb-2">
              <button
                type="button"
                onClick={() => setHistoryTab('orders')}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${historyTab === 'orders' ? 'bg-accent text-white' : 'text-muted hover:text-white'}`}
              >
                Đơn hàng ({history.orders?.length || 0})
              </button>
              <button
                type="button"
                onClick={() => setHistoryTab('licenses')}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${historyTab === 'licenses' ? 'bg-accent text-white' : 'text-muted hover:text-white'}`}
              >
                Bản quyền game ({history.licenses?.length || 0})
              </button>
              <button
                type="button"
                onClick={() => setHistoryTab('violations')}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${historyTab === 'violations' ? 'bg-accent text-white' : 'text-muted hover:text-white'}`}
              >
                Nhật ký & Vi phạm ({history.violations?.length || 0})
              </button>
            </div>

            {/* Tab contents */}
            <div className="mt-3 flex-1 overflow-auto">
              {historyTab === 'orders' && (
                <table className="w-full border-collapse text-left text-xs">
                  <thead className="bg-page text-muted">
                    <tr>
                      <th className="px-3 py-2">Mã đơn</th>
                      <th className="px-3 py-2">Thời gian</th>
                      <th className="px-3 py-2">Tổng tiền</th>
                      <th className="px-3 py-2">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(history.orders || []).map((order) => (
                      <tr key={order.orderId} className="border-b border-white/5">
                        <td className="px-3 py-2.5 font-mono text-muted">{order.orderId}</td>
                        <td className="px-3 py-2.5">{order.orderDate ? new Date(order.orderDate).toLocaleString('vi-VN') : '—'}</td>
                        <td className="px-3 py-2.5 font-bold">{Number(order.totalAmount).toLocaleString('vi-VN')} ₫</td>
                        <td className="px-3 py-2.5">
                          <span className={`inline-block rounded px-2 py-0.5 text-[11px] font-bold ${
                            order.status === 'Completed' ? 'bg-emerald-500/20 text-emerald-400' :
                            order.status === 'PartiallyRefunded' ? 'bg-amber-500/20 text-amber-400' :
                            order.status === 'Refunded' ? 'bg-rose-500/20 text-rose-400' :
                            'bg-white/10 text-muted'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {(!history.orders || history.orders.length === 0) && (
                      <tr><td colSpan="4" className="px-3 py-6 text-center text-muted">Chưa có đơn hàng nào.</td></tr>
                    )}
                  </tbody>
                </table>
              )}

              {historyTab === 'licenses' && (
                <table className="w-full border-collapse text-left text-xs">
                  <thead className="bg-page text-muted">
                    <tr>
                      <th className="px-3 py-2">Tên game</th>
                      <th className="px-3 py-2">Nguồn</th>
                      <th className="px-3 py-2">Ngày mua / Nhận</th>
                      <th className="px-3 py-2">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(history.licenses || []).map((lic) => (
                      <tr key={lic.licenseId} className="border-b border-white/5">
                        <td className="px-3 py-2.5 font-bold text-white">{lic.gameTitle || lic.gameId}</td>
                        <td className="px-3 py-2.5">{lic.source || '—'}</td>
                        <td className="px-3 py-2.5">{lic.purchaseDate ? new Date(lic.purchaseDate).toLocaleString('vi-VN') : '—'}</td>
                        <td className="px-3 py-2.5">
                          <span className={`inline-block rounded px-2 py-0.5 text-[11px] font-bold ${
                            lic.status === 'Active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                          }`}>
                            {lic.status}
                          </span>
                          {lic.revokedAt && (
                            <span className="ml-1 text-[10px] text-muted">(Thu hồi: {new Date(lic.revokedAt).toLocaleString('vi-VN')})</span>
                          )}
                          {lic.revokedReason && (
                            <span className="ml-1 text-[10px] text-muted">(Lý do: {lic.revokedReason})</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {(!history.licenses || history.licenses.length === 0) && (
                      <tr><td colSpan="4" className="px-3 py-6 text-center text-muted">Chưa có bản quyền game nào.</td></tr>
                    )}
                  </tbody>
                </table>
              )}

              {historyTab === 'violations' && (
                <div className="space-y-2">
                  {(history.violations || []).map((v) => (
                    <div key={v.logId} className="rounded-lg border border-white/10 bg-page p-3 text-xs">
                      <div className="flex items-center justify-between text-muted">
                        <span className="font-mono font-bold text-rose-400">{v.action}</span>
                        <span>{v.logAt ? new Date(v.logAt).toLocaleString('vi-VN') : '—'}</span>
                      </div>
                      <p className="m-0 mt-1 text-white">Đối tượng: <span className="font-mono text-muted">{v.target}</span></p>
                      {v.detail && <p className="m-0 mt-1 text-muted">Chi tiết: {v.detail}</p>}
                    </div>
                  ))}
                  {(!history.violations || history.violations.length === 0) && (
                    <p className="py-6 text-center text-xs text-muted">Không có bản ghi nhật ký / vi phạm nào.</p>
                  )}
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </AdminShell>
  );
}
