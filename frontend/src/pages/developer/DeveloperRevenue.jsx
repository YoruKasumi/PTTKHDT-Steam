import { useState } from 'react';
import DeveloperShell from '../../components/developer/DeveloperShell';
import { formatVnd } from '../../utils/format';

const gameRevenue = [
  { game: 'Cyber Odyssey 2088', sales: 68, gross: 30600000, refunds: -1800000, fee: -4320000, net: 24480000, share: 35 },
  { game: 'Tiny Pasture', sales: 245, gross: 18620000, refunds: -380000, fee: -2736000, net: 15504000, share: 22 },
  { game: 'R.E.P.O.', sales: 310, gross: 36270000, refunds: -1404000, fee: -5229900, net: 29636100, share: 43 },
];

const initialWithdrawals = [
  { id: '#WDR-2094', amount: 12000000, date: '14/11/2026 15:30', status: 'Pending' },
  { id: '#WDR-1982', amount: 25000000, date: '01/11/2026 09:15', status: 'Approved' },
  { id: '#WDR-1850', amount: 18500000, date: '15/10/2026 11:00', status: 'Approved' },
];

function downloadCsv(filename, rows) {
  const contents = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\n');
  const url = URL.createObjectURL(new Blob([`\uFEFF${contents}`], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function DeveloperRevenue() {
  const [fromDate, setFromDate] = useState('2026-10-01');
  const [toDate, setToDate] = useState('2026-11-15');
  const [period, setPeriod] = useState({ from: '2026-10-01', to: '2026-11-15' });
  const [withdrawAmount, setWithdrawAmount] = useState('5000000');
  const [available, setAvailable] = useState(68420000);
  const [withdrawals, setWithdrawals] = useState(initialWithdrawals);
  const [message, setMessage] = useState('');

  const applyPeriod = (event) => {
    event.preventDefault();
    if (!fromDate || !toDate || fromDate > toDate) {
      setMessage('Vui lòng chọn khoảng ngày hợp lệ.');
      return;
    }
    setPeriod({ from: fromDate, to: toDate });
    setMessage(`Đã áp dụng kỳ đối soát ${fromDate} – ${toDate}. Dữ liệu đang dùng là dữ liệu mẫu.`);
  };

  const exportCsv = () => {
    downloadCsv('bang-ke-doi-soat.csv', [
      ['Tựa Game', 'Lượt Bán', 'Doanh Thu Gộp', 'Hoàn Tiền', 'Phí Sàn', 'Thực Nhận'],
      ...gameRevenue.map((row) => [row.game, row.sales, row.gross, row.refunds, row.fee, row.net]),
    ]);
  };

  const requestWithdrawal = (event) => {
    event.preventDefault();
    const amount = Number(withdrawAmount);
    if (!Number.isInteger(amount) || amount < 500000) {
      setMessage('Số tiền rút tối thiểu là 500.000 ₫.');
      return;
    }
    if (amount > available) {
      setMessage('Số tiền yêu cầu vượt quá số dư doanh thu khả dụng.');
      return;
    }
    const id = `#WDR-${String(Date.now()).slice(-4)}`;
    setWithdrawals((current) => [
      { id, amount, date: new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date()), status: 'Pending' },
      ...current,
    ]);
    setAvailable((current) => current - amount);
    setMessage(`Đã gửi yêu cầu rút ${formatVnd(amount)}. Lệnh đang chờ duyệt.`);
  };

  return (
    <DeveloperShell
      title="Báo cáo đối soát & rút tiền"
      description={`Theo dõi doanh thu theo từng tựa game và gửi yêu cầu rút về tài khoản ngân hàng. Kỳ đang xem: ${period.from} – ${period.to}.`}
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
        <button type="submit" className="rounded-lg border border-line bg-page px-4 py-2.5 text-sm font-bold">Lọc kỳ báo cáo</button>
        <button type="button" onClick={exportCsv} className="rounded-lg border border-accent/40 bg-accent/10 px-4 py-2.5 text-sm font-bold text-accent-light">
          ↓ Kết xuất bảng kê (.CSV)
        </button>
        <button type="button" onClick={() => window.print()} className="rounded-lg bg-accent px-4 py-2.5 text-sm font-bold">
          In / Xuất PDF đối soát
        </button>
      </form>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: '1. Tổng doanh thu gộp (Gross Revenue)', amount: 85490000, note: 'SUM(ORDERITEM.PriceAfterDiscount)', tone: 'text-white' },
          { label: '2. Khấu trừ hoàn tiền (≤ 24h)', amount: -3584000, note: 'Các đơn hoàn tiền hợp lệ trong 24 giờ', tone: 'text-red-400' },
          { label: '3. Phí hoa hồng nền tảng (15%)', amount: -12285900, note: 'Khấu trừ theo tham số SYSTEM_CONFIG', tone: 'text-amber-400' },
          { label: '4. Doanh thu ròng thực nhận (Net Revenue)', amount: 69620100, note: `Khả dụng rút ngay: ${formatVnd(available)}`, tone: 'text-emerald-400' },
        ].map((stat) => (
          <section key={stat.label} className="rounded-xl border border-white/10 bg-card p-5">
            <p className="m-0 min-h-10 text-xs font-bold uppercase text-muted">{stat.label}</p>
            <p className={`mb-0 mt-2 font-mono text-2xl font-extrabold ${stat.tone}`}>{formatVnd(stat.amount)}</p>
            <p className="mb-0 mt-3 text-xs text-muted">{stat.note}</p>
          </section>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(340px,0.9fr)]">
        <section className="min-w-0 space-y-5 rounded-2xl border border-white/10 bg-card p-5">
          <h2 className="m-0 text-lg font-bold">Biểu đồ & Bảng kê đối soát theo từng tựa game</h2>
          <div className="space-y-4 rounded-xl border border-white/10 bg-page p-4">
            {gameRevenue.map((row) => (
              <div key={row.game}>
                <div className="flex flex-wrap justify-between gap-2 text-sm">
                  <span className="font-semibold">{row.game} ({row.sales} bản)</span>
                  <span className="font-mono font-bold text-emerald-400">{formatVnd(row.net)} ({row.share}%)</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-card">
                  <div className="h-full rounded-full bg-gradient-to-r from-accent to-accent-light" style={{ width: `${row.share}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] border-collapse text-left text-xs">
              <thead className="bg-page uppercase text-muted">
                <tr>
                  <th className="px-3 py-3">Tựa Game</th>
                  <th className="px-3 py-3">Lượt bán</th>
                  <th className="px-3 py-3">Doanh thu gộp</th>
                  <th className="px-3 py-3">Hoàn tiền</th>
                  <th className="px-3 py-3">Phí sàn (15%)</th>
                  <th className="px-3 py-3">Thực nhận</th>
                </tr>
              </thead>
              <tbody>
                {gameRevenue.map((row) => (
                  <tr key={row.game} className="border-b border-white/5">
                    <td className="px-3 py-3 font-semibold">{row.game}</td>
                    <td className="px-3 py-3">{row.sales}</td>
                    <td className="whitespace-nowrap px-3 py-3">{formatVnd(row.gross)}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-red-400">{formatVnd(row.refunds)}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-amber-400">{formatVnd(row.fee)}</td>
                    <td className="whitespace-nowrap px-3 py-3 font-bold text-emerald-400">{formatVnd(row.net)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-5 rounded-2xl border border-white/10 bg-card p-5">
          <form onSubmit={requestWithdrawal} className="space-y-4">
            <h2 className="m-0 border-b border-white/10 pb-4 text-lg font-bold">Rút doanh thu về ngân hàng</h2>
            <div className="rounded-xl border border-accent/30 bg-page p-4">
              <p className="m-0 text-sm text-muted">Số dư doanh thu khả dụng</p>
              <p className="mb-0 mt-1 text-xl font-extrabold text-emerald-400">{formatVnd(available)}</p>
              <p className="mb-0 mt-2 text-xs text-muted">Đã trừ khoản tạm giữ hoàn tiền 24h và lệnh rút đang chờ duyệt.</p>
              <p className="mb-0 mt-3 rounded-md bg-card p-2 text-xs">Thụ hưởng: VCB - 0071001294821 - NGUYEN VAN A</p>
            </div>
            <label className="block text-sm font-semibold text-muted">
              Số tiền yêu cầu rút (tối thiểu 500.000 ₫)
              <input
                type="number"
                min="500000"
                step="1"
                value={withdrawAmount}
                onChange={(event) => setWithdrawAmount(event.target.value)}
                className="mt-2 w-full rounded-lg border border-line bg-page px-3 py-2.5 font-mono text-white"
              />
            </label>
            <button type="submit" className="w-full rounded-lg bg-accent px-4 py-3 font-bold">Gửi yêu cầu rút doanh thu</button>
          </form>

          <div>
            <h3 className="mb-3 mt-0 text-sm font-bold uppercase text-muted">Lịch sử lệnh rút doanh thu</h3>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[420px] border-collapse text-left text-xs">
                <thead className="bg-page uppercase text-muted">
                  <tr>
                    <th className="px-2 py-2">Mã lệnh</th>
                    <th className="px-2 py-2">Số tiền</th>
                    <th className="px-2 py-2">Ngày tạo</th>
                    <th className="px-2 py-2">Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {withdrawals.map((request) => (
                    <tr key={request.id} className="border-b border-white/5">
                      <td className="whitespace-nowrap px-2 py-3 font-mono text-accent-light">{request.id}</td>
                      <td className="whitespace-nowrap px-2 py-3">{formatVnd(request.amount)}</td>
                      <td className="whitespace-nowrap px-2 py-3 text-muted">{request.date}</td>
                      <td className="px-2 py-3">
                        <span className={`rounded-full px-2 py-1 font-bold ${request.status === 'Pending' ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                          {request.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
      {message ? <p role="status" className="m-0 rounded-lg border border-accent/30 bg-card p-3 text-sm text-accent-light">{message}</p> : null}
    </DeveloperShell>
  );
}
