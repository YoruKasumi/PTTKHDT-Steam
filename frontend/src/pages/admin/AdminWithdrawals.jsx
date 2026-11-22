import { useCallback, useEffect, useMemo, useState } from 'react';
import AdminShell from '../../components/admin/AdminShell';
import { withdrawalApi } from '../../api/withdrawal';
import { formatVnd } from '../../utils/format';

function formatDate(value) {
  return value ? new Date(value).toLocaleString('vi-VN') : '—';
}

export default function AdminWithdrawals() {
  const [requests, setRequests] = useState([]);
  const [statusFilter, setStatusFilter] = useState('Pending');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await withdrawalApi.listRequests({ status: 'all' });
      setRequests(Array.isArray(data) ? data : []);
    } catch (loadError) {
      setError(loadError?.message || 'Không thể tải danh sách lệnh rút tiền.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const filteredRequests = useMemo(
    () => requests.filter((request) => statusFilter === 'all' || request.Status === statusFilter),
    [requests, statusFilter],
  );

  const approveRequest = async (request) => {
    if (!window.confirm(`Xác nhận đã chuyển khoản ${formatVnd(request.Amount)} cho ${request.CompanyName || request.DeveloperID}?`)) return;
    setSubmitting(true);
    setError('');
    setNotice('');
    try {
      const result = await withdrawalApi.approveRequest(request.RequestID);
      setNotice(result?.message || `Đã duyệt lệnh ${request.RequestID}.`);
      await loadRequests();
    } catch (actionError) {
      setError(actionError?.message || 'Không thể duyệt lệnh rút tiền.');
    } finally {
      setSubmitting(false);
    }
  };

  const rejectRequest = async (event) => {
    event.preventDefault();
    const reason = rejectReason.trim();
    if (!rejectTarget || !reason) {
      setError('Vui lòng nhập lý do từ chối.');
      return;
    }
    setSubmitting(true);
    setError('');
    setNotice('');
    try {
      const result = await withdrawalApi.rejectRequest(rejectTarget.RequestID, reason);
      setNotice(result?.message || `Đã từ chối lệnh ${rejectTarget.RequestID}.`);
      setRejectTarget(null);
      setRejectReason('');
      await loadRequests();
    } catch (actionError) {
      setError(actionError?.message || 'Không thể từ chối lệnh rút tiền.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminShell
      title="Duyệt rút doanh thu"
      description="Đối soát thông tin nhận tiền và xử lý các yêu cầu rút doanh thu của nhà phát hành."
    >
      {error ? <p role="alert" className="rounded-lg border border-red-500/40 bg-red-950/30 p-3 text-sm text-red-300">{error}</p> : null}
      {notice ? <p role="status" className="rounded-lg border border-emerald-500/40 bg-emerald-950/30 p-3 text-sm text-emerald-300">{notice}</p> : null}

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-card p-4">
        <label className="flex items-center gap-2 text-sm font-semibold text-muted">
          Trạng thái
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-lg border border-line bg-page px-3 py-2 text-white">
            <option value="Pending">Chờ duyệt</option>
            <option value="Approved">Đã duyệt</option>
            <option value="Rejected">Đã từ chối</option>
            <option value="all">Tất cả</option>
          </select>
        </label>
        <button type="button" onClick={loadRequests} disabled={loading} className="rounded-lg border border-line bg-page px-4 py-2 text-sm font-semibold disabled:opacity-50">
          {loading ? 'Đang tải...' : 'Làm mới'}
        </button>
      </div>

      <section className="overflow-hidden rounded-2xl border border-white/10 bg-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] border-collapse text-left text-sm">
            <thead className="border-b border-white/10 bg-page/80 text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3">Mã lệnh / ngày gửi</th>
                <th className="px-4 py-3">Nhà phát hành</th>
                <th className="px-4 py-3">Số tiền</th>
                <th className="px-4 py-3">Thông tin nhận tiền</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredRequests.map((request) => (
                <tr key={request.RequestID} className="align-top hover:bg-white/[0.02]">
                  <td className="px-4 py-4">
                    <p className="m-0 font-mono text-xs text-accent-light">{request.RequestID}</p>
                    <p className="mb-0 mt-1 text-xs text-muted">{formatDate(request.RequestDate)}</p>
                  </td>
                  <td className="px-4 py-4">
                    <p className="m-0 font-semibold">{request.CompanyName || 'Nhà phát hành'}</p>
                    <p className="mb-0 mt-1 font-mono text-xs text-muted">{request.DeveloperID}</p>
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 font-mono font-bold text-emerald-400">{formatVnd(request.Amount)}</td>
                  <td className="max-w-sm whitespace-pre-wrap px-4 py-4 text-xs text-zinc-300">
                    {request.BankInfo || request.BankAccount || 'Chưa có thông tin tài khoản'}
                  </td>
                  <td className="px-4 py-4">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${request.Status === 'Pending' ? 'bg-amber-500/10 text-amber-400' : request.Status === 'Rejected' ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                      {request.Status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right">
                    {request.Status === 'Pending' ? (
                      <div className="flex justify-end gap-2">
                        <button type="button" disabled={submitting} onClick={() => approveRequest(request)} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold disabled:opacity-50">Đã chuyển khoản</button>
                        <button type="button" disabled={submitting} onClick={() => { setRejectTarget(request); setRejectReason(''); setError(''); }} className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-bold text-red-300 disabled:opacity-50">Từ chối</button>
                      </div>
                    ) : <span className="text-xs text-muted">Đã xử lý</span>}
                  </td>
                </tr>
              ))}
              {!loading && !filteredRequests.length ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-muted">Không có yêu cầu rút tiền phù hợp.</td></tr>
              ) : null}
              {loading ? <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-muted">Đang tải lệnh rút tiền...</td></tr> : null}
            </tbody>
          </table>
        </div>
      </section>

      {rejectTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="presentation">
          <form onSubmit={rejectRequest} role="dialog" aria-modal="true" aria-labelledby="withdrawal-reject-title" className="w-full max-w-lg space-y-4 rounded-2xl border border-white/10 bg-card p-6 shadow-2xl">
            <div>
              <h2 id="withdrawal-reject-title" className="m-0 text-lg font-bold">Từ chối lệnh rút tiền</h2>
              <p className="mb-0 mt-2 text-sm text-muted">Lệnh {rejectTarget.RequestID} sẽ được trả lại số dư khả dụng của nhà phát hành.</p>
            </div>
            <label className="block text-sm font-semibold text-muted">
              Lý do từ chối
              <textarea required value={rejectReason} onChange={(event) => setRejectReason(event.target.value)} maxLength={500} rows={4} className="mt-2 w-full resize-y rounded-lg border border-line bg-page px-3 py-2 text-white" />
            </label>
            <div className="flex justify-end gap-2">
              <button type="button" disabled={submitting} onClick={() => setRejectTarget(null)} className="rounded-lg border border-line px-4 py-2 text-sm">Hủy</button>
              <button type="submit" disabled={submitting || !rejectReason.trim()} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold disabled:opacity-50">{submitting ? 'Đang xử lý...' : 'Xác nhận từ chối'}</button>
            </div>
          </form>
        </div>
      ) : null}
    </AdminShell>
  );
}
