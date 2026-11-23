import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import CartItem from '../../components/cart/CartItem';
import { CartIcon, TicketIcon, WalletIcon, LockIcon } from '../../components/common/Icons';
import { orderApi } from '../../api/order';
import { useShop } from '../../context/ShopContext';
import { formatVnd } from '../../utils/format';

const card = 'rounded-2xl border border-accent/25 bg-card';

export default function Cart() {
  const { cart, balance, removeFromCart, checkout, refreshShop } = useShop();
  const [preview, setPreview] = useState(null);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState('');
  const [couponMsg, setCouponMsg] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [receipt, setReceipt] = useState(null);

  useEffect(() => {
    let active = true;
    orderApi.kiemTraMaGiamGia().then((result) => {
      if (active) setPreview(result);
    }).catch((requestError) => {
      if (active) setError(requestError.message);
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, []);

  const items = preview?.items || [];
  const currentSubtotal = Number(preview?.subtotal || 0);
  const baseSubtotal = items.reduce((sum, item) => sum + Number(item.basePrice), 0);
  const saleDiscount = Math.max(0, baseSubtotal - currentSubtotal);
  const couponDiscount = Number(preview?.couponDiscount || 0);
  const total = Number(preview?.totalAmount || 0);
  const currentBalance = preview ? Number(preview.balance) : balance;

  const applyCoupon = async () => {
    const code = couponCode.trim().toUpperCase();
    if (!code) {
      setCouponMsg('Vui lòng nhập mã ưu đãi.');
      setAppliedCoupon('');
      return;
    }
    setError('');
    try {
      const result = await orderApi.kiemTraMaGiamGia(code);
      setPreview(result);
      setAppliedCoupon(result.couponCode || '');
      setCouponMsg(`Đã áp dụng ${result.couponCode}: giảm ${formatVnd(result.couponDiscount)}.`);
    } catch (requestError) {
      setAppliedCoupon('');
      setCouponMsg('');
      try {
        setPreview(await orderApi.kiemTraMaGiamGia());
        setError(requestError.message);
      } catch (previewError) {
        setError(previewError.message);
      }
    }
  };

  const removeItem = async (gameId) => {
    setError('');
    try {
      await removeFromCart(gameId);
      setPreview(await orderApi.kiemTraMaGiamGia(appliedCoupon));
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const pay = async () => {
    setError('');
    setSubmitting(true);
    try {
      const result = await checkout(appliedCoupon);
      setReceipt(result);
      setPreview({
        items: [],
        subtotal: 0,
        couponDiscount: 0,
        totalAmount: 0,
        balance: result.balance,
      });
      setAppliedCoupon('');
      setCouponMsg('');
      await refreshShop();
    } catch (requestError) {
      setError(requestError.message);
      if (requestError.code === 'ERR_INSUFFICIENT_BALANCE') {
        setPreview((current) => current && ({
          ...current,
          canCheckout: false,
          shortage: Number(requestError.details?.shortage || 0),
        }));
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (receipt) {
    return (
      <div className="mx-auto w-full max-w-[1698px] px-4 pb-24 pt-16 md:px-[97px]">
        <section className={`${card} p-8 text-center`}>
          <h1 className="m-0 font-display text-2xl font-bold text-mint">✓ Thanh toán thành công</h1>
          <p className="mt-3 text-sm text-muted">Đơn hàng #{receipt.orderId}</p>
          <ul className="m-0 mx-auto mt-6 max-w-md list-none space-y-2 p-0 text-left">
            {receipt.items.map((item) => (
              <li key={item.gameId} className="flex justify-between border-b border-white/10 pb-2 text-sm">
                <span>{item.title}</span>
                <span className="font-mono">{formatVnd(item.priceAfterDiscount)}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 font-mono text-lg font-bold text-accent">Tổng thanh toán: {formatVnd(receipt.totalAmount)}</p>
          <p className="text-xs text-muted">Game đã được thêm vào thư viện của bạn.</p>
          <div className="mt-6 flex justify-center gap-4">
            <Link to="/library" className="rounded-xl bg-accent px-6 py-3 font-bold">Vào thư viện</Link>
            <Link to="/orders" className="rounded-xl border border-accent/40 px-6 py-3 font-bold text-accent">Xem đơn hàng</Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-[1698px] flex-col gap-[79px] px-4 pb-24 pt-[60px] md:px-[97px]">
      <section className={`${card} min-h-[300px] p-5`}>
        <div className="flex items-center justify-between">
          <h1 className="m-0 flex items-center gap-3 font-display text-lg font-bold">
            <CartIcon className="text-accent" /> Giỏ hàng của bạn ({items.length})
          </h1>
          <Link to="/search/results" className="text-xs text-accent">+ Tiếp tục chọn game</Link>
        </div>
        {loading ? <p role="status" className="mt-8 text-center text-muted">Đang tải giỏ hàng…</p> : null}
        {!loading && items.length ? (
          <ul className="m-0 mt-5 flex list-none flex-col gap-[38px] p-0">
            {items.map((item) => (
              <CartItem
                key={item.gameId}
                game={{
                  id: item.gameId,
                  title: item.title,
                  genres: item.genres,
                  thumb: item.coverImage,
                  poster: '#171329',
                  price: item.unitPrice,
                  oldPrice: item.basePrice > item.unitPrice ? item.basePrice : null,
                  discount: item.percentOff,
                }}
                onRemove={removeItem}
              />
            ))}
          </ul>
        ) : null}
        {!loading && !items.length ? (
          <p className="mt-16 text-center text-muted">Giỏ hàng của bạn đang trống. <Link to="/search/results" className="text-accent">Khám phá game</Link></p>
        ) : null}
      </section>

      <section className={`${card} p-5`}>
        <h2 className="m-0 flex items-center gap-3 font-display text-xl font-bold">
          <TicketIcon className="text-accent" /> Mã giảm giá &amp; Tóm tắt đơn hàng
        </h2>
        <div className="mt-8 rounded-2xl border border-accent bg-[#0b0b0c] p-3">
          <div className="flex flex-wrap items-center gap-3 sm:flex-nowrap sm:gap-5">
            <label htmlFor="coupon" className="text-xl text-accent">Mã ưu đãi:</label>
            <input
              id="coupon"
              value={couponCode}
              onChange={(event) => setCouponCode(event.target.value)}
              onKeyDown={(event) => event.key === 'Enter' && applyCoupon()}
              placeholder="Nhập mã giảm giá"
              className="h-[34px] min-w-0 flex-1 rounded-xl border border-white/10 bg-field px-3.5 font-mono text-xs uppercase text-white outline-none placeholder:text-[#9ca3af] focus:border-accent"
            />
            <button type="button" onClick={applyCoupon} className="h-[42px] w-full rounded-xl border border-accent/40 bg-accent/20 px-6 font-bold text-accent sm:w-[190px]">Áp dụng</button>
          </div>
          {couponMsg ? <p role="status" className="m-0 mt-3 text-sm text-accent-light">{couponMsg}</p> : null}
        </div>

        <div className="mt-[55px] grid gap-8 lg:grid-cols-2 lg:gap-16">
          <dl className="m-0 rounded-xl border border-accent bg-[#0b0b0c] p-[11px] text-base text-muted">
            <Row label="Tạm tính giá gốc:" value={formatVnd(baseSubtotal)} valueClass="text-white" />
            <Row label="Giảm giá khuyến mãi (Sale):" value={`-${formatVnd(saleDiscount)}`} valueClass="text-mint" />
            <Row label="Giảm giá Coupon:" value={`-${formatVnd(couponDiscount)}`} valueClass="text-accent" />
            <div className="mt-2 flex items-center justify-between border-t border-accent-light pt-3">
              <dt className="text-lg font-bold text-white">Tổng thanh toán:</dt>
              <dd className="m-0 font-mono text-[27px] font-extrabold text-accent">{formatVnd(total)}</dd>
            </div>
          </dl>

          <div>
            <div className="flex items-center gap-4 rounded-xl border border-accent bg-[#0b0b0c] px-3 py-5">
              <WalletIcon className="text-[32px] text-accent" />
              <p className="m-0 flex-1 text-xl font-bold">Thanh toán bằng ví điện tử</p>
              <p className="m-0 font-mono text-2xl font-bold text-mint">{formatVnd(currentBalance)}</p>
            </div>
            {error ? <p role="alert" className="m-0 mt-3 text-sm text-red-400">{error}</p> : null}
            {preview?.canCheckout === false ? (
              <p className="mt-3 text-sm text-red-300">
                Còn thiếu {formatVnd(preview.shortage)}. <Link to="/wallet" className="font-bold underline">Nạp tiền ngay</Link>
              </p>
            ) : null}
            <button
              type="button"
              onClick={pay}
              disabled={!items.length || loading || submitting || preview?.canCheckout === false}
              className="mt-8 flex h-[62px] w-full items-center justify-center gap-3 rounded-xl border-0 bg-accent text-[17px] font-bold text-white shadow-[0_0_11px_rgba(112,83,225,0.38)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <LockIcon /> {submitting ? 'Đang xử lý…' : 'Thanh toán ngay bằng Ví điện tử'}
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
