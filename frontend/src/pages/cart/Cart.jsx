import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import CartItem from '../../components/cart/CartItem';
import { CartIcon, TicketIcon, WalletIcon, LockIcon } from '../../components/common/Icons';
import { useShop } from '../../context/ShopContext';
import { findGame } from '../../data/games';
import { lookupCoupon } from '../../data/coupons';
import { formatVnd } from '../../utils/format';

const card = 'rounded-2xl border border-accent/25 bg-card';

/**
 * Màn hình Giỏ hàng & thanh toán ví (Figma: node 94:1576).
 * Sequence UC8 (xem giỏ), UC10 (xóa), UC15 (mã giảm giá → kiểm tra số dư → trừ ví → cấp bản quyền → xóa giỏ → hóa đơn).
 */
export default function Cart() {
  const { cart, balance, removeFromCart, checkout } = useShop();
  const [code, setCode] = useState('');
  const [coupon, setCoupon] = useState(null);
  const [couponMsg, setCouponMsg] = useState({ ok: true, text: '' });
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState(null);

  const items = useMemo(() => cart.map(findGame).filter(Boolean), [cart]);
  const subtotal = items.reduce((s, g) => s + (g.oldPrice ?? g.price), 0);
  const saleDiscount = items.reduce((s, g) => s + (g.oldPrice ? g.oldPrice - g.price : 0), 0);
  const couponDiscount = coupon ? Math.min(coupon.discount, subtotal - saleDiscount) : 0;
  const total = Math.max(0, subtotal - saleDiscount - couponDiscount);

  const applyCoupon = () => {
    if (!code.trim()) return setCouponMsg({ ok: false, text: 'Vui lòng nhập mã ưu đãi' });
    const c = lookupCoupon(code);
    if (!c) { setCoupon(null); return setCouponMsg({ ok: false, text: 'Mã giảm giá không hợp lệ hoặc đã hết hạn' }); }
    setCoupon(c);
    setCouponMsg({ ok: true, text: `Đã áp dụng mã ${c.code}: giảm ${formatVnd(c.discount)}` });
  };

  const pay = () => {
    setError('');
    const r = checkout(total);
    if (r.ok) setReceipt({ games: r.items.map(findGame), total, coupon: coupon?.code });
    else if (r.reason === 'balance') setError('Số dư ví không đủ để thanh toán.');
    else setError('Giỏ hàng đang trống.');
  };

  if (receipt) {
    return (
      <div className="mx-auto w-full max-w-[1698px] px-4 pb-24 pt-16 md:px-[97px]">
        <section className={`${card} p-8 text-center`}>
          <h1 className="m-0 font-display text-2xl font-bold text-mint">✓ Thanh toán thành công</h1>
          <ul className="m-0 mx-auto mt-6 max-w-md list-none space-y-2 p-0 text-left">
            {receipt.games.map((g) => (
              <li key={g.id} className="flex justify-between border-b border-white/10 pb-2 text-sm">
                <span>{g.title}</span><span className="font-mono">{g.price === 0 ? 'Miễn phí' : formatVnd(g.price)}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 font-mono text-lg font-bold text-accent">Tổng thanh toán: {formatVnd(receipt.total)}</p>
          <p className="text-xs text-muted">Game đã được thêm vào thư viện của bạn.</p>
          <div className="mt-6 flex justify-center gap-4">
            <Link to="/library" className="rounded-xl bg-accent px-6 py-3 font-bold">Vào thư viện</Link>
            <Link to="/" className="rounded-xl border border-accent/40 px-6 py-3 font-bold text-accent">Tiếp tục mua sắm</Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-[1698px] flex-col gap-[79px] px-4 pb-24 pt-[60px] md:px-[97px]">
      {/* Danh sách game trong giỏ */}
      <section className={`${card} min-h-[300px] p-5`}>
        <div className="flex items-center justify-between">
          <h1 className="m-0 flex items-center gap-3 font-display text-lg font-bold">
            <CartIcon className="text-accent" /> Giỏ hàng của bạn ({items.length})
          </h1>
          <Link to="/search/results" className="text-xs text-accent">+ Tiếp tục chọn game</Link>
        </div>
        {items.length ? (
          <ul className="m-0 mt-5 flex list-none flex-col gap-[38px] p-0">
            {items.map((g) => <CartItem key={g.id} game={g} onRemove={removeFromCart} />)}
          </ul>
        ) : (
          <p className="mt-16 text-center text-muted">Giỏ hàng của bạn đang trống. <Link to="/search/results" className="text-accent">Khám phá game</Link></p>
        )}
      </section>

      {/* Mã giảm giá & tóm tắt đơn hàng */}
      <section className={`${card} p-5`}>
        <h2 className="m-0 flex items-center gap-3 font-display text-xl font-bold">
          <TicketIcon className="text-accent" /> Mã giảm giá &amp; Tóm tắt đơn hàng
        </h2>

        <div className="mt-8 rounded-2xl border border-accent bg-[#0b0b0c] p-3">
          <div className="flex flex-wrap items-center gap-3 sm:flex-nowrap sm:gap-5">
            <label htmlFor="coupon" className="text-xl text-accent">Mã ưu đãi :</label>
            <input
              id="coupon"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applyCoupon()}
              placeholder="NHẬP STEAM2026 HOẶC VORTEX10"
              className="h-[34px] min-w-0 flex-1 rounded-xl border border-white/10 bg-field px-3.5 font-mono text-xs uppercase text-white outline-none placeholder:text-[#9ca3af] focus:border-accent"
            />
            <button type="button" onClick={applyCoupon} className="h-[42px] w-full rounded-xl border border-accent/40 bg-accent/20 px-6 font-bold text-accent sm:w-[190px]">Áp dụng</button>
          </div>
          <p className={`m-0 mt-3 text-base ${couponMsg.text && !couponMsg.ok ? 'text-red-400' : 'text-muted'}`}>
            {couponMsg.text ? couponMsg.text : <>Voucher mới: dùng <span className="font-mono text-accent">STEAM2026</span> giảm 50.000 ₫</>}
          </p>
        </div>

        <div className="mt-[55px] grid gap-8 lg:grid-cols-2 lg:gap-16">
          <dl className="m-0 rounded-xl border border-accent bg-[#0b0b0c] p-[11px] text-base text-muted">
            <Row label="Tạm tính giá gốc:" value={formatVnd(subtotal)} valueClass="text-white" />
            <Row label="Giảm giá khuyến mãi (Sale):" value={`-${formatVnd(saleDiscount)}`} valueClass="text-mint" />
            <Row label="Giảm giá Coupon:" value={`-${formatVnd(couponDiscount)}`} valueClass="text-accent" />
            <div className="mt-2 flex items-center justify-between border-t border-accent-light pt-3">
              <dt className="text-lg font-bold text-white">Tổng thanh toán (TotalAmount):</dt>
              <dd className="m-0 font-mono text-[27px] font-extrabold text-accent">{formatVnd(total)}</dd>
            </div>
          </dl>

          <div>
            <div className="flex items-center gap-4 rounded-xl border border-accent bg-[#0b0b0c] px-3 py-5">
              <WalletIcon className="text-[32px] text-accent" />
              <p className="m-0 flex-1 text-xl font-bold">Thanh toán bằng ví điện tử</p>
              <p className="m-0 font-mono text-2xl font-bold text-mint">{formatVnd(balance)}</p>
            </div>
            {error ? (
              <p role="alert" className="m-0 mt-3 text-sm text-red-400">
                {error} {error.includes('Số dư') ? <Link to="/wallet" className="font-bold underline">Nạp tiền</Link> : null}
              </p>
            ) : null}
            <button
              type="button"
              onClick={pay}
              disabled={!items.length}
              className="mt-8 flex h-[62px] w-full items-center justify-center gap-3 rounded-xl border-0 bg-accent text-[17px] font-bold text-white shadow-[0_0_11px_rgba(112,83,225,0.38)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <LockIcon /> Thanh toán ngay bằng Ví điện tử
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function Row({ label, value, valueClass }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <dt>{label}</dt>
      <dd className={`m-0 font-mono text-xl ${valueClass}`}>{value}</dd>
    </div>
  );
}
