import { useCallback, useEffect, useState } from 'react';
import AdminShell from '../../components/admin/AdminShell';
import { adminApi } from '../../api/admin';
import { formatVnd } from '../../utils/format';

function defaultExpiry() {
  const date = new Date();
  date.setDate(date.getDate() + 30);
  date.setHours(23, 59, 0, 0);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [form, setForm] = useState({ code: '', discountValue: '20000', expiryDate: defaultExpiry(), usageLimit: '100' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setCoupons(await adminApi.listCoupons());
    } catch (requestError) {
      setError(requestError.message || 'Không thể tải danh sách mã giảm giá.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const create = async (event) => {
    event.preventDefault();
    setError('');
    setNotice('');
    setLoading(true);
    try {
      const coupon = await adminApi.createCoupon({ ...form, code: form.code.trim().toUpperCase() });
      setNotice(`Đã tạo mã ${coupon.code}.`);
      setForm({ code: '', discountValue: '20000', expiryDate: defaultExpiry(), usageLimit: '100' });
      await load();
    } catch (requestError) {
      setError(requestError.message || 'Không thể tạo mã giảm giá.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminShell title="Mã giảm giá" description="Tạo mã giảm giá dùng chung cho khách hàng và theo dõi lượt sử dụng.">
      {error ? <p role="alert" className="rounded-lg border border-red-500/30 p-3 text-sm text-red-300">{error}</p> : null}
      {notice ? <p role="status" className="rounded-lg border border-emerald-500/30 p-3 text-sm text-emerald-300">{notice}</p> : null}
      <form onSubmit={create} className="grid gap-4 rounded-2xl border border-white/10 bg-card p-5 md:grid-cols-2 xl:grid-cols-4">
        <label className="text-sm font-semibold">Mã giảm giá
          <input required minLength="3" maxLength="30" pattern="[A-Za-z0-9_-]+" value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value.toUpperCase() })} placeholder="VORTEX20" className="mt-2 w-full rounded-lg border border-line bg-page px-3 py-2.5 font-mono uppercase" />
        </label>
        <label className="text-sm font-semibold">Mức giảm (₫)
          <input required type="number" min="1" max="5000000" step="1000" value={form.discountValue} onChange={(event) => setForm({ ...form, discountValue: event.target.value })} className="mt-2 w-full rounded-lg border border-line bg-page px-3 py-2.5" />
        </label>
        <label className="text-sm font-semibold">Hạn sử dụng
          <input required type="datetime-local" value={form.expiryDate} onChange={(event) => setForm({ ...form, expiryDate: event.target.value })} className="mt-2 w-full rounded-lg border border-line bg-page px-3 py-2.5" />
        </label>
        <label className="text-sm font-semibold">Lượt sử dụng tối đa
          <input required type="number" min="1" max="1000000" step="1" value={form.usageLimit} onChange={(event) => setForm({ ...form, usageLimit: event.target.value })} className="mt-2 w-full rounded-lg border border-line bg-page px-3 py-2.5" />
        </label>
        <div className="md:col-span-2 xl:col-span-4"><button disabled={loading} className="rounded-lg bg-accent px-5 py-2.5 font-bold disabled:opacity-50">{loading ? 'Đang lưu…' : 'Tạo mã giảm giá'}</button></div>
      </form>
      <section className="overflow-x-auto rounded-2xl border border-white/10 bg-card p-5">
        <h2 className="mt-0 text-lg font-bold">Danh sách mã</h2>
        {loading && !coupons.length ? <p role="status" className="text-sm text-muted">Đang tải…</p> : null}
        <table className="w-full min-w-[680px] text-left text-sm">
          <thead className="text-xs uppercase text-muted"><tr><th className="p-3">Mã</th><th className="p-3">Mức giảm</th><th className="p-3">Đã dùng</th><th className="p-3">Hạn dùng</th><th className="p-3">Trạng thái</th></tr></thead>
          <tbody>{coupons.map((coupon) => {
            const expired = new Date(coupon.expiryDate).getTime() <= Date.now();
            const exhausted = coupon.usedCount >= coupon.usageLimit;
            return <tr key={coupon.couponId} className="border-t border-white/5"><td className="p-3 font-mono font-bold text-accent-light">{coupon.code}</td><td className="p-3">{formatVnd(coupon.discountValue)}</td><td className="p-3">{coupon.usedCount} / {coupon.usageLimit}</td><td className="p-3">{new Date(coupon.expiryDate).toLocaleString('vi-VN')}</td><td className="p-3">{expired ? 'Hết hạn' : exhausted ? 'Hết lượt' : 'Đang hiệu lực'}</td></tr>;
          })}</tbody>
        </table>
        {!coupons.length && !loading ? <p className="text-sm text-muted">Chưa có mã giảm giá.</p> : null}
      </section>
    </AdminShell>
  );
}
