import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AuthLayout from '../../components/auth/AuthLayout';
import Field from '../../components/auth/Field';
import { authApi } from '../../api/auth';

const promo = {
  badge: '⚡ MÙA GIẢI 2026',
  title: 'Gia nhập Đấu Trường\nHuyền Thoại',
  description: 'Kết nối với cộng đồng game thủ.\nLưu trữ cloud và nhận ưu đãi mỗi tuần.',
  giftTitle: '🎮 Game của tuần: Sky Echoes',
  giftNote: '● Sẵn sàng tải • Giảm 40%',
};

const maskEmail = (email) => {
  const [name, domain] = email.split('@');
  if (!domain) return email;
  return `${name.slice(0, 1)}${'*'.repeat(Math.max(3, name.length - 2))}${name.slice(-1)}@${domain}`;
};

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [sentTo, setSentTo] = useState('');
  const [error, setError] = useState('');
  const [complete, setComplete] = useState(false);
  const [requestingOtp, setRequestingOtp] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((c) => c - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const requestOtp = async () => {
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError('Vui lòng nhập email hợp lệ trước khi nhận mã OTP.');
      return;
    }
    setError('');
    setRequestingOtp(true);
    try {
      await authApi.forgotPasswordSendOtp({ email: email.trim() });
      setSentTo(maskEmail(email.trim()));
      setCountdown(60);
    } catch (err) {
      setError(err.message || 'Không thể gửi mã OTP. Vui lòng kiểm tra lại email.');
    } finally {
      setRequestingOtp(false);
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!sentTo) {
      setError('Hãy yêu cầu mã OTP trước khi xác nhận mật khẩu mới.');
      return;
    }
    if (!otp.trim()) {
      setError('Vui lòng nhập mã OTP.');
      return;
    }
    if (password.length < 8) {
      setError('Mật khẩu mới cần ít nhất 8 ký tự.');
      return;
    }
    if (confirmation !== password) {
      setError('Mật khẩu nhập lại không khớp.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await authApi.resetPassword({
        email: email.trim(),
        otp: otp.trim(),
        newPassword: password,
      });
      setComplete(true);
    } catch (err) {
      setError(err.message || 'Đặt lại mật khẩu thất bại. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout active="login" promo={promo} sideClass="lg:w-[41%]" hideTabs>
      <div className="w-full max-w-[699px]">
        <h1 className="mb-2 mt-10 text-center text-2xl font-bold">Quên mật khẩu</h1>
        <p className="mb-7 text-center text-xs text-muted">Nhập email và mã OTP để thiết lập mật khẩu mới.</p>

        {complete ? (
          <div role="status" className="rounded-xl border border-emerald-500/30 bg-emerald-950/30 p-6 text-center">
            <p className="m-0 text-xl font-bold text-indigo-400">Đổi mật khẩu thành công</p>
            <p className="mb-0 mt-2 text-sm text-muted">Bạn có thể đăng nhập bằng mật khẩu mới.</p>
            <Link to="/login" className="mt-5 inline-block rounded-lg bg-accent px-6 py-3 text-sm font-bold">Quay lại Đăng nhập</Link>
          </div>
        ) : (
          <form onSubmit={submit} noValidate>
            <Field
              id="recovery-email"
              label="Email tài khoản"
              icon="✉️"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@example.com"
              autoComplete="email"
            />
            <div className="mt-5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_112px] sm:items-end">
              <Field
                id="recovery-otp"
                label="Nhập mã OTP"
                icon="🔐"
                value={otp}
                onChange={(event) => setOtp(event.target.value)}
                placeholder="Mã OTP"
                autoComplete="one-time-code"
              />
              <button
                type="button"
                onClick={requestOtp}
                disabled={requestingOtp || countdown > 0}
                className="h-[54px] rounded-[10px] bg-indigo-600 hover:bg-indigo-700 px-3 text-xs font-bold text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {requestingOtp ? 'Đang gửi...' : countdown > 0 ? `Gửi lại (${countdown}s)` : 'Nhận mã OTP'}
              </button>
            </div>
            {sentTo ? (
              <p role="status" className="mt-2 text-xs text-emerald-400">Đã gửi mã xác thực OTP 6 chữ số đến email: {sentTo}</p>
            ) : null}
            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <Field
                id="new-password"
                label="Nhập mật khẩu mới"
                icon="🔒"
                type="password"
                maxLength={72}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Ít nhất 8 ký tự"
                autoComplete="new-password"
              />
              <Field
                id="confirm-password"
                label="Nhập lại mật khẩu mới"
                icon="🔒"
                type="password"
                maxLength={72}
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                placeholder="Xác nhận mật khẩu"
                autoComplete="new-password"
              />
            </div>
            {error ? <p role="alert" className="mt-3 text-sm text-red-400 font-medium">{error}</p> : null}
            <button
              type="submit"
              disabled={submitting}
              className="mt-7 h-12 w-full rounded-[10px] bg-indigo-600 hover:bg-indigo-700 text-sm font-bold text-white transition-colors disabled:opacity-50"
            >
              {submitting ? 'Đang cập nhật mật khẩu...' : 'Xác nhận mật khẩu mới'}
            </button>
            <p className="mb-0 mt-5 text-center text-xs text-muted"><Link to="/login" className="text-accent-light">Quay lại Đăng nhập</Link></p>
          </form>
        )}
      </div>
    </AuthLayout>
  );
}
