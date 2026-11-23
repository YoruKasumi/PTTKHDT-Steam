import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../../components/auth/AuthLayout';
import Field from '../../components/auth/Field';
import { authApi } from '../../api/auth';
import { passwordStrength } from '../../utils/passwordStrength';

/** Màn hình Đăng ký (Figma: node 8:284). Sequence UC1: nhapThongTinDangKy → guiThongTinDangKy. */
export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ gamertag: '', email: '', otp: '', password: '', confirm: '' });
  const [agree, setAgree] = useState(true);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // OTP state
  const [sendingOtp, setSendingOtp] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [otpNotice, setOtpNotice] = useState('');
  const [otpNoticeType, setOtpNoticeType] = useState('info');

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const strength = passwordStrength(form.password);

  useEffect(() => {
    if (otpCountdown <= 0) return;
    const timer = setInterval(() => {
      setOtpCountdown((c) => c - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [otpCountdown]);

  const handleSendOtp = async () => {
    setOtpNotice('');
    if (!form.email.trim() || !/^\S+@\S+\.\S+$/.test(form.email.trim())) {
      setErrors((prev) => ({ ...prev, email: 'Vui lòng nhập địa chỉ email hợp lệ trước khi gửi mã OTP' }));
      return;
    }
    setErrors((prev) => ({ ...prev, email: '' }));
    setSendingOtp(true);
    try {
      await authApi.sendOtp({ email: form.email.trim(), purpose: 'register' });
      setOtpNotice('Mã OTP đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư đến (và mục Spam).');
      setOtpNoticeType('success');
      setOtpCountdown(10);
    } catch (err) {
      setOtpNotice(err.message || 'Không thể gửi mã OTP. Vui lòng thử lại.');
      setOtpNoticeType('error');
    } finally {
      setSendingOtp(false);
    }
  };

  // Kiểm tra định dạng ở GUI: không rỗng, email đúng mẫu, mật khẩu khớp.
  const validate = () => {
    const e = {};
    if (!form.gamertag.trim()) e.gamertag = 'Vui lòng nhập tên hiển thị';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Email chưa đúng định dạng';
    if (!/^\d{4,6}$/.test(form.otp.trim())) e.otp = 'Nhập mã OTP gồm 4 đến 6 chữ số';
    if (form.password.length < 8) e.password = 'Mật khẩu cần ít nhất 8 ký tự';
    if (form.confirm !== form.password) e.confirm = 'Mật khẩu nhập lại không khớp';
    if (!agree) e.agree = 'Bạn cần đồng ý với Điều khoản Dịch vụ';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    setMessage('');
    if (!validate()) return;
    setLoading(true);
    try {
      // Thiết kế chưa có ô "tên đăng nhập": tạm dùng Gamertag cho cả username và displayName.
      await authApi.register({
        username: form.gamertag.trim(),
        displayName: form.gamertag.trim(),
        email: form.email.trim(),
        otp: form.otp.trim(),
        password: form.password,
      });
      navigate('/login');
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout active="register">
      <h1 className="mb-3 mt-8 text-2xl font-bold">Tạo tài khoản Game thủ</h1>
      <p className="m-0 mb-9 text-xs text-muted">Tham gia cộng đồng Vortex hoàn toàn miễn phí chỉ trong 1 phút.</p>

      <form className="w-full max-w-[739px]" onSubmit={submit} noValidate>
        <Field id="gamertag" label="Tên hiển thị trong game (Gamertag)" icon="🎮" value={form.gamertag} onChange={set('gamertag')}
          placeholder="Ví dụ: ShadowHunter99" autoComplete="nickname" error={errors.gamertag} />

        <div className="mt-5">
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_130px] sm:items-end">
            <Field id="email" label="Địa chỉ Email" icon="✉️" type="email" value={form.email} onChange={set('email')}
              placeholder="tentaikhoan@gmail.com" autoComplete="email" error={errors.email} />
            <button
              type="button"
              onClick={handleSendOtp}
              disabled={sendingOtp || otpCountdown > 0}
              className="h-[54px] rounded-[10px] bg-indigo-600 hover:bg-indigo-700 px-3 text-xs font-bold text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sendingOtp ? 'Đang gửi...' : otpCountdown > 0 ? `Gửi lại (${otpCountdown}s)` : 'Gửi mã OTP'}
            </button>
          </div>
          {otpNotice && (
            <p className={`mt-2 text-xs font-medium ${otpNoticeType === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>
              {otpNotice}
            </p>
          )}
        </div>

        <Field id="otp" className="mt-5" label="Mã OTP xác minh email" icon="🔐" inputMode="numeric" maxLength={6}
          value={form.otp} onChange={set('otp')} placeholder="Nhập mã OTP 6 chữ số" autoComplete="one-time-code" error={errors.otp} />
        <p className="mb-0 mt-2 text-[11px] text-muted">Nhấn "Gửi mã OTP" để nhận mã xác minh 6 chữ số gửi về email của bạn (hết hạn sau 5 phút).</p>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <Field id="password" label="Mật khẩu" icon="🔒" type="password" value={form.password} onChange={set('password')}
            placeholder="Ít nhất 8 ký tự" autoComplete="new-password" error={errors.password} />
          <Field id="confirm" label="Xác nhận mật khẩu" icon="🔒" type="password" value={form.confirm} onChange={set('confirm')}
            placeholder="Nhập lại mật khẩu" autoComplete="new-password" error={errors.confirm} />
        </div>

        <p className={`mb-2 mt-4 text-[11px] font-bold ${strength.text}`}>
          Độ an toàn mật khẩu: {strength.label || '—'}
        </p>
        <div className="h-[7px] rounded-[3px] bg-line">
          <div className={`h-full rounded-[3px] transition-all ${strength.color}`} style={{ width: `${strength.width}%` }} />
        </div>

        <label className="mt-7 flex cursor-pointer items-center gap-4 text-[11px] text-muted">
          <input type="checkbox" className="peer sr-only" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
          <span className="flex size-[23px] flex-none items-center justify-center rounded bg-line text-[10px] font-bold text-transparent peer-checked:bg-accent peer-checked:text-white">✓</span>
          Tôi đồng ý với Điều khoản Dịch vụ và Chính sách Quyền riêng tư của Vortex.
        </label>
        {errors.agree ? <p className="mt-1 text-[11px] text-red-400">{errors.agree}</p> : null}

        {message ? <p role="alert" className="mt-4 text-center text-xs text-red-400">{message}</p> : null}

        <button type="submit" disabled={loading}
          className="mt-8 h-[62px] w-full rounded-[10px] bg-accent text-sm font-bold text-white disabled:opacity-60">
          {loading ? 'ĐANG TẠO TÀI KHOẢN...' : 'TẠO TÀI KHOẢN NGAY'}
        </button>
      </form>

      <p className="mt-16 text-[11px] text-muted">
        Đã có tài khoản? <Link to="/login" className="text-accent-light">Đăng nhập ngay</Link>&nbsp; •&nbsp; Trung tâm trợ giúp
      </p>
    </AuthLayout>
  );
}
