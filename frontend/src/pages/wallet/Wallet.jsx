import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { walletApi } from '../../api/wallet';
import { useShop } from '../../context/ShopContext';
import { formatVnd } from '../../utils/format';
import FeedbackDialog from '../../components/common/FeedbackDialog';

export default function Wallet() {
  const { user, balance: contextBalance, refreshShop } = useShop();
  const canWithdraw = user?.roles?.some((role) => role === 'Customer' || role === 'Developer');
  const [balance, setBalance] = useState(contextBalance);
  const [depositAmount, setDepositAmount] = useState(200000);
  const [customDeposit, setCustomDeposit] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('VietQR');

  // Rút tiền
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [bankInfo, setBankInfo] = useState('');

  const [activeTab, setActiveTab] = useState('deposit'); // 'deposit' | 'withdraw'
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [loadingTx, setLoadingTx] = useState(true);
  const [dialog, setDialog] = useState(null);

  // Đồng bộ số dư và lịch sử giao dịch
  const loadData = useCallback(async () => {
    try {
      const [walletRes, txRes] = await Promise.all([
        walletApi.yeuCauXemSoDu().catch(() => null),
        walletApi.yeuCauXemLichSuGiaoDich({ limit: 5 }).catch(() => null),
      ]);

      if (walletRes?.data?.balance !== undefined) {
        setBalance(Number(walletRes.data.balance));
      } else if (walletRes?.balance !== undefined) {
        setBalance(Number(walletRes.balance));
      }

      const txList = txRes?.data || txRes || [];
      if (Array.isArray(txList)) {
        setTransactions(txList);
      }
    } finally {
      setLoadingTx(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!canWithdraw) setActiveTab('deposit');
  }, [canWithdraw]);

  // Cập nhật khi context thay đổi
  useEffect(() => {
    if (contextBalance !== undefined) {
      setBalance(contextBalance);
    }
  }, [contextBalance]);

  // Nạp tiền
  const handleDeposit = async ({ simulateFailure = false } = {}) => {
    const amt = customDeposit ? Number(customDeposit) : Number(depositAmount);
    if (!Number.isFinite(amt) || amt < 10000 || amt > 50000000) {
      setError('Số tiền nạp phải từ 10.000 VND đến tối đa 50.000.000 VND.');
      return;
    }

    setSubmitting(true);
    setError('');
    setMessage('');

    try {
      const res = await walletApi.guiYeuCauNapTien({
        amount: amt,
        paymentMethod,
        simulateFailure,
      });
      const data = res?.data || res;
      setMessage(`✓ Nạp tiền thành công! Đã cộng ${formatVnd(amt)} vào ví của bạn.`);
      setCustomDeposit('');
      await loadData();
      try {
        await refreshShop();
      } catch (_) {}
    } catch (err) {
      if (simulateFailure && err.code === 'ERR_PAYMENT_FAILED') {
        setDialog({
          title: 'Thanh toán thất bại (mô phỏng)',
          message: 'Cổng thanh toán đã từ chối giao dịch giả lập. Số dư không thay đổi và giao dịch đã được ghi vào lịch sử với trạng thái Thất bại.',
          tone: 'error',
        });
        await loadData();
      } else {
        setError(err?.response?.data?.message || err?.message || 'Nạp tiền thất bại.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Rút tiền
  const handleWithdraw = async (e) => {
    e.preventDefault();
    const amt = Number(withdrawAmount);
    if (!Number.isFinite(amt) || amt < 10000) {
      setError('Số tiền rút tối thiểu là 10.000 VND.');
      return;
    }
    if (amt > balance) {
      setError(`Số dư không đủ. Bạn chỉ có ${formatVnd(balance)}.`);
      return;
    }
    if (!bankInfo.trim()) {
      setError('Vui lòng nhập thông tin tài khoản ngân hàng thụ hưởng.');
      return;
    }

    setSubmitting(true);
    setError('');
    setMessage('');

    try {
      const res = await walletApi.guiYeuCauRutTien({
        amount: amt,
        bankInfo: bankInfo.trim(),
      });
      setMessage(`✓ Yêu cầu rút ${formatVnd(amt)} thành công! Tiền sẽ được chuyển về tài khoản ngân hàng.`);
      setWithdrawAmount('');
      setBankInfo('');
      await loadData();
      try {
        await refreshShop();
      } catch (_) {}
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Rút tiền thất bại.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-6 px-4 pb-20 pt-10 md:px-8">
      <FeedbackDialog open={Boolean(dialog || message || error)} title={dialog?.title || (error ? 'Đã xảy ra lỗi' : 'Thông báo')} message={dialog?.message || error || message} tone={dialog?.tone || (error ? 'error' : 'success')} onClose={() => { setDialog(null); setMessage(''); setError(''); }} onConfirm={dialog?.onConfirm} confirmLabel={dialog?.confirmLabel} />
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="m-0 text-2xl font-bold">Ví điện tử cá nhân</h1>
          <p className="mb-0 mt-1 text-xs text-muted">Quản lý số dư, nạp tiền và theo dõi các giao dịch đã thực hiện.</p>
        </div>
        <Link to="/wallet/transactions" className="rounded-lg border border-line bg-page px-4 py-2 text-xs font-bold text-accent-light hover:border-accent">
          Tra cứu giao dịch
        </Link>
      </div>

      {/* Thẻ hiển thị số dư ví */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="relative overflow-hidden rounded-2xl border border-indigo-900 bg-gradient-to-br from-indigo-950/60 to-page p-6 shadow-xl">
          <p className="m-0 text-xs font-bold uppercase tracking-wider text-muted">Số dư khả dụng</p>
          <p className="mb-0 mt-3 font-mono text-3xl font-extrabold text-emerald-400">
            {formatVnd(balance)}
          </p>
          <span className="mt-2 inline-block text-[11px] text-muted">● Sẵn sàng thanh toán đơn hàng & rút tiền</span>
        </div>

        <div className="rounded-2xl border border-white/10 bg-card p-6">
          <p className="m-0 text-xs font-bold uppercase tracking-wider text-muted">Trạng thái ví</p>
          <div className="mt-3 flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-sm font-bold text-white">Hoạt động bình thường</span>
          </div>
          <p className="mb-0 mt-2 text-[11px] text-muted">Bảo mật giao dịch mã hóa 2 chiều</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-card p-6 sm:col-span-2 lg:col-span-1">
          <p className="m-0 text-xs font-bold uppercase tracking-wider text-muted">Hạn mức rút tối đa</p>
          <p className="mb-0 mt-3 font-mono text-xl font-bold text-white">{formatVnd(balance)}</p>
          <p className="mb-0 mt-2 text-[11px] text-muted">Tối thiểu: 10.000 ₫ · Tối đa: Số dư hiện tại</p>
        </div>
      </div>

      {/* Tabs hành động: Nạp tiền / Rút tiền */}
      <section className="rounded-2xl border border-white/10 bg-card p-5 md:p-7">
        <div className="flex border-b border-white/10">
          <button
            type="button"
            onClick={() => { setActiveTab('deposit'); setError(''); setMessage(''); }}
            className={`border-b-2 px-6 py-3 text-sm font-bold transition-colors ${
              activeTab === 'deposit'
                ? 'border-accent text-accent-light'
                : 'border-transparent text-muted hover:text-white'
            }`}
          >
            Nạp tiền vào ví
          </button>
          {canWithdraw && (
            <button
              type="button"
              onClick={() => { setActiveTab('withdraw'); setError(''); setMessage(''); }}
              className={`border-b-2 px-6 py-3 text-sm font-bold transition-colors ${
                activeTab === 'withdraw'
                  ? 'border-accent text-accent-light'
                  : 'border-transparent text-muted hover:text-white'
              }`}
            >
              Rút tiền về ngân hàng
            </button>
          )}
        </div>

        {activeTab === 'deposit' ? (
          <div className="mt-6 space-y-6">
            <div>
              <label className="block text-xs font-bold uppercase text-muted">
                Chọn mệnh giá nạp nhanh (VND)
              </label>
              <p className="mb-0 mt-1 text-xs text-muted">Hạn mức nạp: từ 10.000 ₫ đến 50.000.000 ₫</p>
            </div>

            {/* Mệnh giá có sẵn */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
              {[50000, 100000, 200000, 500000, 1000000, 2000000].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => { setDepositAmount(val); setCustomDeposit(''); }}
                  className={`rounded-xl border px-4 py-3 text-sm font-bold transition-all ${
                    depositAmount === val && !customDeposit
                      ? 'border-accent bg-accent/25 text-accent-light shadow-md'
                      : 'border-line bg-page text-white hover:border-white/30'
                  }`}
                >
                  +{formatVnd(val)}
                </button>
              ))}
            </div>

            <div>
              <label htmlFor="custom-deposit" className="block text-xs font-bold uppercase text-muted">
                Hoặc nhập số tiền tùy chọn (VND, tối đa 50.000.000 ₫)
              </label>
              <input
                id="custom-deposit"
                type="number"
                min="10000"
                max="50000000"
                step="1000"
                placeholder="Nhập số tiền khác (VD: 350000)"
                value={customDeposit}
                onChange={(e) => setCustomDeposit(e.target.value)}
                className="mt-1.5 w-full max-w-md rounded-lg border border-line bg-page px-3.5 py-2.5 text-sm text-white outline-none focus:border-accent font-mono"
              />
            </div>

            <div>
              <p className="m-0 text-xs font-bold uppercase text-muted">Phương thức thanh toán</p>
              <div className="mt-2 flex flex-wrap gap-3">
                {['VietQR', 'MoMo', 'Visa / Mastercard'].map((method) => (
                  <label
                    key={method}
                    className={`flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2.5 text-xs font-bold transition-all ${
                      paymentMethod === method
                        ? 'border-accent bg-accent/15 text-accent-light'
                        : 'border-line bg-page text-muted hover:text-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment-method"
                      value={method}
                      checked={paymentMethod === method}
                      onChange={() => setPaymentMethod(method)}
                      className="sr-only"
                    />
                    <span>● {method}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setDialog({ title: 'Xác nhận nạp tiền', message: `Nạp ${formatVnd(customDeposit ? Number(customDeposit) || 0 : depositAmount)} vào ví bằng ${paymentMethod}?`, onConfirm: async () => { setDialog(null); await handleDeposit(); } })}
                disabled={submitting}
                className="rounded-xl bg-accent px-6 py-3 font-bold text-white shadow-lg hover:bg-accent/80 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? 'Đang xử lý nạp tiền…' : `Nạp ngay ${formatVnd(customDeposit ? Number(customDeposit) || 0 : depositAmount)}`}
              </button>
              <button
                type="button"
                onClick={() => setDialog({ title: 'Mô phỏng thanh toán thất bại?', message: `Gửi giao dịch thử ${formatVnd(customDeposit ? Number(customDeposit) || 0 : depositAmount)} bằng ${paymentMethod} đến cổng thanh toán giả lập. Giao dịch sẽ được ghi là Thất bại và không cộng tiền vào ví.`, confirmLabel: 'Mô phỏng thất bại', tone: 'error', onConfirm: async () => { setDialog(null); await handleDeposit({ simulateFailure: true }); } })}
                disabled={submitting}
                className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-6 py-3 font-bold text-rose-200 hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Mô phỏng thanh toán thất bại
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={(event) => { event.preventDefault(); setDialog({ title: 'Xác nhận rút tiền', message: `Gửi yêu cầu rút ${formatVnd(Number(withdrawAmount) || 0)} về tài khoản ngân hàng đã nhập?`, onConfirm: async () => { setDialog(null); await handleWithdraw({ preventDefault() {} }); } }); }} className="mt-6 max-w-lg space-y-4">
            <div>
              <h2 className="m-0 text-lg font-bold">Rút tiền từ ví về tài khoản ngân hàng</h2>
              <p className="mb-0 mt-1 text-xs text-muted">Số dư khả dụng hiện tại: {formatVnd(balance)}</p>
            </div>

            <div>
              <label htmlFor="withdraw-amount" className="block text-xs font-bold uppercase text-muted">
                Số tiền cần rút (VND, tối thiểu 10.000 ₫, tối đa {formatVnd(balance)})
              </label>
              <input
                id="withdraw-amount"
                type="number"
                min="10000"
                max={balance}
                step="1000"
                required
                placeholder="Nhập số tiền muốn rút"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-line bg-page px-3.5 py-2.5 text-sm text-white outline-none focus:border-accent font-mono"
              />
            </div>

            <div>
              <label htmlFor="bank-info" className="block text-xs font-bold uppercase text-muted">
                Thông tin tài khoản thụ hưởng
              </label>
              <input
                id="bank-info"
                type="text"
                required
                placeholder="VD: Vietcombank - 0123456789 - NGUYEN VAN A"
                value={bankInfo}
                onChange={(e) => setBankInfo(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-line bg-page px-3.5 py-2.5 text-sm text-white outline-none focus:border-accent"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || !balance}
              className="rounded-xl bg-amber-600 px-6 py-3 font-bold text-white shadow-lg hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? 'Đang gửi lệnh rút…' : 'Xác nhận rút tiền'}
            </button>
          </form>
        )}
      </section>

      {/* Lịch sử giao dịch gần đây */}
      <section className="rounded-2xl border border-white/10 bg-card p-5 md:p-7">
        <div className="flex items-center justify-between gap-3">
          <h2 className="m-0 text-lg font-bold">Giao dịch gần đây</h2>
          <Link to="/wallet/transactions" className="text-xs font-bold text-accent-light hover:underline">
            Xem tất cả
          </Link>
        </div>

        {loadingTx ? (
          <p className="mt-4 text-center text-sm text-muted">Đang tải lịch sử giao dịch…</p>
        ) : !transactions.length ? (
          <p className="mt-6 text-center text-sm text-muted">Chưa có giao dịch phát sinh nào trong ví.</p>
        ) : (
          <ul className="m-0 mt-5 list-none space-y-3 p-0">
            {transactions.map((tx) => {
              const isPlus = tx.type === 'Deposit' || tx.type === 'Refund';
              const typeLabels = {
                Deposit: 'Nạp tiền vào ví',
                Withdraw: 'Rút tiền về ngân hàng',
                Purchase: `Mua game: ${tx.productNames || 'Đơn hàng'}`,
                Refund: `Hoàn tiền đơn hàng #${tx.orderId || ''}`,
                Fee: 'Phí dịch vụ Steam Direct',
              };
              const title = typeLabels[tx.type] || `${tx.type} giao dịch`;
              const dateStr = tx.date || tx.transDate ? new Date(tx.date || tx.transDate).toLocaleString('vi-VN') : '—';
              const isFailed = tx.status === 'Failed';

              return (
                <li
                  key={tx.id || tx.transId}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-page p-4"
                >
                  <div>
                    <p className="m-0 font-semibold text-white">{title}</p>
                    <p className="m-0 mt-1 text-xs text-muted">
                      {dateStr} · Mã: <span className="font-mono">{tx.id || tx.transId}</span>
                      {isFailed && <span className="ml-2 font-bold text-red-400">[Thất bại]</span>}
                    </p>
                  </div>
                  <span
                    className={`font-mono text-base font-bold ${
                      isFailed
                        ? 'text-red-400 line-through'
                        : isPlus
                        ? 'text-emerald-400'
                        : 'text-white'
                    }`}
                  >
                    {isPlus ? '+' : '-'}{formatVnd(Math.abs(tx.amount))}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
