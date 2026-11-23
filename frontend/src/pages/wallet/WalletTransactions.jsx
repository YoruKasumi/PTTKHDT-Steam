import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { walletApi } from '../../api/wallet';
import { formatVnd } from '../../utils/format';

const TYPE_OPTIONS = [
  { value: 'All', label: 'Tất cả loại giao dịch' },
  { value: 'Deposit', label: 'Nạp tiền (Deposit)' },
  { value: 'Withdraw', label: 'Rút tiền (Withdraw)' },
  { value: 'Purchase', label: 'Mua game (Purchase)' },
  { value: 'Refund', label: 'Hoàn tiền (Refund)' },
  { value: 'Fee', label: 'Phí hệ thống (Fee)' },
];

export default function WalletTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Bộ lọc
  const [selectedType, setSelectedType] = useState('All');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [keyword, setKeyword] = useState('');

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (selectedType && selectedType !== 'All') params.type = selectedType;
      if (fromDate) params.from = fromDate;
      if (toDate) params.to = toDate;
      if (keyword.trim()) params.keyword = keyword.trim();

      const res = await walletApi.yeuCauXemLichSuGiaoDich(params);
      const list = res?.data || res || [];
      setTransactions(Array.isArray(list) ? list : []);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Không thể tải lịch sử giao dịch.');
    } finally {
      setLoading(false);
    }
  }, [selectedType, fromDate, toDate, keyword]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleResetFilters = () => {
    setSelectedType('All');
    setFromDate('');
    setToDate('');
    setKeyword('');
  };

  const exportStatement = () => {
    if (!transactions.length) return;
    const header = 'Mã giao dịch,Loại,Sản phẩm / Đơn hàng,Thời gian,Số tiền,Trạng thái\n';
    const rows = transactions.map((t) => {
      const type = t.type;
      const desc = `"${(t.productNames || t.orderId || '').replace(/"/g, '""')}"`;
      const date = t.date || t.transDate;
      const amt = t.amount;
      const status = t.status || 'Success';
      return `${t.id || t.transId},${type},${desc},${date},${amt},${status}`;
    }).join('\n');

    const blob = new Blob([`\uFEFF${header}${rows}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sao-ke-vi-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 pb-20 pt-10 md:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="m-0 text-2xl font-extrabold">Biến động số dư ví</h1>
          <p className="mb-0 mt-2 text-sm text-muted">
            Lịch sử toàn bộ các khoản nạp, rút, thanh toán đơn hàng và hoàn tiền trong hệ thống.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={exportStatement}
            disabled={!transactions.length}
            className="rounded-lg border border-line px-4 py-2 text-xs font-bold hover:border-accent disabled:opacity-50"
          >
            Xuất file CSV
          </button>
          <Link to="/wallet" className="text-sm font-bold text-accent-light hover:underline">
            ← Quay lại Ví
          </Link>
        </div>
      </div>

      {/* Bộ lọc giao dịch */}
      <section className="mt-7 rounded-2xl border border-white/10 bg-card p-5">
        <h2 className="m-0 text-base font-bold text-muted uppercase tracking-wider">Bộ lọc tra cứu</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label htmlFor="filter-type" className="block text-xs font-semibold text-muted">
              Loại biến động
            </label>
            <select
              id="filter-type"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-line bg-page px-3 py-2 text-sm text-white outline-none focus:border-accent"
            >
              {TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="filter-keyword" className="block text-xs font-semibold text-muted">
              Tên game hoặc mã đơn hàng
            </label>
            <input
              id="filter-keyword"
              type="text"
              placeholder="VD: Cyber Samurai, ORD-..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-line bg-page px-3 py-2 text-sm text-white outline-none focus:border-accent"
            />
          </div>

          <div>
            <label htmlFor="filter-from" className="block text-xs font-semibold text-muted">
              Từ ngày
            </label>
            <input
              id="filter-from"
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-line bg-page px-3 py-2 text-sm text-white outline-none focus:border-accent"
            />
          </div>

          <div>
            <label htmlFor="filter-to" className="block text-xs font-semibold text-muted">
              Đến ngày
            </label>
            <input
              id="filter-to"
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-line bg-page px-3 py-2 text-sm text-white outline-none focus:border-accent"
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-3">
          <button
            type="button"
            onClick={handleResetFilters}
            className="rounded-lg border border-line px-3 py-1.5 text-xs font-bold text-muted hover:text-white"
          >
            Xóa bộ lọc
          </button>
        </div>
      </section>

      {/* Bảng danh sách giao dịch */}
      {error ? (
        <p role="alert" className="mt-5 rounded-lg border border-red-500/30 bg-red-500/10 p-3.5 text-sm text-red-400">
          {error}
        </p>
      ) : null}

      <section className="mt-5 rounded-2xl border border-white/10 bg-card p-5">
        <div className="flex items-center justify-between pb-3">
          <h2 className="m-0 text-lg font-bold">
            Danh sách giao dịch ({transactions.length})
          </h2>
        </div>

        {loading ? (
          <p className="py-12 text-center text-sm text-muted">Đang tải lịch sử giao dịch…</p>
        ) : !transactions.length ? (
          <p className="py-12 text-center text-sm text-muted">
            Không tìm thấy giao dịch nào phù hợp với điều kiện tìm kiếm.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] border-collapse text-left text-sm">
              <thead className="bg-page text-xs uppercase text-muted">
                <tr>
                  <th className="px-3 py-3">Mã GD</th>
                  <th className="px-3 py-3">Loại</th>
                  <th className="px-3 py-3">Chi tiết nội dung / Game</th>
                  <th className="px-3 py-3">Thời gian</th>
                  <th className="px-3 py-3">Trạng thái</th>
                  <th className="px-3 py-3 text-right">Số tiền</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => {
                  const isPlus = tx.type === 'Deposit' || tx.type === 'Refund';
                  const isFailed = tx.status === 'Failed';
                  const typeBadge = {
                    Deposit: { text: 'Nạp tiền', cls: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' },
                    Withdraw: { text: 'Rút tiền', cls: 'border-amber-500/30 bg-amber-500/10 text-amber-400' },
                    Purchase: { text: 'Mua game', cls: 'border-indigo-500/30 bg-indigo-500/10 text-indigo-300' },
                    Refund: { text: 'Hoàn tiền', cls: 'border-blue-500/30 bg-blue-500/10 text-blue-300' },
                    Fee: { text: 'Phí sàn', cls: 'border-purple-500/30 bg-purple-500/10 text-purple-300' },
                  }[tx.type] || { text: tx.type, cls: 'border-white/20 text-muted' };

                  const dateStr = tx.date || tx.transDate
                    ? new Date(tx.date || tx.transDate).toLocaleString('vi-VN')
                    : '—';

                  return (
                    <tr key={tx.id || tx.transId} className="border-b border-white/5 align-middle">
                      <td className="px-3 py-4 font-mono text-xs text-accent-light">
                        {(tx.id || tx.transId || '').slice(0, 13)}…
                      </td>
                      <td className="px-3 py-4">
                        <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-bold ${typeBadge.cls}`}>
                          {typeBadge.text}
                        </span>
                      </td>
                      <td className="px-3 py-4">
                        <p className="m-0 font-semibold text-white">
                          {tx.productNames ? tx.productNames : tx.orderId ? `Đơn hàng #${tx.orderId}` : typeBadge.text}
                        </p>
                        {tx.orderId && tx.productNames && (
                          <p className="m-0 mt-0.5 text-xs text-muted font-mono">Đơn: #{tx.orderId}</p>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-xs text-muted">
                        {dateStr}
                      </td>
                      <td className="px-3 py-4">
                        {isFailed ? (
                          <span className="text-xs font-bold text-red-400">● Thất bại</span>
                        ) : (
                          <span className="text-xs font-bold text-emerald-400">● Thành công</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-right font-mono text-base font-bold">
                        <span
                          className={
                            isFailed
                              ? 'text-red-400 line-through'
                              : isPlus
                              ? 'text-emerald-400'
                              : 'text-white'
                          }
                        >
                          {isPlus ? '+' : '-'}{formatVnd(Math.abs(tx.amount))}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
