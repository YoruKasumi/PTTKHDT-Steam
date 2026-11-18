import { NavLink } from 'react-router-dom';

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
        <NavLink to="/settings" className={btn} aria-label="Thông báo" title="Thông báo">
          <img className="h-[30px] w-auto" src="/assets/icon-bell.svg" alt="" />
          <img className="absolute bottom-1.5 right-1.5 size-[15px] rotate-90" src="/assets/caret-bell.svg" alt="" />
        </NavLink>
        <NavLink to="/profile" className={btn} aria-label="Tài khoản" title="Tài khoản">
          <span className="relative h-[37px] w-[34px]">
            <img className="absolute inset-0 size-full" src="/assets/icon-user-frame.svg" alt="" />
            <img className="absolute inset-x-0 top-0.5 h-[33px] w-full" src="/assets/icon-user.svg" alt="" />
          </span>
          <img className="absolute bottom-1.5 right-1.5 size-[15px] rotate-90" src="/assets/caret-user.svg" alt="" />
        </NavLink>
      </div>
    </div>
  );
}
