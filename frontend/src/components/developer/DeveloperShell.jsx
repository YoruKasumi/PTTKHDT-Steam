import { Link, NavLink } from 'react-router-dom';

const links = [
  { to: '/developer/profile', label: 'Hồ sơ pháp nhân' },
  { to: '/developer/games', label: 'Dự án game' },
  { to: '/developer/patches', label: 'Bản vá' },
  { to: '/developer/keys', label: 'Mã bản quyền' },
  { to: '/developer/revenue', label: 'Đối soát & rút tiền' },
];

export default function DeveloperShell({ title, description, children }) {
  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 pb-20 pt-10 md:px-8">
      <header className="rounded-2xl border border-accent/30 bg-gradient-to-r from-slate-900 via-card to-page p-6 shadow-xl md:flex md:items-end md:justify-between">
        <div>
          <p className="m-0 text-xs font-bold uppercase tracking-[0.2em] text-accent-light">Vortex Creator Portal</p>
          <h1 className="mb-2 mt-3 text-2xl font-extrabold md:text-3xl">{title}</h1>
          <p className="m-0 max-w-3xl text-sm text-muted">{description}</p>
        </div>
        <div className="mt-5 flex flex-wrap gap-2 md:mt-0">
          <Link to="/search" className="inline-flex rounded-lg border border-white/20 px-4 py-2.5 text-sm font-bold text-white hover:bg-white/10">
            ← Trang khách hàng
          </Link>
          <NavLink to="/developer/games" className="inline-flex rounded-lg bg-accent px-4 py-2.5 text-sm font-bold text-white">
            + Khởi tạo dự án game
          </NavLink>
        </div>
      </header>

      <nav aria-label="Điều hướng nhà phát hành" className="my-5 flex gap-2 overflow-x-auto rounded-xl border border-white/10 bg-card p-2">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `shrink-0 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                isActive ? 'bg-accent text-white' : 'text-muted hover:bg-white/5 hover:text-white'
              }`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>

      <div className="space-y-5">{children}</div>
    </div>
  );
}
