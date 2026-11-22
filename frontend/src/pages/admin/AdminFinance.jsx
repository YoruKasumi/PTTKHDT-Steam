import { useCallback, useEffect, useState } from 'react';
import AdminShell from '../../components/admin/AdminShell';
import { financeApi } from '../../api/finance';
import { formatVnd } from '../../utils/format';

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('vi-VN');
}

function MetricCard({ label, value, note }) {
  return (
    <article className="rounded-xl border border-white/10 bg-page p-4">
      <p className="m-0 text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="mb-0 mt-2 text-xl font-extrabold">{value}</p>
      {note ? <p className="mb-0 mt-1 text-xs text-muted">{note}</p> : null}
    </article>
  );
}

function EmptyRow({ colSpan, children }) {
  return <tr><td colSpan={colSpan} className="px-4 py-8 text-center text-sm text-muted">{children}</td></tr>;
}

export default function AdminFinance() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [overview, sales, commission, pendingPayouts, refunds, walletMovements] = await Promise.all([
        financeApi.overview(),
        financeApi.sales(),
        financeApi.commission(),
        financeApi.pendingPayouts(),
        financeApi.refunds(),
        financeApi.walletMovements(),
      ]);
      setDashboard({
        overview: overview?.data || {},
        sales: sales?.data || {},
        commission: commission?.data || {},
        pendingPayouts: pendingPayouts?.data || {},
        refunds: refunds?.data || {},
        walletMovements: walletMovements?.data || {},
      });
    } catch (loadError) {
      setError(loadError?.message || 'Không thể tải dữ liệu tài chính.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const exportReport = async () => {
    setExporting(true);
    setError('');
    setNotice('');
    try {
      const response = await financeApi.exportReport();
      if (!response?.report) throw new Error('API không trả về nội dung báo cáo.');
      const blob = new Blob([JSON.stringify(response.report, null, 2)], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `bao-cao-tai-chinh-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
      setNotice(`Đã tạo báo cáo ${response.report.reportId}.`);
    } catch (exportError) {
      setError(exportError?.message || 'Không thể tạo báo cáo tài chính.');
    } finally {
      setExporting(false);
    }
  };

  const overview = dashboard?.overview || {};
  const sales = dashboard?.sales || {};
  const commission = dashboard?.commission || {};
  const payouts = dashboard?.pendingPayouts || {};
  const refunds = dashboard?.refunds || {};
  const wallet = dashboard?.walletMovements || {};

  return (
    <AdminShell
      title="Tài chính sàn"
      description="Tổng quan doanh thu, hoa hồng, dòng tiền chờ rút, hoàn tiền và biến động ví theo dữ liệu backend."
    >
      {error ? <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{error}</p> : null}
      {notice ? <p role="status" className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-300">{notice}</p> : null}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="m-0 text-sm text-muted">Doanh số theo ngày hiển thị tối đa 30 ngày; nhật ký ví hiển thị tối đa 50 giao dịch gần nhất.</p>
        <div className="flex gap-2">
          <button type="button" onClick={exportReport} disabled={exporting || loading} className="rounded-lg bg-accent px-4 py-2 text-sm font-bold disabled:opacity-50">
            {exporting ? 'Đang tạo...' : 'Tạo báo cáo JSON'}
          </button>
          <button type="button" onClick={loadDashboard} disabled={loading} className="rounded-lg border border-line px-4 py-2 text-sm font-semibold disabled:opacity-50">
            {loading ? 'Đang tải...' : 'Làm mới'}
          </button>
        </div>
      </div>
      {loading && !dashboard ? <p className="py-8 text-center text-sm text-muted">Đang tải báo cáo tài chính...</p> : null}

      <section aria-label="Tổng quan tài chính" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Đơn hàng hoàn tất" value={overview.totalCompletedOrders ?? '—'} />
        <MetricCard label="Tổng doanh thu" value={overview.totalGrossRevenue != null ? formatVnd(overview.totalGrossRevenue) : '—'} />
        <MetricCard label="Hoàn tiền" value={overview.totalRefunds != null ? formatVnd(overview.totalRefunds) : '—'} />
        <MetricCard label="Doanh thu ròng" value={overview.netSales != null ? formatVnd(overview.netSales) : '—'} />
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <MetricCard label={`Hoa hồng nền tảng (${overview.platformFeeRate || commission.commissionRate || '—'})`} value={overview.platformCommission != null ? formatVnd(overview.platformCommission) : commission.platformCommission != null ? formatVnd(commission.platformCommission) : '—'} />
        <MetricCard label="Phần doanh thu nhà phát hành" value={overview.developerPayoutPool != null ? formatVnd(overview.developerPayoutPool) : '—'} note="Sau khi trừ hoàn tiền và hoa hồng nền tảng" />
      </section>

      <section className="overflow-hidden rounded-2xl border border-white/10 bg-card">
        <div className="border-b border-white/10 p-5">
          <h2 className="m-0 text-lg font-bold">Doanh số theo ngày</h2>
          <p className="mb-0 mt-1 text-sm text-muted">
            {sales.summary ? `${sales.summary.daysTracked} ngày · ${sales.summary.totalOrders} đơn · ${formatVnd(sales.summary.totalAmount)}` : 'Chưa có dữ liệu'}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="bg-page text-xs uppercase text-muted">
              <tr><th className="px-4 py-3">Ngày</th><th className="px-4 py-3">Đơn hàng</th><th className="px-4 py-3 text-right">Doanh thu</th></tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {(sales.timeline || []).map((row) => (
                <tr key={String(row.OrderDate)} className="hover:bg-white/[0.02]">
                  <td className="px-4 py-3">{formatDate(row.OrderDate)}</td>
                  <td className="px-4 py-3">{Number(row.OrderCount || 0)}</td>
                  <td className="px-4 py-3 text-right font-mono">{formatVnd(row.DailyRevenue)}</td>
                </tr>
              ))}
              {!loading && !(sales.timeline || []).length ? <EmptyRow colSpan={3}>Không có dữ liệu doanh số.</EmptyRow> : null}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-2">
        <section className="overflow-hidden rounded-2xl border border-white/10 bg-card">
          <div className="border-b border-white/10 p-5">
            <h2 className="m-0 text-lg font-bold">Dòng tiền nhà phát hành chờ rút</h2>
            <p className="mb-0 mt-1 text-sm text-muted">{payouts.totalPendingDevelopers || 0} nhà phát hành · {formatVnd(payouts.totalPendingAmount || 0)}</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] text-left text-sm">
              <thead className="bg-page text-xs uppercase text-muted"><tr><th className="px-4 py-3">Mã nhà phát hành</th><th className="px-4 py-3 text-right">Chờ rút</th></tr></thead>
              <tbody className="divide-y divide-white/5">
                {(payouts.developers || []).map((developer) => (
                  <tr key={developer.developerId}><td className="px-4 py-3 font-mono text-xs">{developer.developerId}</td><td className="px-4 py-3 text-right font-mono">{formatVnd(developer.pendingAmount)}</td></tr>
                ))}
                {!loading && !(payouts.developers || []).length ? <EmptyRow colSpan={2}>Không có khoản chờ rút.</EmptyRow> : null}
              </tbody>
            </table>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-white/10 bg-card">
          <div className="border-b border-white/10 p-5">
            <h2 className="m-0 text-lg font-bold">Hoàn tiền đã duyệt</h2>
            <p className="mb-0 mt-1 text-sm text-muted">{refunds.totalRefundedOrders || 0} yêu cầu · {formatVnd(refunds.totalRefundedAmount || 0)}</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="bg-page text-xs uppercase text-muted"><tr><th className="px-4 py-3">Mã yêu cầu / đơn</th><th className="px-4 py-3">Khách hàng</th><th className="px-4 py-3 text-right">Số tiền</th></tr></thead>
              <tbody className="divide-y divide-white/5">
                {(refunds.recentRefunds || []).map((refund) => (
                  <tr key={refund.RequestID}>
                    <td className="px-4 py-3"><p className="m-0 font-mono text-xs">{refund.RequestID}</p><p className="mb-0 mt-1 text-xs text-muted">{refund.OrderID} · {formatDate(refund.RequestDate)}</p></td>
                    <td className="px-4 py-3 font-mono text-xs">{refund.CustomerID}</td>
                    <td className="px-4 py-3 text-right font-mono">{formatVnd(refund.RefundAmount)}</td>
                  </tr>
                ))}
                {!loading && !(refunds.recentRefunds || []).length ? <EmptyRow colSpan={3}>Không có yêu cầu hoàn tiền đã duyệt.</EmptyRow> : null}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <section className="overflow-hidden rounded-2xl border border-white/10 bg-card">
        <div className="grid gap-3 border-b border-white/10 p-5 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard label="Số ví" value={wallet.totalWalletsCount ?? '—'} />
          <MetricCard label="Số dư lưu thông" value={wallet.totalCirculatingBalance != null ? formatVnd(wallet.totalCirculatingBalance) : '—'} />
          <MetricCard label="Tổng giao dịch" value={wallet.totalTransactions ?? '—'} note={`${wallet.pendingTransactions || 0} chờ · ${wallet.failedTransactions || 0} lỗi`} />
          <MetricCard label="Dòng tiền vào / ra" value={wallet.totalInflows != null ? `${formatVnd(wallet.totalInflows)} / ${formatVnd(wallet.totalOutflows)}` : '—'} note={`${wallet.successfulTransactions || 0} giao dịch thành công`} />
        </div>
        <div className="border-b border-white/10 p-5">
          <h2 className="m-0 text-lg font-bold">Biến động ví gần đây</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left text-sm">
            <thead className="bg-page text-xs uppercase text-muted">
              <tr><th className="px-4 py-3">Giao dịch</th><th className="px-4 py-3">Khách hàng</th><th className="px-4 py-3">Loại</th><th className="px-4 py-3">Trạng thái</th><th className="px-4 py-3 text-right">Số tiền</th></tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {(wallet.recentTransactions || []).map((transaction) => (
                <tr key={transaction.TransID}>
                  <td className="px-4 py-3"><p className="m-0 font-mono text-xs">{transaction.TransID}</p><p className="mb-0 mt-1 text-xs text-muted">{formatDate(transaction.TransDate)}</p></td>
                  <td className="px-4 py-3 font-mono text-xs">{transaction.CustomerID}</td>
                  <td className="px-4 py-3">{transaction.Type}</td>
                  <td className="px-4 py-3">{transaction.Status}</td>
                  <td className="px-4 py-3 text-right font-mono">{formatVnd(transaction.Amount)}</td>
                </tr>
              ))}
              {!loading && !(wallet.recentTransactions || []).length ? <EmptyRow colSpan={5}>Chưa có giao dịch ví.</EmptyRow> : null}
            </tbody>
          </table>
        </div>
      </section>
    </AdminShell>
  );
}
