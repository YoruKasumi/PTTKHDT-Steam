import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { orderApi } from '../api/order';
import { useShop } from '../context/ShopContext';
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

function RefundModal({ order, onClose, onSuccess }) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const orderTime = new Date(order.orderDate).getTime();
  const diffHours = (Date.now() - orderTime) / (1000 * 60 * 60);
  const refundWindowHours = Number(order.refundWindowHours) > 0 ? Number(order.refundWindowHours) : 24;
  const isExpired = diffHours > refundWindowHours;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Vui lòng nhập lý do yêu cầu hoàn tiền.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await orderApi.refund(order.orderId, reason.trim());
      onSuccess(res?.data || res);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Yêu cầu hoàn tiền thất bại.';
      setError(msg);
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/75 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !loading) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="refund-title"
        className="my-auto w-full max-w-[620px] rounded-2xl border border-indigo-900 bg-zinc-950 p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id="refund-title" className="m-0 text-lg font-bold text-white">
            Yêu cầu hoàn tiền đơn hàng
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            aria-label="Đóng"
            className="rounded px-2 text-zinc-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        <div className="my-4 h-px bg-white/10" />

        <div className="space-y-3 text-sm">
          <div className="flex justify-between text-muted">
            <span>Mã đơn hàng:</span>
            <span className="font-mono font-bold text-accent-light">#{order.orderId}</span>
          </div>
          <div className="flex justify-between text-muted">
            <span>Ngày mua:</span>
            <span>{new Date(order.orderDate).toLocaleString('vi-VN')}</span>
          </div>
          <div className="flex justify-between text-muted">
            <span>Số tiền hoàn trả:</span>
            <span className="font-mono font-bold text-emerald-400">{formatVnd(order.totalAmount)}</span>
          </div>
          <div className="rounded-lg bg-white/5 p-3 text-xs text-zinc-300">
            <strong>Trò chơi liên quan:</strong> {order.items.map((i) => i.title).join(', ')}
            <p className="mb-0 mt-1 text-muted">
              * Lưu ý: Bản quyền (LICENSE) và quyền khởi chạy trên các thiết bị đã liên kết sẽ bị thu hồi ngay sau khi hoàn tiền.
            </p>
          </div>
        </div>

        {/* Cảnh báo chính sách 24h */}
        <div className="mt-4">
          {isExpired ? (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-300">
              <strong className="block text-sm font-bold text-red-400">⚠️ CẢNH BÁO QUÁ HẠN {refundWindowHours} GIỜ</strong>
              Đơn hàng này đã mua cách đây <strong>{diffHours.toFixed(1)} giờ</strong> (vượt quá chính sách hoàn tiền {refundWindowHours} giờ). Hệ thống sẽ tự động <strong>TỪ CHỐI</strong> yêu cầu hoàn tiền này và lưu hồ sơ vi phạm thời hạn.
            </div>
          ) : (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-300">
              <strong className="block text-sm font-bold text-emerald-400">✓ ĐỦ ĐIỀU KIỆN HOÀN TIỀN {refundWindowHours} GIỜ</strong>
              Thời gian còn lại trong khung hoàn tiền hợp lệ: <strong>{(refundWindowHours - diffHours).toFixed(1)} giờ</strong>. Số tiền {formatVnd(order.totalAmount)} sẽ được cộng trực tiếp vào ví của bạn ngay sau khi hoàn tất.
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label htmlFor="refund-reason" className="block text-xs font-bold uppercase text-muted">
              Lý do yêu cầu hoàn tiền <span className="text-red-400">*</span>
            </label>
            <textarea
              id="refund-reason"
              rows="3"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="VD: Game không tương thích cấu hình máy, thao tác mua nhầm, phát sinh lỗi kỹ thuật..."
              className="mt-1.5 w-full rounded-lg border border-line bg-page px-3 py-2.5 text-sm text-white outline-none focus:border-accent"
            />
          </div>

          {error ? (
            <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
              {error}
            </p>
          ) : null}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-lg border border-line bg-page px-4 py-2.5 text-sm font-bold"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`rounded-lg px-5 py-2.5 text-sm font-bold text-white ${
                isExpired
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-accent hover:bg-accent/80'
              } disabled:cursor-not-allowed disabled:opacity-50`}
            >
              {loading ? 'Đang xử lý…' : isExpired ? 'Gửi yêu cầu (dự kiến bị từ chối)' : 'Xác nhận hoàn tiền'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default function Orders() {
  const { refreshShop } = useShop();
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [refundOrder, setRefundOrder] = useState(null);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchOrders = () => {
    setLoading(true);
    orderApi
      .list()
      .then((result) => {
        setOrders(result || []);
      })
      .catch((requestError) => {
        setError(requestError.message);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleRefundSuccess = async (result) => {
    setRefundOrder(null);
    setNotice(result?.message || 'Hoàn tiền thành công! Số dư đã được hoàn lại vào ví điện tử.');
    fetchOrders();
    try {
      await refreshShop();
    } catch (_) {
      // ignore
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 pb-20 pt-10 md:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="m-0 text-2xl font-extrabold">Đơn hàng &amp; hoàn tiền</h1>
          <p className="mb-0 mt-2 text-sm text-muted">Theo dõi đơn hàng, xem hóa đơn và yêu cầu hoàn tiền trong 24 giờ.</p>
        </div>
        <Link to="/wallet/transactions" className="text-sm font-bold text-accent-light hover:underline">Lịch sử Ví</Link>
      </div>

      {notice ? (
        <p role="status" className="mt-5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-sm text-emerald-300">
          ✓ {notice}
        </p>
      ) : null}

      {error ? <p role="alert" className="mt-5 text-sm text-red-400">{error}</p> : null}

      <section className="mt-7 overflow-x-auto rounded-2xl border border-white/10 bg-card p-5">
        <table className="w-full min-w-[760px] border-collapse text-left text-sm">
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
                  <td className="whitespace-nowrap px-3 py-4 text-muted">{new Date(order.orderDate).toLocaleString('vi-VN')}</td>
                  <td className="px-3 py-4">{order.items.map((item) => item.title).join(', ')}</td>
                  <td className="whitespace-nowrap px-3 py-4 font-bold">{formatVnd(order.totalAmount)}</td>
                  <td className="px-3 py-4">
                    <span className={`rounded-full border px-3 py-1 text-xs font-bold ${statusTone}`}>
                      {refunded ? 'Đã hoàn tiền' : 'Đã thanh toán'}
                    </span>
                  </td>
                  <td className="px-3 py-4">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedOrder(order)}
                        className="rounded-lg border border-line px-3 py-1.5 text-xs font-bold hover:border-accent"
                      >
                        Hóa đơn
                      </button>
                      {!refunded ? (
                        <button
                          type="button"
                          onClick={() => setRefundOrder(order)}
                          className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-1.5 text-xs font-bold text-rose-300 hover:bg-rose-500/20"
                        >
                          Hoàn tiền
                        </button>
                      ) : null}
                    </div>
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
      {refundOrder ? (
        <RefundModal
          order={refundOrder}
          onClose={() => setRefundOrder(null)}
          onSuccess={handleRefundSuccess}
        />
      ) : null}
    </div>
  );
}
