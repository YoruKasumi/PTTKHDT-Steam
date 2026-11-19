import { Link, NavLink } from 'react-router-dom';
import { useState } from 'react';

const links = [
  { to: '/', icon: 'icon-home.svg', label: 'Trang chủ' },
  { to: '/library', icon: 'icon-library.svg', label: 'Thư viện' },
  { to: '/wishlist', icon: 'icon-heart.svg', label: 'Danh sách mong muốn' },
  { to: '/search', icon: 'icon-filter.svg', label: 'Bộ lọc tìm kiếm' },
];

const btn = ({ isActive }) =>
  `relative flex h-11 w-12 items-center justify-center bg-page sm:w-[70px] ${isActive ? 'outline outline-1 outline-accent' : ''}`;

/** Thanh điều hướng đen phía trên (Figma: node 1:319). */
export default function TopBar() {
  const [openMenu, setOpenMenu] = useState('');
  const [allRead, setAllRead] = useState(false);

  const toggleMenu = (menu) => setOpenMenu((current) => current === menu ? '' : menu);

  return (
    <div className="flex h-[51px] items-center justify-between bg-topbar px-3 sm:px-[50px]">
      <nav className="flex gap-2.5 sm:gap-[30px]">
        {links.map((l) => (
          <NavLink key={l.to} to={l.to} end className={btn} aria-label={l.label} title={l.label}>
            <img className="h-[30px] w-auto" src={`/assets/${l.icon}`} alt="" />
          </NavLink>
        ))}
      </nav>
      <div className="flex gap-2.5 sm:gap-[30px]">
        <div className="relative">
          <button type="button" className={btn({ isActive: openMenu === 'notifications' })} aria-label="Thông báo" title="Thông báo" aria-expanded={openMenu === 'notifications'} onClick={() => toggleMenu('notifications')}>
            <img className="h-[30px] w-auto" src="/assets/icon-bell.svg" alt="" />
            <img className="absolute bottom-1.5 right-1.5 size-[15px] rotate-90" src="/assets/caret-bell.svg" alt="" />
          </button>
          {openMenu === 'notifications' ? (
            <section aria-label="Thông báo mới" className="absolute right-0 top-full z-50 mt-2 w-[288px] rounded-lg border border-stone-900 bg-zinc-950 p-3 shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/20 pb-2">
                <h2 className="m-0 text-sm font-semibold text-white/70">THÔNG BÁO MỚI</h2>
                <button type="button" onClick={() => setAllRead(true)} className="text-xs font-semibold text-accent-light hover:underline">Đã đọc tất cả</button>
              </div>
              <ul className="m-0 list-none space-y-2 p-0 pt-3">
                <li className="rounded-md border border-stone-900 bg-neutral-900 p-3">
                  <p className={`m-0 text-xs ${allRead ? 'text-muted' : 'text-accent-light'}`}>Khuyến mãi</p>
                  <p className="mb-1 mt-1 text-xs text-white">Game Counter Strike 2 vừa ra mắt battle pass mới</p>
                  <span className="text-[10px] text-zinc-400">10 phút trước</span>
                </li>
                <li className="rounded-md border border-stone-900 bg-neutral-900 p-3">
                  <p className="m-0 text-xs text-green-500">Nạp tiền thành công</p>
                  <p className="mb-1 mt-1 text-xs text-white">Đã cộng 200.000 ₫ vào Ví Game</p>
                  <span className="text-[10px] text-zinc-400">1 ngày trước</span>
                </li>
              </ul>
              <Link to="/settings" onClick={() => setOpenMenu('')} className="mt-3 block text-center text-xs font-bold text-accent-light">Xem tất cả thông báo</Link>
            </section>
          ) : null}
        </div>
        <div className="relative">
          <button type="button" className={btn({ isActive: openMenu === 'account' })} aria-label="Tài khoản" title="Tài khoản" aria-expanded={openMenu === 'account'} onClick={() => toggleMenu('account')}>
            <span className="relative h-[37px] w-[34px]">
              <img className="absolute inset-0 size-full" src="/assets/icon-user-frame.svg" alt="" />
              <img className="absolute inset-x-0 top-0.5 h-[33px] w-full" src="/assets/icon-user.svg" alt="" />
            </span>
            <img className="absolute bottom-1.5 right-1.5 size-[15px] rotate-90" src="/assets/caret-user.svg" alt="" />
          </button>
          {openMenu === 'account' ? (
            <nav aria-label="Menu tài khoản" className="absolute right-0 top-full z-50 mt-2 w-48 rounded-lg border border-stone-900 bg-zinc-950 p-1 shadow-2xl">
              {[
                ['/profile', 'Thông tin cá nhân'],
                ['/wallet', 'Ví'],
                ['/settings', 'Cài đặt'],
                ['/register', 'Đăng ký'],
                ['/login', 'Đăng nhập'],
              ].map(([to, label]) => (
                <Link key={to} to={to} onClick={() => setOpenMenu('')} className="block rounded px-3 py-3 text-xs text-white hover:bg-white/5">
                  {label}
                </Link>
              ))}
            </nav>
          ) : null}
        </div>
      </div>
    </div>
  );
}
