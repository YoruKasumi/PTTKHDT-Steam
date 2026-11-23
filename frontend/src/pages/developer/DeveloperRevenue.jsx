import { useCallback, useEffect, useMemo, useState } from 'react';
import DeveloperShell from '../../components/developer/DeveloperShell';
import { reportApi } from '../../api/report';
import { withdrawalApi } from '../../api/withdrawal';
import { formatVnd } from '../../utils/format';

function localDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function downloadCsv(filename, rows) {
  const contents = rows
    .map((row) => row.map((cell) => `"${String(cell ?? '').replaceAll('"', '""')}"`).join(','))
    .join('\n');
  const url = URL.createObjectURL(new Blob([`\uFEFF${contents}`], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function formatDate(value) {
  return value ? new Date(value).toLocaleString('vi-VN') : '—';
}

export default function DeveloperRevenue() {
  const now = new Date();
  const [fromDate, setFromDate] = useState(() => localDate(new Date(now.getFullYear(), now.getMonth(), 1)));
  const [toDate, setToDate] = useState(() => localDate(now));
  const [period, setPeriod] = useState(() => ({
    from: localDate(new Date(now.getFullYear(), now.getMonth(), 1)),
    to: localDate(now),
  }));
  const [report, setReport] = useState(null);
  const [statement, setStatement] = useState(null);
  const [engagement, setEngagement] = useState([]);
  const [withdrawalData, setWithdrawalData] = useState({ availableRevenue: 0, withdrawals: [] });
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [bankInfo, setBankInfo] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadData = useCallback(async (dateRange) => {
    setLoading(true);
    setError('');
    try {
      const params = { fromDate: dateRange.from, toDate: dateRange.to };
      const [reportResult, statementResult, engagementResult, withdrawalResult] = await Promise.all([
        reportApi.getRevenueReport(params),
        reportApi.getStatement(params),
        reportApi.getEngagementStats(),
        withdrawalApi.getMyRequests(),
      ]);
      setReport(reportResult);
      setStatement(statementResult?.statement ?? null);
      setEngagement(Array.isArray(engagementResult?.data) ? engagementResult.data : []);
      setWithdrawalData({
        availableRevenue: Number(withdrawalResult?.availableRevenue || 0),
        withdrawals: Array.isArray(withdrawalResult?.withdrawals) ? withdrawalResult.withdrawals : [],
      });
    } catch (loadError) {
      setError(loadError?.message || 'Không thể tải dữ liệu đối soát.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(period);
  }, [loadData, period]);

  const games = Array.isArray(report?.games) ? report.games : [];
  const summary = report?.summary || statement?.metrics || {};
  const engagementByGame = useMemo(
    () => new Map(engagement.map((item) => [item.gameId, item])),
    [engagement],
  );
  const maxGross = Math.max(1, ...games.map((game) => Number(game.grossRevenue || 0)));
  const available = withdrawalData.availableRevenue;

  const applyPeriod = (event) => {
    event.preventDefault();
    if (!fromDate || !toDate || fromDate > toDate) {
      setMessage('Vui lòng chọn khoảng ngày hợp lệ.');
      return;
    }
    const nextPeriod = { from: fromDate, to: toDate };
    setPeriod(nextPeriod);
    setMessage('');
  };

  const exportCsv = () => {
    downloadCsv('bang-ke-doi-soat.csv', [
      ['Game', 'Lượt bán', 'Doanh thu gộp', 'Ước tính thực nhận', 'Wishlist', 'Lượt hoàn'],
      ...games.map((game) => {
        const stats = engagementByGame.get(game.gameId);
        return [
          game.title,
          game.unitsSold,
          game.grossRevenue,
          game.devShareEstimate,
          stats?.wishlistCount || 0,
          stats?.refundCount || 0,
        ];
      }),
    ]);
  };

  const requestWithdrawal = async (event) => {
    event.preventDefault();
    const amount = Number(withdrawAmount);
    if (!Number.isInteger(amount) || amount < 1000000) {
      setMessage('Số tiền rút tối thiểu là 1.000.000 ₫.');
      return;
    }
    if (amount > available) {
      setMessage(`Số tiền yêu cầu vượt quá số dư doanh thu khả dụng (${formatVnd(available)}).`);
      return;
    }

    setSubmitting(true);
    setMessage('');
    try {
      const result = await withdrawalApi.createWithdrawal({ amount, bankInfo: bankInfo.trim() });
      setMessage(result?.message || 'Đã gửi yêu cầu rút tiền.');
      await loadData(period);
    } catch (submitError) {
      setMessage(submitError?.message || 'Không thể gửi yêu cầu rút tiền.');
    } finally {
      setSubmitting(false);
    }
  };

  const totalRefunds = Number(summary.totalRefunds || 0);
  const feeRate = summary.platformFeeRate || '30%';

  return (
    <DeveloperShell
      title="Báo cáo đối soát & rút tiền"
      description={`Theo dõi doanh thu theo từng tựa game và gửi yêu cầu rút tiền. Kỳ đang xem: ${period.from} – ${period.to}.`}
    >
      <form onSubmit={applyPeriod} className="flex flex-wrap items-end gap-3 rounded-2xl border border-white/10 bg-card p-5">
        <label className="text-sm font-semibold text-muted">
          Kỳ đối soát từ ngày
          <input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} className="mt-2 block rounded-lg border border-line bg-page px-3 py-2 text-white" />
        </label>
        <label className="text-sm font-semibold text-muted">
          Đến ngày
          <input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} className="mt-2 block rounded-lg border border-line bg-page px-3 py-2 text-white" />
        </label>
        <button type="submit" disabled={loading} className="rounded-lg border border-line bg-page px-4 py-2.5 text-sm font-bold disabled:opacity-50">Lọc kỳ báo cáo</button>
        <button type="button" onClick={exportCsv} disabled={loading || !games.length} className="rounded-lg border border-accent/40 bg-accent/10 px-4 py-2.5 text-sm font-bold text-accent-light disabled:opacity-50">
          ↓ Kết xuất bảng kê (.CSV)
        </button>
      </form>

      {error ? <p role="alert" className="rounded-xl border border-red-500/40 bg-red-950 p-4 text-sm text-red-200">{error}</p> : null}
      {message ? <p role="status" className="rounded-xl border border-accent/40 bg-card p-4 text-sm text-accent-light">{message}</p> : null}

      {!loading ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <section className="rounded-xl border border-white/10 bg-card p-5">
              <p className="m-0 text-xs font-bold uppercase text-muted">Doanh thu gộp</p>
              <p className="mb-0 mt-2 font-mono text-2xl font-extrabold">{formatVnd(summary.grossRevenue || 0)}</p>
              <p className="mb-0 mt-1 text-xs text-muted">Tổng tiền người dùng đã thanh toán</p>
            </section>
            <section className="rounded-xl border border-accent bg-card p-5 shadow-lg shadow-accent/10">
              <p className="m-0 text-xs font-bold uppercase text-muted">Ước tính thực nhận (70%)</p>
              <p className="mb-0 mt-2 font-mono text-2xl font-extrabold text-accent-light">{formatVnd(summary.netRevenue || summary.devShareEstimate || 0)}</p>
              <p className="mb-0 mt-1 text-xs text-muted">Phí nền tảng cố định: {feeRate}</p>
            </section>
            <section className="rounded-xl border border-white/10 bg-card p-5">
              <p className="m-0 text-xs font-bold uppercase text-muted">Tổng số lượt tải có phí</p>
              <p className="mb-0 mt-2 font-mono text-2xl font-extrabold">{summary.totalUnitsSold || 0}</p>
              <p className="mb-0 mt-1 text-xs text-muted">Không tính key kích hoạt miễn phí</p>
            </section>
            <section className="rounded-xl border border-white/10 bg-card p-5">
              <p className="m-0 text-xs font-bold uppercase text-muted">Giá trị hoàn tiền trong kỳ</p>
              <p className="mb-0 mt-2 font-mono text-2xl font-extrabold text-amber-400">{formatVnd(totalRefunds)}</p>
              <p className="mb-0 mt-1 text-xs text-muted">Đã tự trừ vào số dư có thể rút</p>
            </section>
          </div>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
            <section className="space-y-5 rounded-2xl border border-white/10 bg-card p-5">
              <h2 className="m-0 border-b border-white/10 pb-4 text-lg font-bold">Doanh số chi tiết theo sản phẩm</h2>
              {games.length ? (
                <>
                  <div className="space-y-3">
                    {games.map((game) => (
                      <div key={game.gameId} className="space-y-1 text-xs">
                        <div className="flex justify-between font-semibold">
                          <span>{game.title} ({game.unitsSold} bản)</span>
                          <span className="font-mono text-accent-light">{formatVnd(game.grossRevenue)}</span>
                        </div>
                        <div className="h-2 rounded-full bg-page">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-accent to-accent-light"
                            style={{ width: `${Math.max(8, Math.round((Number(game.grossRevenue || 0) / maxGross) * 100))}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full min-w-[500px] border-collapse text-left text-xs">
                      <thead className="bg-page uppercase text-muted">
                        <tr><th className="px-3 py-2">Tựa game</th><th className="px-3 py-2">Lượt bán</th><th className="px-3 py-2">Doanh thu gộp</th><th className="px-3 py-2">Thực nhận (70%)</th><th className="px-3 py-2">Wishlist / Hoàn</th></tr>
                      </thead>
                      <tbody>
                        {games.map((game) => {
                          const stats = engagementByGame.get(game.gameId);
                          return (
                            <tr key={game.gameId} className="border-b border-white/5">
                              <td className="px-3 py-3 font-semibold">{game.title}</td>
                              <td className="px-3 py-3">{game.unitsSold}</td>
                              <td className="whitespace-nowrap px-3 py-3">{formatVnd(game.grossRevenue)}</td>
                              <td className="whitespace-nowrap px-3 py-3 font-bold text-emerald-400">{formatVnd(game.devShareEstimate)}</td>
                              <td className="px-3 py-3">{stats?.wishlistCount || 0} / {stats?.refundCount || 0}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : <p className="m-0 text-sm text-muted">Chưa có doanh thu trong kỳ này.</p>}
              {statement?.statementId ? <p className="m-0 text-xs text-muted">Mã bảng kê: {statement.statementId}</p> : null}
            </section>

            <section className="space-y-5 rounded-2xl border border-white/10 bg-card p-5">
              <form onSubmit={requestWithdrawal} className="space-y-4">
                <h2 className="m-0 border-b border-white/10 pb-4 text-lg font-bold">Rút doanh thu về ngân hàng</h2>
                <div className="rounded-xl border border-accent/30 bg-page p-4">
                  <p className="m-0 text-sm text-muted">Số dư doanh thu khả dụng</p>
                  <p className="mb-0 mt-1 text-xl font-extrabold text-emerald-400">{formatVnd(available)}</p>
                </div>
                <label className="block text-sm font-semibold text-muted">
                  Số tiền yêu cầu rút (tối thiểu 1.000.000 ₫, tối đa {formatVnd(available)})
                  <input
                    type="number"
                    min="1000000"
                    max={available}
                    step="1"
                    value={withdrawAmount}
                    onChange={(event) => setWithdrawAmount(event.target.value)}
                    className="mt-2 w-full rounded-lg border border-line bg-page px-3 py-2.5 font-mono text-white"
                  />
                </label>
                <label className="block text-sm font-semibold text-muted">
                  Thông tin tài khoản nhận tiền
                  <input required value={bankInfo} onChange={(event) => setBankInfo(event.target.value)} maxLength={100} placeholder="Tên ngân hàng, số tài khoản, chủ tài khoản" className="mt-2 w-full rounded-lg border border-line bg-page px-3 py-2.5 text-white" />
                </label>
                <button type="submit" disabled={loading || submitting || !available} className="w-full rounded-lg bg-accent px-4 py-3 font-bold disabled:opacity-50">
                  {submitting ? 'Đang gửi yêu cầu...' : 'Gửi yêu cầu rút doanh thu'}
                </button>
              </form>

              <div>
                <h3 className="mb-3 mt-0 text-sm font-bold uppercase text-muted">Lịch sử lệnh rút doanh thu</h3>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[420px] border-collapse text-left text-xs">
                    <thead className="bg-page uppercase text-muted">
                      <tr><th className="px-2 py-2">Mã lệnh</th><th className="px-2 py-2">Số tiền</th><th className="px-2 py-2">Ngày tạo</th><th className="px-2 py-2">Trạng thái</th></tr>
                    </thead>
                    <tbody>
                      {withdrawalData.withdrawals.map((request) => (
                        <tr key={request.requestId} className="border-b border-white/5">
                          <td className="whitespace-nowrap px-2 py-3 font-mono text-accent-light">{request.requestId}</td>
                          <td className="whitespace-nowrap px-2 py-3">{formatVnd(request.amount)}</td>
                          <td className="whitespace-nowrap px-2 py-3 text-muted">{formatDate(request.requestDate)}</td>
                          <td className="px-2 py-3">
                            <span className={`rounded-full px-2 py-1 font-bold ${request.status === 'Pending' ? 'bg-amber-500/10 text-amber-400' : request.status === 'Rejected' ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                              {request.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {!withdrawalData.withdrawals.length ? <tr><td colSpan={4} className="px-2 py-4 text-center text-muted">Chưa có lệnh rút tiền.</td></tr> : null}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          </div>
        </>
      ) : null}
    </DeveloperShell>
  );
}
