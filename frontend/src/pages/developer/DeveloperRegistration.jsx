import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { formatVnd } from '../../utils/format';
import { useShop } from '../../context/ShopContext';
import { developerApi } from '../../api/developer';
import { libraryApi } from '../../api/library';

const activationKeys = [
  'VORTX-8821A-REPO1',
  'CYBER-2088X-PRO99',
  'CYBER-2088Y-VIP77',
  'CYBER-2088Z-GOLD5',
  'APTX-4869Z-SERY2',
];

export default function DeveloperRegistration() {
  const navigate = useNavigate();
  const { balance = 0, refreshShop, user, updateUser } = useShop();
  const [studio, setStudio] = useState('Vortex');
  const [bankAccount, setBankAccount] = useState('VCB - 0071001294821 - NGUYEN VAN A');
  const [productKey, setProductKey] = useState('');
  const [selectedKey, setSelectedKey] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const fee = 1000000;

  const activateDeveloper = async (event) => {
    event.preventDefault();
    if (!studio.trim() || !bankAccount.trim()) {
      setMessage('Vui lòng nhập tên Studio và tài khoản ngân hàng.');
      return;
    }
    if ((balance ?? 0) < fee) {
      setMessage('Số dư ví không đủ để thanh toán phí kích hoạt hồ sơ. Vui lòng nạp thêm tiền vào ví.');
      return;
    }
    setLoading(true);
    try {
      await developerApi.register({
        companyName: studio.trim(),
        bankAccount: bankAccount.trim(),
        feeAmount: fee,
      });
      if (user) updateUser({ ...user, roles: [...new Set([...(user.roles || []), 'Developer'])] });
      setMessage('Đăng ký Nhà phát hành thành công! Hệ thống đang chuyển hướng...');
      await refreshShop();
      setTimeout(() => navigate('/developer/games'), 1200);
    } catch (err) {
      setMessage(err.message || 'Đăng ký thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const activateKey = async (event) => {
    event.preventDefault();
    const key = productKey.trim() || selectedKey;
    if (!key) {
      setMessage('Vui lòng nhập hoặc chọn mã bản quyền cần kích hoạt.');
      return;
    }
    try {
      await libraryApi.kichHoatKey(key);
      setMessage(`Đã kích hoạt thành công mã ${key} vào Thư viện.`);
      await refreshShop();
    } catch (err) {
      setMessage(err.message || `Kích hoạt mã ${key} thất bại.`);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-5 px-4 pb-20 pt-10 md:px-8">
      <header className="rounded-2xl border border-accent/30 bg-gradient-to-r from-slate-900 via-card to-page p-6 shadow-xl">
        <p className="m-0 text-xs font-bold uppercase tracking-[0.2em] text-accent-light">Phân hệ khách hàng</p>
        <h1 className="mb-2 mt-3 text-2xl font-extrabold md:text-3xl">Đăng ký tài khoản nhà phát hành</h1>
        <p className="m-0 max-w-3xl text-sm text-muted">Tạo hồ sơ Studio, liên kết tài khoản nhận doanh thu và kích hoạt quyền phát hành.</p>
      </header>
      <div className="grid gap-5 xl:grid-cols-2">
        <form onSubmit={activateDeveloper} className="space-y-5 rounded-2xl border border-indigo-950 bg-card p-5 md:p-7">
          <h2 className="m-0 text-lg font-bold">Thông tin nhà phát hành</h2>
          <label className="block text-sm font-semibold text-muted">
            Tên Studio / Đơn vị phát hành
            <input
              value={studio}
              onChange={(event) => setStudio(event.target.value)}
              className="mt-2 w-full rounded-xl border border-line bg-page px-4 py-3 text-white outline-none focus:border-accent"
              required
            />
          </label>
          <label className="block text-sm font-semibold text-muted">
            Tài khoản ngân hàng nhận doanh thu
            <input
              value={bankAccount}
              onChange={(event) => setBankAccount(event.target.value)}
              className="mt-2 w-full rounded-xl border border-line bg-page px-4 py-3 text-white outline-none focus:border-accent"
              required
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-accent/50 bg-page p-4">
              <p className="m-0 text-sm text-muted">Phí kích hoạt hồ sơ một lần</p>
              <p className="mb-0 mt-2 text-lg font-extrabold text-accent-light">{formatVnd(fee)}</p>
            </div>
            <div className="rounded-xl border border-accent/50 bg-page p-4">
              <p className="m-0 text-sm text-muted">Số dư Ví điện tử hiện tại</p>
              <div className="flex items-center justify-between">
                <p className="mb-0 mt-2 text-lg font-extrabold text-emerald-400">{formatVnd(balance)}</p>
                {(balance ?? 0) < fee && (
                  <Link to="/wallet" className="text-xs text-indigo-400 hover:underline">
                    Nạp ví →
                  </Link>
                )}
              </div>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-accent px-5 py-3 font-bold text-white transition-opacity disabled:opacity-50"
          >
            {loading ? 'Đang xử lý...' : 'Kích hoạt hồ sơ Developer'}
          </button>
        </form>

        <div className="space-y-5 rounded-2xl border border-indigo-950 bg-card p-5 md:p-7">
          <form onSubmit={activateKey} className="space-y-4">
            <h2 className="m-0 text-lg font-bold">Kích hoạt Mã bản quyền</h2>
            <label className="block text-sm font-semibold text-muted">
              Mã sản phẩm
              <input
                value={productKey}
                onChange={(event) => setProductKey(event.target.value)}
                placeholder="XXXXX - XXXXX - XXXXX"
                className="mt-2 w-full rounded-xl border border-line bg-page px-4 py-3 font-mono text-white outline-none focus:border-accent"
              />
            </label>
            <label className="flex items-center gap-2 text-sm text-muted">
              <input type="checkbox" className="accent-indigo-500" defaultChecked readOnly />
              Kích hoạt ngay vào Thư viện
            </label>
            <button type="submit" className="rounded-lg bg-accent px-5 py-2.5 font-bold">
              Kích hoạt Mã bản quyền
            </button>
          </form>

          <div className="border-t border-white/10 pt-4">
            <h3 className="mb-3 mt-0 text-sm font-bold">Mã Key khả dụng trong hệ thống</h3>
            <div className="flex flex-wrap gap-2">
              {activationKeys.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setSelectedKey(key);
                    setProductKey(key);
                  }}
                  className={`rounded-lg border px-3 py-2 font-mono text-xs ${
                    selectedKey === key ? 'border-accent bg-accent/20 text-white' : 'border-line bg-page text-accent-light'
                  }`}
                >
                  {key}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      {message ? (
        <div role="status" className="rounded-xl border border-violet-400/40 bg-indigo-950 p-4 text-sm font-semibold text-white">
          {message}
        </div>
      ) : null}
    </div>
  );
}
