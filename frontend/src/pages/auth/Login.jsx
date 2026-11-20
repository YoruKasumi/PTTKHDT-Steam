import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../../components/auth/AuthLayout';
import Field from '../../components/auth/Field';
import { authApi } from '../../api/auth';

const promo = {
  badge: '⚡ MÙA GIẢI 2026',
  title: 'Gia nhập Đấu Trường\nHuyền Thoại',
  description: 'Kết nối với hơn 10 triệu game thủ toàn cầu.\nLưu trữ cloud & nhận ưu đãi mỗi tuần.',
  giftTitle: '🎮 Game của tuần: Sky Echoes',
  giftNote: '● Sẵn sàng tải • Giảm 40%',
};
const socials = ['Steam', 'Discord', 'Google', 'Apple ID'];

/** Màn hình Đăng nhập (Figma: node 8:240). Sequence UC2: nhapThongTinDangNhap → guiThongTinDangNhap. */
export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ account: '', password: '' });
  const [remember, setRemember] = useState(true);
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  // Kiểm tra định dạng ở GUI (không rỗng); quy tắc nghiệp vụ do backend kiểm tra.
  const validate = () => {
    const e = {};
    if (!form.account.trim()) e.account = 'Vui lòng nhập tên tài khoản hoặc email';
    if (!form.password) e.password = 'Vui lòng nhập mật khẩu';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    setMessage('');
    if (!validate()) return;
    setLoading(true);
    try {
      const data = await authApi.guiThongTinDangNhap({ account: form.account.trim(), password: form.password });
      const storage = remember ? localStorage : sessionStorage;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      storage.setItem('token', data.token);
      storage.setItem('user', JSON.stringify(data.user));
      navigate('/', { state: { loginSuccess: true } });
    } catch (err) {
      setMessage(err.message); // hiển thị thông báo lỗi (hienThiThongBaoDangNhapThatBai)
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout active="login" promo={promo} sideClass="lg:w-[41%]">
      <h1 className="mb-3 mt-[60px] text-2xl font-bold">Chào mừng trở lại!</h1>
      <p className="m-0 mb-12 text-xs text-muted">Đăng nhập tài khoản Vortex để tiếp tục chiến game.</p>

      <form className="w-full max-w-[699px]" onSubmit={submit} noValidate>
        <Field
          id="account"
          label="Tên tài khoản hoặc Email"
          icon="👤"
          value={form.account}
          onChange={set('account')}
          placeholder="GamerTag hoặc name@example.com"
          autoComplete="username"
          error={errors.account}
        />
        <div className="relative mt-7">
          <Field
            id="password"
            label="Mật khẩu"
            icon="🔒"
            type={showPw ? 'text' : 'password'}
            value={form.password}
            onChange={set('password')}
            placeholder="••••••••••••"
            autoComplete="current-password"
            error={errors.password}
            right={<Link to="/forgot-password" className="text-[11px] font-medium text-accent-light">Quên mật khẩu?</Link>}
          />
          <button
            type="button"
            onClick={() => setShowPw((v) => !v)}
            className="absolute right-3 top-[41px] border-0 bg-transparent p-0 text-xs"
            aria-label={showPw ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
          >
            👁
          </button>
        </div>

        <label className="mt-9 flex cursor-pointer items-center gap-2.5 pl-[15px] text-xs text-muted">
          <input type="checkbox" className="peer sr-only" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
          <span className="flex size-4 items-center justify-center rounded bg-line text-[10px] font-bold text-transparent peer-checked:bg-accent peer-checked:text-white">✓</span>
          Ghi nhớ tài khoản này (Tự động đăng nhập)
        </label>

        {message ? <p role="alert" className="mt-4 text-center text-xs text-red-400">{message}</p> : null}

        <button
          type="submit"
          disabled={loading}
          className="mt-8 h-[46px] w-full rounded-[10px] bg-accent text-sm font-bold text-white disabled:opacity-60"
        >
          {loading ? 'ĐANG ĐĂNG NHẬP...' : '🎮  ĐĂNG NHẬP VÀO LAUNCHER'}
        </button>
      </form>

      <p className="mb-6 mt-[30px] text-[10px] font-bold text-muted">————&nbsp; HOẶC ĐĂNG NHẬP NHANH BẰNG &nbsp;————</p>
      <div className="grid w-full max-w-[705px] grid-cols-2 gap-5 sm:grid-cols-4">
        {socials.map((s) => (
          <button
            key={s}
            type="button"
            disabled
            title="Chưa hỗ trợ"
            className="h-[55px] rounded-lg border border-line bg-panel px-7 text-left text-xs font-bold text-white disabled:cursor-not-allowed"
          >
            <span className="block pt-0.5">{s}</span>
          </button>
        ))}
      </div>
      <p className="mt-9 text-[11px] text-muted">Cần hỗ trợ? Trung tâm trợ giúp Vortex&nbsp; •&nbsp; Điều khoản dịch vụ</p>
    </AuthLayout>
  );
}
