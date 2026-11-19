import { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatVnd } from '../utils/format';

const initialOrder = {
  id: 'ORD-2026-6410',
  date: '19/11/2026',
  status: 'Đã thanh toán',
  total: 590000,
  items: [
    { title: 'R.E.P.O.', price: 140000, key: 'LIC-01-QKW0-8345' },
    { title: 'Cyber Odyssey 2088', price: 450000, key: 'LIC-02-ZDL0-7946' },
  ],
};

function ModalFrame({ title, onClose, children, wide = false }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/75 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section role="dialog" aria-modal="true" aria-labelledby="modal-title" className={`my-auto w-full ${wide ? 'max-w-[680px]' : 'max-w-[560px]'} rounded-2xl border border-indigo-950 bg-zinc-950 p-6 shadow-2xl`}>
        <div className="flex items-start justify-between gap-4">
          <h2 id="modal-title" className="m-0 text-lg font-bold text-white">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Đóng" className="rounded px-2 text-zinc-400 hover:text-white">✕</button>
        </div>
        <div className="my-4 h-px bg-gray-900" />
        {children}
      </section>
    </div>
  );
}

function RefundDialog({ order, onClose, onConfirm }) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const submit = (event) => {
    event.preventDefault();
    if (!reason.trim()) {
      setError('Vui lòng nhập lý do chi tiết.');
      return;
    }
    onConfirm(reason.trim());
  };

  return (
    <ModalFrame title={`Yêu cầu hoàn tiền đơn hàng #${order.id}`} onClose={onClose}>
      <form onSubmit={submit}>
        <p className="mb-5 text-sm leading-6 text-zinc-400">
          Khoản hoàn tiền {formatVnd(order.total)} sẽ được gửi vào Ví sau khi yêu cầu được xem xét.
        </p>
        <label htmlFor="refund-reason" className="text-sm font-bold text-white">Nhập lý do chi tiết:</label>
        <textarea
          id="refund-reason"
          autoFocus
          value={reason}
          onChange={(event) => {
            setReason(event.target.value);
            if (error) setError('');
          }}
          placeholder="Nhập lý do cụ thể..."
          rows="4"
          className="mt-2 w-full resize-y rounded-[10px] border border-indigo-950 bg-zinc-950 px-4 py-3 text-sm text-white outline-none focus:border-accent"
        />
        {error ? <p role="alert" className="mt-2 text-sm text-red-400">{error}</p> : null}
        <div className="mt-5 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-gray-300 hover:bg-white/5">Hủy bỏ</button>
          <button type="submit" className="rounded-xl bg-indigo-500 px-5 py-3 text-sm font-bold text-white">Xác nhận hoàn tiền về Ví</button>
        </div>
      </form>
    </ModalFrame>
  );
}

function InvoiceDialog({ order, onClose }) {
  return (
    <ModalFrame title="Hóa đơn Thanh toán Điện tử" onClose={onClose} wide>
      <p className="m-0 font-bold text-accent-light">#{order.id}</p>
      <ul className="m-0 mt-5 list-none space-y-3 p-0">
        {order.items.map((item) => (
          <li key={item.key} className="rounded-xl border border-indigo-950 p-4">
            <div className="flex flex-wrap justify-between gap-2">
              <span className="font-bold">{item.title}</span>
              <span className="font-bold text-accent-light">{formatVnd(item.price)}</span>
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-indigo-950 bg-card px-3 py-2 text-xs">
              <span className="text-zinc-400">AccessToken:</span>
              <code className="font-mono font-bold text-green-500">{item.key}</code>
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex flex-wrap justify-between gap-3 rounded-xl border border-indigo-950 p-4">
        <span className="text-gray-300">Tổng thanh toán đã trừ Ví:</span>
        <strong className="text-xl text-green-500">{formatVnd(order.total)}</strong>
      </div>
      <div className="mt-5 flex justify-end">
        <button type="button" onClick={onClose} className="rounded-xl bg-indigo-500 px-5 py-3 text-sm font-bold">Xem trong Lịch sử đơn hàng</button>
      </div>
    </ModalFrame>
  );
}

export default function Orders() {
  const [order, setOrder] = useState(initialOrder);
  const [modal, setModal] = useState('');
  const [notice, setNotice] = useState('');
  const statusTone = order.status === 'Đã thanh toán'
    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
    : 'border-amber-500/30 bg-amber-500/10 text-amber-400';

  const requestRefund = (reason) => {
    setOrder((current) => ({ ...current, status: 'Đang chờ xét duyệt hoàn tiền', refundReason: reason }));
    setModal('');
    setNotice('Đã gửi yêu cầu hoàn tiền. Số dư Ví chưa thay đổi cho đến khi yêu cầu được duyệt.');
  };

  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 pb-20 pt-10 md:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="m-0 text-2xl font-extrabold">Đơn hàng &amp; hoàn tiền</h1>
          <p className="mb-0 mt-2 text-sm text-muted">Theo dõi giao dịch và xem hóa đơn điện tử.</p>
        </div>
        <Link to="/wallet/transactions" className="text-sm font-bold text-accent-light hover:underline">Lịch sử Ví</Link>
      </div>

      <section className="mt-7 overflow-x-auto rounded-2xl border border-white/10 bg-card p-5">
        <table className="w-full min-w-[700px] border-collapse text-left text-sm">
          <thead className="bg-page text-xs uppercase text-muted">
            <tr>
              <th className="px-3 py-3">Đơn hàng</th>
              <th className="px-3 py-3">Ngày tạo</th>
              <th className="px-3 py-3">Sản phẩm</th>
              <th className="px-3 py-3">Tổng tiền</th>
              <th className="px-3 py-3">Trạng thái</th>
              <th className="px-3 py-3">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-white/5 align-top">
              <td className="px-3 py-4 font-mono font-bold text-accent-light">#{order.id}</td>
              <td className="whitespace-nowrap px-3 py-4 text-muted">{order.date}</td>
              <td className="px-3 py-4">{order.items.map((item) => item.title).join(', ')}</td>
              <td className="whitespace-nowrap px-3 py-4 font-bold">{formatVnd(order.total)}</td>
              <td className="px-3 py-4"><span className={`rounded-full border px-3 py-1 text-xs font-bold ${statusTone}`}>{order.status}</span></td>
              <td className="px-3 py-4">
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => setModal('invoice')} className="rounded-lg border border-line px-3 py-2 text-xs font-bold hover:border-accent">Xem hóa đơn</button>
                  {order.status === 'Đã thanh toán' ? (
                    <button type="button" onClick={() => setModal('refund')} className="rounded-lg border border-rose-500/30 px-3 py-2 text-xs font-bold text-rose-300 hover:bg-rose-500/10">Yêu cầu hoàn tiền</button>
                  ) : null}
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      {notice ? <p role="status" className="mt-4 rounded-lg border border-indigo-500/40 bg-card p-3 text-sm text-accent-light">{notice}</p> : null}
      {modal === 'refund' ? <RefundDialog order={order} onClose={() => setModal('')} onConfirm={requestRefund} /> : null}
      {modal === 'invoice' ? <InvoiceDialog order={order} onClose={() => setModal('')} /> : null}
    </div>
  );
}
