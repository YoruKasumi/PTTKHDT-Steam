import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { orderApi } from '../api/order';
import { formatVnd } from '../utils/format';

function InvoiceDialog({ order, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/75 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section role="dialog" aria-modal="true" aria-labelledby="invoice-title" className="my-auto w-full max-w-[680px] rounded-2xl border border-indigo-950 bg-zinc-950 p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <h2 id="invoice-title" className="m-0 text-lg font-bold text-white">Hóa đơn thanh toán</h2>
          <button type="button" onClick={onClose} aria-label="Đóng" className="rounded px-2 text-zinc-400 hover:text-white">✕</button>
        </div>
        <div className="my-4 h-px bg-gray-900" />
        <p className="m-0 font-bold text-accent-light">#{order.orderId}</p>
        <ul className="m-0 mt-5 list-none space-y-3 p-0">
          {order.items.map((item) => (
            <li key={item.gameId} className="rounded-xl border border-indigo-950 p-4">
              <div className="flex flex-wrap justify-between gap-2">
                <span className="font-bold">{item.title}</span>
                <span className="font-bold text-accent-light">{formatVnd(item.priceAfterDiscount)}</span>
              </div>
              {item.priceAfterDiscount < item.unitPrice ? (
                <p className="mb-0 mt-2 text-xs text-muted">Giá trước giảm: {formatVnd(item.unitPrice)}</p>
              ) : null}
            </li>
          ))}
        </ul>
        <div className="mt-4 flex flex-wrap justify-between gap-3 rounded-xl border border-indigo-950 p-4">
          <span className="text-gray-300">Tổng thanh toán:</span>
          <strong className="text-xl text-green-500">{formatVnd(order.totalAmount)}</strong>
        </div>
        <div className="mt-5 flex justify-end">
          <button type="button" onClick={onClose} className="rounded-xl bg-indigo-500 px-5 py-3 text-sm font-bold">Đóng</button>
        </div>
      </section>
    </div>
  );
}

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    orderApi.list().then((result) => {
      if (active) setOrders(result);
    }).catch((requestError) => {
      if (active) setError(requestError.message);
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, []);

  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 pb-20 pt-10 md:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="m-0 text-2xl font-extrabold">Đơn hàng &amp; hoàn tiền</h1>
          <p className="mb-0 mt-2 text-sm text-muted">Theo dõi đơn hàng và xem hóa đơn điện tử.</p>
        </div>
        <Link to="/wallet/transactions" className="text-sm font-bold text-accent-light hover:underline">Lịch sử Ví</Link>
      </div>

      {error ? <p role="alert" className="mt-5 text-sm text-red-400">{error}</p> : null}
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
            {orders.map((order) => {
              const refunded = order.status === 'Refunded';
              const statusTone = refunded
                ? 'border-amber-500/30 bg-amber-500/10 text-amber-400'
                : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400';
              return (
                <tr key={order.orderId} className="border-b border-white/5 align-top">
                  <td className="px-3 py-4 font-mono font-bold text-accent-light">#{order.orderId}</td>
                  <td className="whitespace-nowrap px-3 py-4 text-muted">{new Date(order.orderDate).toLocaleString()}</td>
                  <td className="px-3 py-4">{order.items.map((item) => item.title).join(', ')}</td>
                  <td className="whitespace-nowrap px-3 py-4 font-bold">{formatVnd(order.totalAmount)}</td>
                  <td className="px-3 py-4">
                    <span className={`rounded-full border px-3 py-1 text-xs font-bold ${statusTone}`}>
                      {refunded ? 'Đã hoàn tiền' : 'Đã thanh toán'}
                    </span>
                  </td>
                  <td className="px-3 py-4">
                    <button type="button" onClick={() => setSelectedOrder(order)} className="rounded-lg border border-line px-3 py-2 text-xs font-bold hover:border-accent">Xem hóa đơn</button>
                  </td>
                </tr>
              );
            })}
            {!loading && !orders.length ? (
              <tr><td colSpan="6" className="px-3 py-12 text-center text-muted">Bạn chưa có đơn hàng nào.</td></tr>
            ) : null}
          </tbody>
        </table>
        {loading ? <p role="status" className="py-6 text-center text-muted">Đang tải đơn hàng…</p> : null}
      </section>

      {selectedOrder ? <InvoiceDialog order={selectedOrder} onClose={() => setSelectedOrder(null)} /> : null}
    </div>
  );
}
