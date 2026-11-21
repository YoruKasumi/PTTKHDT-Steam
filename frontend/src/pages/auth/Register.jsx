import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../../components/auth/AuthLayout';
import Field from '../../components/auth/Field';
import { authApi } from '../../api/auth';
import { passwordStrength } from '../../utils/passwordStrength';

const promo = {
  badge: '✨ TÀI KHOẢN MỚI',
  title: 'Khởi đầu hành trình\nGaming của bạn',
  description: 'Nhận ngay gói quà chào mừng tân thủ và\nvoucher giảm 50.000 ₫ cho đơn hàng đầu tiên.',
  giftTitle: '🎁 Quà tân thủ: 50.000 ₫ Voucher',
  giftNote: '● Tặng khi đăng ký thành công',
};

/** Màn hình Đăng ký (Figma: node 8:284). Sequence UC1: nhapThongTinDangKy → guiThongTinDangKy. */
export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ gamertag: '', email: '', otp: '', password: '', confirm: '' });
  const [agree, setAgree] = useState(true);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const strength = passwordStrength(form.password);

  // Kiểm tra định dạng ở GUI: không rỗng, email đúng mẫu, mật khẩu khớp.
  const validate = () => {
    const e = {};
    if (!form.gamertag.trim()) e.gamertag = 'Vui lòng nhập tên hiển thị';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Email chưa đúng định dạng';
    if (!/^\d{4}$/.test(form.otp)) e.otp = 'Nhập mã OTP gồm 4 chữ số';
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
        otp: form.otp,
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
    <AuthLayout active="register" promo={promo} sideClass="lg:w-[30%]">
      <h1 className="mb-3 mt-[42px] text-2xl font-bold">Tạo tài khoản Game thủ</h1>
      <p className="m-0 mb-9 text-xs text-muted">Tham gia cộng đồng Vortex hoàn toàn miễn phí chỉ trong 1 phút.</p>

      <form className="w-full max-w-[739px]" onSubmit={submit} noValidate>
        <Field id="gamertag" label="Tên hiển thị trong game (Gamertag)" icon="🎮" value={form.gamertag} onChange={set('gamertag')}
          placeholder="Ví dụ: ShadowHunter99" autoComplete="nickname" error={errors.gamertag} />
        <Field id="email" className="mt-5" label="Địa chỉ Email" icon="✉️" type="email" value={form.email} onChange={set('email')}
          placeholder="tentaikhoan@gmail.com" autoComplete="email" error={errors.email} />
        <Field id="otp" className="mt-5" label="Mã OTP xác minh (mô phỏng)" icon="🔐" inputMode="numeric" maxLength={4}
          value={form.otp} onChange={set('otp')} placeholder="Nhập 4 chữ số" autoComplete="one-time-code" error={errors.otp} />
        <p className="mb-0 mt-2 text-[11px] text-muted">Demo: nhập <span className="font-mono text-accent-light">0000</span> để kiểm tra thất bại; OTP 4 chữ số khác để đăng ký thành công.</p>
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
