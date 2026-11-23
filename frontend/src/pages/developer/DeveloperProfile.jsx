import { useEffect, useState } from 'react';
import DeveloperShell from '../../components/developer/DeveloperShell';
import { developerApi } from '../../api/developer';

export default function DeveloperProfile() {
  const [profile, setProfile] = useState(null);
  const [company, setCompany] = useState('Vortex');
  const [bankAccount, setBankAccount] = useState('VCB - 0071001294821 - NGUYEN VAN A');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let mounted = true;
    developerApi.getProfile()
      .then((res) => {
        if (!mounted) return;
        const data = res?.data || res;
        if (data) {
          setProfile(data);
          if (data.CompanyName) setCompany(data.CompanyName);
          if (data.BankAccount) setBankAccount(data.BankAccount);
        }
      })
      .catch(() => {
        // Giữ giá trị mặc định nếu chưa có hồ sơ
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, []);

  const saveProfile = async (event) => {
    event.preventDefault();
    if (!company.trim() || !bankAccount.trim()) {
      setMessage('Vui lòng điền đầy đủ tên đơn vị và tài khoản ngân hàng.');
      return;
    }
    setSaving(true);
    setMessage('');
    try {
      const res = await developerApi.updateProfile({
        companyName: company.trim(),
        bankAccount: bankAccount.trim(),
      });
      const updated = res?.data || res;
      if (updated) {
        setProfile(updated);
      }
      setMessage('Cập nhật hồ sơ Nhà phát hành thành công!');
    } catch (err) {
      setMessage(err.message || 'Cập nhật thất bại. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DeveloperShell
      title="Hồ sơ pháp nhân"
      description="Theo dõi chứng nhận Steam Direct và cập nhật thông tin nhà phát hành, tài khoản đối soát."
    >
      <div className="grid gap-5 xl:grid-cols-2">
        <section className="rounded-2xl border border-indigo-950 bg-card p-5 md:p-7">
          <div className="mb-5">
            <h2 className="m-0 text-lg font-bold">Chứng nhận Hồ sơ Pháp nhân</h2>
            <p className="mb-0 mt-2 text-sm text-muted">Trạng thái kích hoạt quyền phát hành thương mại Steam Direct</p>
          </div>
          <dl className="m-0 divide-y divide-white/10 rounded-xl border border-line bg-page px-4">
            <div className="py-4">
              <dt className="text-xs font-bold uppercase text-muted">Tên đơn vị phát hành (CompanyName)</dt>
              <dd className="m-0 mt-1 text-lg font-bold">{profile?.CompanyName || company}</dd>
            </div>
            <div className="py-4">
              <dt className="text-xs font-bold uppercase text-muted">Mã định danh</dt>
              <dd className="m-0 mt-1 font-mono font-bold text-accent-light">
                {profile?.AccountID ? `#DEV-${String(profile.AccountID).padStart(3, '0')}` : '#DEV-001'}
              </dd>
            </div>
            <div className="py-4">
              <dt className="text-xs font-bold uppercase text-muted">Tài khoản ngân hàng đối soát (BankAccount)</dt>
              <dd className="m-0 mt-1 font-semibold text-emerald-400">{profile?.BankAccount || bankAccount}</dd>
            </div>
            <div className="flex flex-wrap justify-between gap-3 py-4">
              <div>
                <dt className="text-xs text-muted">Trạng thái Steam Direct</dt>
                <dd className="m-0 mt-1 font-bold">
                  {profile?.FeePaid ? 'Đã thanh toán phí' : 'FeePaid = 1 (1.000.000 đ)'}
                </dd>
              </div>
              <div className="text-right">
                <dt className="text-xs text-muted">Xác thực</dt>
                <dd className="m-0 mt-1 font-mono font-bold text-accent-light">
                  {profile?.VerifyStatus || 'Verified'}
                </dd>
              </div>
            </div>
          </dl>
          <p className="mb-0 mt-4 inline-flex rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-sm font-bold text-emerald-400">
            ● Hồ sơ đã kích hoạt
          </p>
        </section>

        <form onSubmit={saveProfile} className="space-y-5 rounded-2xl border border-indigo-950 bg-card p-5 md:p-7">
          <h2 className="m-0 text-lg font-bold">Đăng ký / Cập nhật Hồ sơ Nhà Phát Hành</h2>
          <label className="block text-sm font-semibold text-muted">
            Tên Công ty / Studio phát hành (CompanyName)
            <input
              value={company}
              onChange={(event) => setCompany(event.target.value)}
              className="mt-2 w-full rounded-xl border border-line bg-page px-4 py-3 text-white outline-none focus:border-accent"
              required
            />
          </label>
          <label className="block text-sm font-semibold text-muted">
            Số tài khoản ngân hàng thụ hưởng (BankAccount)
            <input
              value={bankAccount}
              onChange={(event) => setBankAccount(event.target.value)}
              className="mt-2 w-full rounded-xl border border-line bg-page px-4 py-3 text-white outline-none focus:border-accent"
              required
            />
          </label>
          <div className="flex items-center justify-between rounded-xl border border-line bg-page p-4">
            <span className="text-sm font-bold">Hồ sơ đối soát & thanh toán</span>
            <span className="font-extrabold text-accent-light">Hoạt động</span>
          </div>
          <button
            type="submit"
            disabled={saving || loading}
            className="w-full rounded-xl bg-accent px-5 py-3 font-bold text-white transition-opacity disabled:opacity-50"
          >
            {saving ? 'Đang lưu hồ sơ...' : 'Cập nhật Hồ sơ Nhà phát hành'}
          </button>
          {message ? <p role="status" className="m-0 text-sm text-accent-light">{message}</p> : null}
        </form>
      </div>
    </DeveloperShell>
  );
}
