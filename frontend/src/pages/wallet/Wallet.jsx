import { useState } from 'react';
import { formatVnd } from '../../utils/format';

const initialTransactions = [
  { title: 'Nạp tiền vào ví qua VietQR', date: 'Hôm nay, 14:20', amount: 200000 },
  { title: 'Mua game: Counter-Strike 2 Prime', date: '21/10/2026', amount: -350000 },
  { title: 'Nạp tiền vào ví qua MoMo', date: '15/10/2026', amount: 500000 },
];

export default function Wallet() {
  const [balance] = useState(650000);
  const [amount, setAmount] = useState(200000);
  const [voucher, setVoucher] = useState('');
  const [message, setMessage] = useState('');
  const [transactions] = useState(initialTransactions);

  const requestTopUp = () => {
    setMessage(`Đã tạo yêu cầu nạp ${formatVnd(amount)}. Hoàn tất thanh toán qua cổng được chọn để cập nhật số dư.`);
  };

  const applyVoucher = (event) => {
    event.preventDefault();
    setMessage(
      voucher.trim()
        ? 'Mã quà tặng sẽ được xác minh khi kết nối dịch vụ ví.'
        : 'Vui lòng nhập mã quà tặng.',
    );
  };

  const exportStatement = () => {
    const csv = ['Giao dịch,Ngày,Số tiền', ...transactions.map((item) => `${item.title},${item.date},${item.amount}`)].join('\n');
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'lich-su-giao-dich.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-6 px-4 pb-20 pt-10 md:px-8">
      <h1 className="m-0 text-2xl font-extrabold">Ví điện tử</h1>
      <section className="rounded-2xl border border-indigo-500/40 bg-gradient-to-r from-gray-950 via-violet-950 to-violet-900 p-6 md:p-9">
        <div className="flex flex-wrap items-center justify-between gap-6 border-b border-violet-400/50 pb-5">
          <div>
            <p className="m-0 text-sm text-indigo-200">Chủ tài khoản</p>
            <p className="mb-0 mt-1 font-bold">SHERRY</p>
          </div>
          <div>
            <p className="m-0 text-sm text-indigo-200">Thẻ thành viên</p>
            <p className="mb-0 mt-1 font-bold">•••• 8824</p>
          </div>
        </div>
        <div className="pt-6">
          <p className="m-0 text-sm font-bold tracking-wide text-zinc-300">SỐ DƯ KHẢ DỤNG</p>
          <p className="mb-0 mt-2 text-4xl font-black">{formatVnd(balance)}</p>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-card p-5 md:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="m-0 text-xl font-bold">Nạp tiền nhanh vào ví</h2>
            <p className="mb-0 mt-1 text-sm text-muted">Chiết khấu 0% phí nạp</p>
          </div>
          <span className="text-sm font-semibold text-emerald-400">VietQR · MoMo · Visa</span>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          {[50000, 100000, 200000, 500000].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setAmount(value)}
              aria-pressed={amount === value}
              className={`rounded-lg border px-4 py-3 font-bold ${
                amount === value ? 'border-accent bg-accent/20 text-accent-light' : 'border-line bg-page text-white'
              }`}
            >
              +{formatVnd(value)}
            </button>
          ))}
        </div>
        <button type="button" onClick={requestTopUp} className="mt-4 rounded-lg bg-accent px-5 py-3 font-bold">
          Tạo yêu cầu nạp tiền
        </button>

        <form onSubmit={applyVoucher} className="mt-8 border-t border-white/10 pt-6">
          <label htmlFor="voucher" className="text-sm font-bold">
            Kích hoạt mã quà tặng <span className="font-normal text-muted">(Giftcode / Voucher)</span>
          </label>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row">
            <input
              id="voucher"
              value={voucher}
              onChange={(event) => setVoucher(event.target.value)}
              placeholder="Nhập mã"
              className="min-w-0 flex-1 rounded-lg border border-line bg-page px-4 py-3 text-white outline-none focus:border-accent"
            />
            <button type="submit" className="rounded-lg bg-accent px-6 py-3 font-bold">
              Áp dụng
            </button>
          </div>
        </form>
        {message ? <p role="status" className="mb-0 mt-4 text-sm text-accent-light">{message}</p> : null}
      </section>

      <section className="rounded-2xl border border-white/10 bg-card p-5 md:p-7">
        <div className="flex items-center justify-between gap-3">
          <h2 className="m-0 text-xl font-bold">Lịch sử giao dịch gần đây</h2>
          <button type="button" onClick={exportStatement} className="text-sm font-bold text-accent-light hover:underline">
            Xuất sao kê
          </button>
        </div>
        <ul className="m-0 mt-5 list-none space-y-3 p-0">
          {transactions.map((transaction) => (
            <li key={`${transaction.title}-${transaction.date}`} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-page p-4">
              <div>
                <p className="m-0 font-semibold">{transaction.title}</p>
                <p className="m-0 mt-1 text-xs text-muted">{transaction.date}</p>
              </div>
              <span className={`font-bold ${transaction.amount > 0 ? 'text-emerald-400' : 'text-white'}`}>
                {transaction.amount > 0 ? '+' : ''}{formatVnd(transaction.amount)}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
