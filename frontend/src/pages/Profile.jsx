import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { libraryApi } from '../api/library';
import { profileApi } from '../api/profile';
import { walletApi } from '../api/wallet';
import { useShop } from '../context/ShopContext';
import { formatVnd } from '../utils/format';
import FeedbackDialog from '../components/common/FeedbackDialog';

const transactionLabels = {
  Deposit: 'Nạp tiền',
  Withdraw: 'Rút tiền',
  Purchase: 'Mua game',
  Refund: 'Hoàn tiền',
  Fee: 'Phí hệ thống',
};

function formatDate(value, options = { dateStyle: 'medium' }) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return options.timeStyle
    ? date.toLocaleString('vi-VN', options)
    : date.toLocaleDateString('vi-VN', options);
}

function getInitials(value) {
  return value
    ?.trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || '?';
}

function responseList(value) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  return [];
}

function StatCard({ label, value, note }) {
  return (
    <article className="rounded-xl border border-white/10 bg-page p-4">
      <p className="m-0 text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="mb-0 mt-2 text-xl font-extrabold">{value}</p>
      {note ? <p className="mb-0 mt-1 text-xs text-muted">{note}</p> : null}
    </article>
  );
}

export default function Profile() {
  const { user, updateUser } = useShop();
  const isCustomer = user?.roles?.includes('Customer') || false;
  const accountId = user?.accountId;
  const [profile, setProfile] = useState(null);
  const [displayName, setDisplayName] = useState('');
  const [games, setGames] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingName, setSavingName] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [requestingPasswordOtp, setRequestingPasswordOtp] = useState(false);
  const [passwordOtpSent, setPasswordOtpSent] = useState(false);
  const [passwordOtpCountdown, setPasswordOtpCountdown] = useState(0);
  const [error, setError] = useState('');
  const [activityError, setActivityError] = useState('');
  const [notice, setNotice] = useState('');
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    otp: '',
  });
  const [avatarFailed, setAvatarFailed] = useState(false);
  const [dialog, setDialog] = useState(null);

  useEffect(() => {
    if (passwordOtpCountdown <= 0) return undefined;
    const timer = setInterval(() => {
      setPasswordOtpCountdown((current) => current - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [passwordOtpCountdown]);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError('');
    setActivityError('');
    try {
      const result = await profileApi.layThongTinHoSo();
      setProfile(result);
      setDisplayName(result.displayName || '');

      if (isCustomer) {
        const [libraryResult, walletResult, transactionsResult] = await Promise.allSettled([
          libraryApi.yeuCauXemThuVien(),
          walletApi.yeuCauXemSoDu(),
          walletApi.yeuCauXemLichSuGiaoDich(),
        ]);
        const errors = [];
        if (libraryResult.status === 'fulfilled') {
          setGames(responseList(libraryResult.value));
        } else {
          setGames(null);
          errors.push(`Thư viện: ${libraryResult.reason?.message || 'không tải được'}`);
        }
        if (walletResult.status === 'fulfilled') {
          setWallet(walletResult.value?.data || walletResult.value);
        } else {
          setWallet(null);
          errors.push(`Ví: ${walletResult.reason?.message || 'không tải được'}`);
        }
        if (transactionsResult.status === 'fulfilled') {
          setTransactions(responseList(transactionsResult.value));
        } else {
          setTransactions([]);
          errors.push(`Hoạt động: ${transactionsResult.reason?.message || 'không tải được'}`);
        }
        setActivityError(errors.join(' · '));
      } else {
        setGames(null);
        setWallet(null);
        setTransactions([]);
      }
    } catch (loadError) {
      setError(loadError?.message || 'Không thể tải hồ sơ cá nhân.');
    } finally {
      setLoading(false);
    }
  }, [accountId, isCustomer]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    setAvatarFailed(false);
  }, [profile?.avatarUrl]);

  const saveDisplayName = async (event) => {
    event.preventDefault();
    setSavingName(true);
    setError('');
    setNotice('');
    try {
      const updated = await profileApi.updateDisplayName(displayName.trim());
      setProfile((current) => ({ ...current, ...updated }));
      setDisplayName(updated.displayName || displayName.trim());
      updateUser({ ...user, ...updated });
      setNotice('Đã cập nhật tên hiển thị.');
    } catch (saveError) {
      setError(saveError?.message || 'Không thể cập nhật tên hiển thị.');
    } finally {
      setSavingName(false);
    }
  };

  const changePassword = async (event) => {
    event.preventDefault();
    setError('');
    setNotice('');
    if (!passwordOtpSent) {
      setError('Hãy yêu cầu mã OTP gửi tới email tài khoản trước khi đổi mật khẩu.');
      return;
    }
    if (passwords.newPassword.length < 8) {
      setError('Mật khẩu mới phải có ít nhất 8 ký tự.');
      return;
    }
    if (passwords.newPassword.length > 72) {
      setError('Mật khẩu mới tối đa 72 ký tự.');
      return;
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }
    if (!/^\d{6}$/.test(passwords.otp)) {
      setError('Mã OTP phải gồm đúng 6 chữ số.');
      return;
    }

    setChangingPassword(true);
    try {
      await profileApi.changePassword({
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
        otp: passwords.otp,
      });
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '', otp: '' });
      setPasswordOtpSent(false);
      setPasswordOtpCountdown(0);
      setNotice('Đã đổi mật khẩu.');
    } catch (changeError) {
      setError(changeError?.message || 'Không thể đổi mật khẩu.');
    } finally {
      setChangingPassword(false);
    }
  };

  const requestPasswordOtp = async () => {
    setError('');
    setNotice('');
    setRequestingPasswordOtp(true);
    try {
      await profileApi.guiMaOtpDoiMatKhau();
      setPasswordOtpSent(true);
      setPasswordOtpCountdown(10);
      setNotice(`Đã gửi mã OTP 6 chữ số tới email ${profile?.email || 'đăng ký tài khoản'}.`);
    } catch (otpError) {
      setError(otpError?.message || 'Không thể gửi mã OTP.');
    } finally {
      setRequestingPasswordOtp(false);
    }
  };

  const roles = profile?.roles || user?.roles || [];

  return (
    <div className="mx-auto w-full max-w-[1200px] px-4 pb-20 pt-10 md:px-8">
      <header className="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900 via-card to-page p-6 md:p-8">
        <div className="flex flex-wrap items-center gap-5">
          <div className="flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-accent/70 bg-accent/15 text-2xl font-extrabold text-accent-light">
            {profile?.avatarUrl && !avatarFailed ? (
              <img
                src={profile.avatarUrl}
                alt=""
                className="size-full object-cover"
                onError={() => setAvatarFailed(true)}
              />
            ) : getInitials(profile?.displayName || profile?.username)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="m-0 text-xs font-bold uppercase tracking-[0.18em] text-accent-light">Hồ sơ cá nhân</p>
            <h1 className="mb-1 mt-2 truncate text-2xl font-extrabold md:text-3xl">
              {profile?.displayName || (loading ? 'Đang tải hồ sơ...' : 'Tài khoản')}
            </h1>
            <p className="m-0 text-sm text-muted">
              @{profile?.username || '—'} · {profile?.email || '—'}
            </p>
            <p className="mb-0 mt-2 text-xs text-muted">
              Thành viên từ {formatDate(profile?.createdAt)}
              {roles.length ? ` · ${roles.join(', ')}` : ''}
            </p>
          </div>
        </div>
        <p className="mb-0 mt-5 border-t border-white/10 pt-4 text-xs text-muted">
          Ảnh đại diện chỉ được hiển thị từ hồ sơ hiện có; trang này không cung cấp thao tác tải lên hoặc chỉnh sửa.
        </p>
      </header>

      <FeedbackDialog open={Boolean(dialog || error || notice)} title={dialog?.title || (error ? 'Đã xảy ra lỗi' : 'Thông báo')} message={dialog?.message || error || notice} tone={dialog?.tone || (error ? 'error' : 'success')} onClose={() => { setDialog(null); setError(''); setNotice(''); }} onConfirm={dialog?.onConfirm} />
      {loading ? <p className="mt-5 text-sm text-muted">Đang tải dữ liệu hồ sơ...</p> : null}

      <section aria-label="Thống kê tài khoản" className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Game trong thư viện" value={isCustomer && games ? games.length : '—'} note="Lấy từ thư viện bản quyền" />
        <StatCard label="Số dư ví" value={wallet ? formatVnd(wallet.balance) : '—'} note={wallet?.currency || 'Chưa có dữ liệu ví'} />
        <StatCard label="Ngày tham gia" value={formatDate(profile?.createdAt)} note="Ngày tạo tài khoản" />
      </section>

      <p className="mt-3 text-xs text-muted">
        Thành tựu, thời gian chơi và điểm thưởng chưa có nguồn dữ liệu trong schema hiện tại nên không hiển thị số liệu giả.
      </p>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <form onSubmit={(event) => { event.preventDefault(); setDialog({ title: 'Xác nhận đổi thông tin', message: 'Bạn muốn cập nhật tên hiển thị tài khoản?', onConfirm: async () => { setDialog(null); await saveDisplayName({ preventDefault() {} }); } }); }} className="space-y-4 rounded-2xl border border-white/10 bg-card p-5">
          <div>
            <h2 className="m-0 text-lg font-bold">Thông tin tài khoản</h2>
            <p className="mb-0 mt-1 text-sm text-muted">Email và tên đăng nhập chỉ đọc; có thể cập nhật tên hiển thị.</p>
          </div>
          <label className="block text-sm font-semibold text-muted">
            Tên hiển thị
            <input
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              maxLength={50}
              required
              className="mt-1.5 w-full rounded-lg border border-line bg-page px-3 py-2.5 text-white"
            />
          </label>
          <label className="block text-sm font-semibold text-muted">
            Email
            <input value={profile?.email || ''} readOnly className="mt-1.5 w-full rounded-lg border border-line bg-page px-3 py-2.5 text-muted" />
          </label>
          <button type="submit" disabled={savingName || loading || !displayName.trim()} className="rounded-lg bg-accent px-4 py-2.5 text-sm font-bold disabled:opacity-50">
            {savingName ? 'Đang lưu...' : 'Lưu tên hiển thị'}
          </button>
        </form>

        <form onSubmit={(event) => { event.preventDefault(); setDialog({ title: 'Xác nhận đổi mật khẩu', message: 'Bạn muốn đổi mật khẩu tài khoản bằng thông tin đã nhập?', onConfirm: async () => { setDialog(null); await changePassword({ preventDefault() {} }); } }); }} className="space-y-4 rounded-2xl border border-white/10 bg-card p-5">
          <div>
            <h2 className="m-0 text-lg font-bold">Đổi mật khẩu</h2>
            <p className="mb-0 mt-1 text-sm text-muted">Mật khẩu mới từ 8 đến 72 ký tự; cần xác nhận OTP qua email.</p>
          </div>
          {[
            ['currentPassword', 'Mật khẩu hiện tại'],
            ['newPassword', 'Mật khẩu mới'],
            ['confirmPassword', 'Xác nhận mật khẩu mới'],
          ].map(([field, label]) => (
            <label key={field} className="block text-sm font-semibold text-muted">
              {label}
              <input
                type="password"
                autoComplete={field === 'currentPassword' ? 'current-password' : 'new-password'}
                value={passwords[field]}
                onChange={(event) => setPasswords((current) => ({ ...current, [field]: event.target.value }))}
                minLength={field === 'currentPassword' ? undefined : 8}
                maxLength={72}
                required
                className="mt-1.5 w-full rounded-lg border border-line bg-page px-3 py-2.5 text-white"
              />
            </label>
          ))}
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
            <label className="block text-sm font-semibold text-muted">
              Mã OTP xác nhận
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={passwords.otp}
                onChange={(event) => setPasswords((current) => ({ ...current, otp: event.target.value.replace(/\D/g, '').slice(0, 6) }))}
                maxLength={6}
                pattern="\d{6}"
                placeholder="Nhập mã 6 chữ số"
                required
                className="mt-1.5 w-full rounded-lg border border-line bg-page px-3 py-2.5 text-white"
              />
            </label>
            <button
              type="button"
              onClick={requestPasswordOtp}
              disabled={requestingPasswordOtp || passwordOtpCountdown > 0 || loading}
              className="rounded-lg border border-line px-4 py-2.5 text-sm font-bold disabled:opacity-50"
            >
              {requestingPasswordOtp
                ? 'Đang gửi...'
                : passwordOtpCountdown > 0 ? `Gửi lại (${passwordOtpCountdown}s)` : 'Gửi mã OTP'}
            </button>
          </div>
          <button type="submit" disabled={changingPassword || loading || requestingPasswordOtp} className="rounded-lg border border-line px-4 py-2.5 text-sm font-bold disabled:opacity-50">
            {changingPassword ? 'Đang cập nhật...' : 'Đổi mật khẩu'}
          </button>
        </form>
      </div>

      <section className="mt-6 rounded-2xl border border-white/10 bg-card p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="m-0 text-lg font-bold">Hoạt động gần đây</h2>
            <p className="mb-0 mt-1 text-sm text-muted">Các giao dịch ví gần nhất được trả về từ API.</p>
          </div>
          {user?.roles?.includes('Customer') ? (
            <Link to="/wallet/transactions" className="text-sm font-bold text-accent-light hover:underline">Xem toàn bộ lịch sử</Link>
          ) : null}
        </div>
        {activityError ? <p role="status" className="mt-4 text-sm text-amber-300">Một phần dữ liệu chưa tải được: {activityError}</p> : null}
        <div className="mt-4 divide-y divide-white/5">
          {transactions.slice(0, 5).map((transaction) => {
            const id = transaction.id || transaction.transId || transaction.TransID;
            const type = transaction.type || transaction.Type;
            const amount = Number(transaction.amount ?? transaction.Amount ?? 0);
            const date = transaction.date || transaction.transDate || transaction.TransDate;
            const description = transaction.productNames || transaction.orderId || transaction.OrderID || '';
            return (
              <article key={id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <p className="m-0 text-sm font-semibold">{transactionLabels[type] || type || 'Giao dịch'}</p>
                  <p className="mb-0 mt-1 text-xs text-muted">{description || 'Ví điện tử'} · {formatDate(date, { dateStyle: 'medium', timeStyle: 'short' })}</p>
                </div>
                <span className={`font-mono text-sm font-bold ${type === 'Deposit' || type === 'Refund' ? 'text-emerald-400' : 'text-white'}`}>
                  {type === 'Deposit' || type === 'Refund' ? '+' : '−'}{formatVnd(amount)}
                </span>
              </article>
            );
          })}
          {!loading && !transactions.length ? <p className="py-5 text-sm text-muted">Chưa có giao dịch ví để hiển thị.</p> : null}
        </div>
      </section>
    </div>
  );
}
