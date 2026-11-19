import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { formatVnd } from '../../utils/format';

const transactions = [
  { id: 'TX-6410', title: 'Hoàn tiền đơn hàng ORD-2026-6410', date: '2026-12-03', amount: 140000 },
  { id: 'TX-6409', title: 'Nạp tiền vào ví qua VietQR', date: '2026-11-19', amount: 200000 },
  { id: 'TX-6408', title: 'Mua game: Cyber Odyssey 2088', date: '2026-11-17', amount: -450000 },
  { id: 'TX-6407', title: 'Nạp tiền vào ví qua MoMo', date: '2026-11-10', amount: 500000 },
  { id: 'TX-6406', title: 'Mua game: R.E.P.O.', date: '2026-10-28', amount: -140000 },
];

const keyForDate = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

function DateRangeCalendar({ value, onChange, onClose }) {
  const [month, setMonth] = useState(new Date(2026, 10, 1));
  const offset = month.getDay();
  const days = Array.from({ length: 42 }, (_, index) => {
    const date = new Date(month.getFullYear(), month.getMonth(), index - offset + 1);
    return { date, key: keyForDate(date), inMonth: date.getMonth() === month.getMonth() };
  });
  const monthLabel = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(month);

  const chooseDate = (key) => {
    if (key === value.from || key === value.to) return;
    if (!value.from || value.to || key < value.from) {
      onChange({ from: key, to: '' });
      return;
    }
    onChange({ from: value.from, to: key });
  };

  const today = keyForDate(new Date());
  return (
    <div className="absolute right-0 top-full z-30 mt-2 w-[272px] rounded-md border border-zinc-300 bg-white p-3 text-zinc-900 shadow-2xl">
      <div className="flex items-center justify-between">
        <strong className="text-sm">{monthLabel}</strong>
        <div className="flex gap-1">
          <button type="button" aria-label="Tháng trước" onClick={() => setMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))} className="size-7 rounded hover:bg-zinc-100">‹</button>
          <button type="button" aria-label="Tháng sau" onClick={() => setMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))} className="size-7 rounded hover:bg-zinc-100">›</button>
        </div>
      </div>
      <div className="mt-2 grid grid-cols-7 text-center text-xs">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => <span key={day} className="py-2 font-semibold">{day}</span>)}
        {days.map(({ date, key, inMonth }) => {
          const selected = key === value.from || key === value.to;
          const inRange = value.from && value.to && key > value.from && key < value.to;
          return (
            <button
              key={key}
              type="button"
              onClick={() => chooseDate(key)}
              aria-label={date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              aria-pressed={selected}
              className={`mx-auto my-0.5 flex size-8 items-center justify-center rounded-full text-xs ${
                selected ? 'bg-blue-600 font-bold text-white'
                  : inRange ? 'bg-blue-200 text-zinc-800'
                    : inMonth ? 'text-zinc-900 hover:bg-zinc-100' : 'text-neutral-400 hover:bg-zinc-100'
              }`}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
      <div className="mt-1 flex justify-between border-t border-zinc-200 pt-2 text-xs font-medium text-sky-700">
        <button type="button" onClick={() => { onChange({ from: '', to: '' }); onClose(); }} className="px-2 py-1 hover:underline">Clear</button>
        <button type="button" onClick={() => { onChange({ from: today, to: today }); onClose(); }} className="px-2 py-1 hover:underline">Today</button>
      </div>
    </div>
  );
}

export default function WalletTransactions() {
  const [range, setRange] = useState({ from: '2026-11-17', to: '2026-12-03' });
  const [calendarOpen, setCalendarOpen] = useState(false);
  const visibleTransactions = useMemo(() => transactions.filter((item) => (
    (!range.from || item.date >= range.from) && (!range.to || item.date <= range.to)
  )), [range]);

  const rangeLabel = range.from
    ? `${range.from.split('-').reverse().join('/')} – ${range.to ? range.to.split('-').reverse().join('/') : 'Chọn ngày kết thúc'}`
    : 'Chọn khoảng ngày';

  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 pb-20 pt-10 md:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="m-0 text-2xl font-extrabold">Biến động Ví</h1>
          <p className="mb-0 mt-2 text-sm text-muted">Lọc và xem các khoản nạp, thanh toán và hoàn tiền.</p>
        </div>
        <Link to="/wallet" className="text-sm font-bold text-accent-light hover:underline">← Quay lại Ví</Link>
      </div>

      <section className="mt-7 rounded-2xl border border-white/10 bg-card p-5 md:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="m-0 text-lg font-bold">Lịch sử giao dịch</h2>
          <div className="relative">
            <button
              type="button"
              aria-expanded={calendarOpen}
              onClick={() => setCalendarOpen((open) => !open)}
              className="flex min-w-56 items-center justify-between gap-4 rounded-lg border border-line bg-page px-3 py-2.5 text-sm"
            >
              {rangeLabel}<span aria-hidden="true">▾</span>
            </button>
            {calendarOpen ? <DateRangeCalendar value={range} onChange={setRange} onClose={() => setCalendarOpen(false)} /> : null}
          </div>
        </div>

        <ul className="m-0 mt-5 list-none space-y-3 p-0">
          {visibleTransactions.map((transaction) => (
            <li key={transaction.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-page p-4">
              <div>
                <p className="m-0 font-semibold">{transaction.title}</p>
                <p className="m-0 mt-1 text-xs text-muted">{transaction.date.split('-').reverse().join('/')} · {transaction.id}</p>
              </div>
              <span className={`font-bold ${transaction.amount > 0 ? 'text-emerald-400' : 'text-white'}`}>
                {transaction.amount > 0 ? '+' : ''}{formatVnd(transaction.amount)}
              </span>
            </li>
          ))}
          {!visibleTransactions.length ? <li className="py-10 text-center text-sm text-muted">Không có giao dịch trong khoảng thời gian này.</li> : null}
        </ul>
      </section>
    </div>
  );
}
