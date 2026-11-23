import { useState } from 'react';
import { profileApi } from '../../api/profile';
import { useShop } from '../../context/ShopContext';

const sections = ['Cài đặt chung', 'Tải xuống & Lưu trữ', 'Giao diện & Gam màu', 'Âm thanh & Thông báo', 'Tài khoản & Bảo mật 2FA'];

const initialSettings = {
  startup: true,
  saleNotifications: true,
  autoUpdate: false,
  darkTheme: true,
  sound: true,
  twoFactor: false,
  language: 'vi',
  libraryPath: 'D:\\Games\\VortexLibrary',
  downloadLimit: 0,
};

function ToggleRow({ title, description, checked, onChange }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-5 rounded-xl border border-line bg-page p-4">
      <span>
        <span className="block font-bold">{title}</span>
        <span className="mt-1 block text-sm text-muted">{description}</span>
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="size-5 accent-indigo-500"
      />
    </label>
  );
}

export default function Settings() {
  const { user, updateUser } = useShop();
  const [activeSection, setActiveSection] = useState(sections[0]);
  const [settings, setSettings] = useState({
    ...initialSettings,
    saleNotifications: user?.notifyEnabled ?? initialSettings.saleNotifications,
  });
  const [message, setMessage] = useState('');
  const [profile, setProfile] = useState({
    displayName: user?.displayName || '',
    avatarUrl: user?.avatarUrl || '',
  });
  const [saving, setSaving] = useState(false);
  const update = (key, value) => setSettings((current) => ({ ...current, [key]: value }));

  const saveSettings = async () => {
    setMessage('');
    setSaving(true);
    try {
      const preference = await profileApi.updateNotifications(settings.saleNotifications);
      localStorage.setItem('vortex-settings', JSON.stringify(settings));
      updateUser({ ...user, notifyEnabled: preference.notifyEnabled });
      setMessage('Đã lưu cài đặt và đồng bộ tùy chọn thông báo với tài khoản.');
    } catch (error) {
      setMessage(`Không thể lưu cài đặt: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    setMessage('');
    setSaving(true);
    try {
      const updated = await profileApi.capNhatHoSo({
        displayName: profile.displayName,
        avatarUrl: profile.avatarUrl.trim() || null,
      });
      updateUser({ ...user, ...updated });
      setProfile({ displayName: updated.displayName, avatarUrl: updated.avatarUrl || '' });
      setMessage('Đã cập nhật hồ sơ.');
    } catch (error) {
      setMessage(`Không thể cập nhật hồ sơ: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 pb-20 pt-10 md:px-8">
      <h1 className="mb-6 text-2xl font-extrabold">⚙ Cài đặt ứng dụng Game Launcher</h1>
      <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
        <nav aria-label="Nhóm cài đặt" className="flex gap-2 overflow-x-auto rounded-2xl border border-white/10 bg-card p-3 lg:flex-col">
          {sections.map((section) => (
            <button
              key={section}
              type="button"
              onClick={() => setActiveSection(section)}
              className={`shrink-0 rounded-xl px-4 py-3 text-left text-sm font-bold ${
                activeSection === section ? 'bg-accent text-white' : 'text-muted hover:bg-white/5 hover:text-white'
              }`}
            >
              {section}
            </button>
          ))}
        </nav>

        <section className="space-y-3 rounded-2xl border border-white/10 bg-card p-4 md:p-6">
          {activeSection === 'Cài đặt chung' ? (
            <>
              <ToggleRow
                title="Khởi động cùng hệ điều hành Windows"
                description="Tự động mở ứng dụng ở chế độ chạy ngầm khi bật máy tính"
                checked={settings.startup}
                onChange={(value) => update('startup', value)}
              />
              <ToggleRow
                title="Thông báo đẩy khuyến mãi và sự kiện"
                description="Nhận thông báo khi game trong Wishlist giảm giá sâu"
                checked={settings.saleNotifications}
                onChange={(value) => update('saleNotifications', value)}
              />
            </>
          ) : null}

          {activeSection === 'Tải xuống & Lưu trữ' ? (
            <>
              <ToggleRow
                title="Tự động cập nhật game"
                description="Cập nhật bản vá khi máy tính ở trạng thái rảnh"
                checked={settings.autoUpdate}
                onChange={(value) => update('autoUpdate', value)}
              />
              <label className="block rounded-xl border border-line bg-page p-4">
                <span className="block font-bold">Thư mục cài đặt mặc định</span>
                <span className="mt-1 block text-sm text-muted">Ổ đĩa chứa thư viện trò chơi được cài đặt mới</span>
                <input
                  value={settings.libraryPath}
                  onChange={(event) => update('libraryPath', event.target.value)}
                  className="mt-3 w-full rounded-lg border border-line bg-card px-3 py-2 outline-none focus:border-accent"
                />
              </label>
              <label className="block rounded-xl border border-line bg-page p-4">
                <span className="block font-bold">Giới hạn tốc độ tải xuống</span>
                <span className="mt-1 block text-sm text-muted">
                  {settings.downloadLimit === 0 ? 'Không giới hạn' : `${settings.downloadLimit} MB/s`}
                </span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={settings.downloadLimit}
                  onChange={(event) => update('downloadLimit', Number(event.target.value))}
                  className="mt-3 w-full accent-indigo-500"
                  aria-label="Giới hạn tốc độ tải xuống"
                />
              </label>
            </>
          ) : null}

          {activeSection === 'Giao diện & Gam màu' ? (
            <ToggleRow
              title="Giao diện tối"
              description="Sử dụng giao diện tối cho Game Launcher"
              checked={settings.darkTheme}
              onChange={(value) => update('darkTheme', value)}
            />
          ) : null}

          {activeSection === 'Âm thanh & Thông báo' ? (
            <ToggleRow
              title="Âm thanh giao diện"
              description="Phát âm thanh khi có sự kiện trong ứng dụng"
              checked={settings.sound}
              onChange={(value) => update('sound', value)}
            />
          ) : null}

          {activeSection === 'Tài khoản & Bảo mật 2FA' ? (
            <>
              <form onSubmit={saveProfile} className="space-y-3 rounded-xl border border-line bg-page p-4">
                <h2 className="m-0 font-bold">Hồ sơ cá nhân</h2>
                <label className="block text-sm">Tên hiển thị
                  <input required maxLength={50} value={profile.displayName} onChange={(event) => setProfile((current) => ({ ...current, displayName: event.target.value }))} className="mt-2 w-full rounded-lg border border-line bg-card px-3 py-2" />
                </label>
                <label className="block text-sm">URL ảnh đại diện (có thể để trống)
                  <input maxLength={255} value={profile.avatarUrl} onChange={(event) => setProfile((current) => ({ ...current, avatarUrl: event.target.value }))} className="mt-2 w-full rounded-lg border border-line bg-card px-3 py-2" />
                </label>
                <button disabled={saving} className="rounded-lg bg-accent px-4 py-2 font-bold disabled:opacity-50">Lưu hồ sơ</button>
              </form>

              <ToggleRow
                title="Xác thực hai yếu tố (2FA)"
                description="Cài đặt này chưa được hỗ trợ bởi API."
                checked={settings.twoFactor}
                onChange={(value) => update('twoFactor', value)}
              />
            </>
          ) : null}

          <label className="block rounded-xl border border-line bg-page p-4">
            <span className="block font-bold">Ngôn ngữ hiển thị</span>
            <span className="mt-1 block text-sm text-muted">Thay đổi ngôn ngữ cho giao diện client</span>
            <select
              value={settings.language}
              onChange={(event) => update('language', event.target.value)}
              className="mt-3 w-full rounded-lg border border-line bg-card px-3 py-2 outline-none focus:border-accent"
            >
              <option value="vi">Tiếng Việt (Mặc định)</option>
              <option value="en">English</option>
            </select>
          </label>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <p role="status" className="m-0 text-sm text-emerald-400">{message}</p>
            <button type="button" disabled={saving} onClick={saveSettings} className="rounded-lg bg-accent px-5 py-2.5 font-bold disabled:opacity-50">
              {saving ? 'Đang lưu…' : 'Lưu cài đặt'}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
