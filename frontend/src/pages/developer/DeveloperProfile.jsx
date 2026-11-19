import { useState } from 'react';
import DeveloperShell from '../../components/developer/DeveloperShell';

export default function DeveloperProfile() {
  const [company, setCompany] = useState('Vortex');
  const [bankAccount, setBankAccount] = useState('VCB - 0071001294821 - NGUYEN VAN A');
  const [message, setMessage] = useState('');

  const saveProfile = (event) => {
    event.preventDefault();
    if (!company.trim() || !bankAccount.trim()) {
      setMessage('Vui lòng điền đầy đủ tên đơn vị và tài khoản ngân hàng.');
      return;
    }
    setMessage('Đã lưu thông tin hồ sơ trên giao diện mẫu.');
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
              <dd className="m-0 mt-1 text-lg font-bold">Vortex Indie Lab</dd>
            </div>
            <div className="py-4">
              <dt className="text-xs font-bold uppercase text-muted">Mã định danh</dt>
              <dd className="m-0 mt-1 font-mono font-bold text-accent-light">#DEV-001</dd>
            </div>
            <div className="py-4">
              <dt className="text-xs font-bold uppercase text-muted">Tài khoản ngân hàng đối soát (BankAccount)</dt>
              <dd className="m-0 mt-1 font-semibold text-emerald-400">VCB - 0071001294821 - NGUYEN VAN A</dd>
            </div>
            <div className="flex flex-wrap justify-between gap-3 py-4">
              <div>
                <dt className="text-xs text-muted">Phí Steam Direct</dt>
                <dd className="m-0 mt-1 font-bold">FeePaid = 1 (2.500.000 đ)</dd>
              </div>
              <div className="text-right">
                <dt className="text-xs text-muted">Mã GD trừ ví</dt>
                <dd className="m-0 mt-1 font-mono font-bold text-accent-light">#TX-DIRECT-8801</dd>
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
            <span className="text-sm font-bold">Phí kích hoạt Steam Direct</span>
            <span className="font-extrabold text-accent-light">2.500.000 đ</span>
          </div>
          <button type="submit" className="w-full rounded-xl bg-accent px-5 py-3 font-bold">
            Xác nhận Thanh toán Phí & Cập nhật Hồ sơ NPH
          </button>
          {message ? <p role="status" className="m-0 text-sm text-accent-light">{message}</p> : null}
        </form>
      </div>
    </DeveloperShell>
  );
}
