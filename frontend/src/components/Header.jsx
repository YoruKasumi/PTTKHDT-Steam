import { useState } from 'react';
import { useShop } from '../context/ShopContext';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getRoleLandingPath } from '../utils/roleLanding';

/** Khối logo + ô tìm kiếm + giỏ hàng (Figma: node 1:304). */
export default function Header() {
  const { cart, user } = useShop();
  const [keyword, setKeyword] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  const submit = (e) => {
    e.preventDefault();
    navigate(`/search/results?keyword=${encodeURIComponent(keyword.trim())}`);
  };

  const roles = user?.roles || [];
  const portalRole = roles.includes('Admin') ? 'Quản trị viên'
    : roles.includes('Manager') ? 'Nhân viên kiểm duyệt'
      : roles.includes('Developer') ? 'Nhà phát hành' : '';
  const isPortalUser = Boolean(portalRole);
  const isWorkspace = location.pathname.startsWith('/developer')
    || location.pathname.startsWith('/admin')
    || location.pathname.startsWith('/finance')
    || location.pathname.startsWith('/moderation');
  const showWorkspaceHeader = isPortalUser && isWorkspace;
  const workspacePath = getRoleLandingPath(user);

  return (
    <header className="flex min-h-[116px] items-center gap-3 bg-card px-4 py-3 md:gap-6 md:px-[66px] md:py-4">
      <Link
        to={showWorkspaceHeader ? workspacePath : '/'}
        className="flex h-12 w-[90px] flex-none items-center justify-center md:h-[70px] md:w-[157px]"
      >
        <img className="h-full w-full object-contain p-1" src="/assets/steam-store-logo.svg" alt="Steam Store" />
      </Link>
      {showWorkspaceHeader ? (
        <div className="mx-auto flex flex-1 flex-wrap items-center justify-between gap-3">
          <div>
          <p className="m-0 text-xs font-bold uppercase tracking-[0.2em] text-accent-light">
            {roles.includes('Admin') ? 'Vortex Admin Console' : roles.includes('Manager') ? 'Vortex Staff Workspace' : 'Vortex Creator Portal'}
          </p>
          <p className="m-0 mt-1 text-lg font-extrabold text-white">Khu vực {portalRole}</p>
          </div>
          <nav aria-label="Chuyển khu vực" className="flex gap-2">
            <Link to="/" className="rounded-lg border border-white/20 px-3 py-2 text-sm font-semibold text-white hover:bg-white/10">Cửa hàng</Link>
            <Link to={workspacePath} aria-current="page" className="rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-white">Khu làm việc</Link>
          </nav>
        </div>
      ) : <form className="relative mx-auto h-[57px] max-w-[733px] flex-1" onSubmit={submit} role="search">
        <img className="absolute inset-0 size-full" src="/assets/search-bg.svg" alt="" />
        <input
          className="relative size-full border-0 bg-transparent pl-[46px] pr-[70px] text-xl text-white outline-none placeholder:text-white/90"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Nhập từ khóa tìm kiếm..."
          aria-label="Tìm kiếm game"
        />
        <button type="submit" className="absolute right-3.5 top-1/2 -translate-y-1/2 border-0 bg-transparent p-0" aria-label="Tìm kiếm">
          <img className="size-[30px]" src="/assets/icon-search.svg" alt="" />
        </button>
      </form>}
      {!showWorkspaceHeader ? <Link to="/cart" className="relative size-9 flex-none md:mr-6 md:size-[50px]" aria-label={`Giỏ hàng (${cart.length})`}>
        <img className="size-full" src="/assets/icon-cart.svg" alt="" />
        {cart.length ? (
          <span className="absolute -right-2 -top-2 flex min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[11px] font-bold text-white">{cart.length}</span>
        ) : null}
      </Link> : null}
      {!user ? <div className="flex items-center gap-2" aria-label="Tài khoản">
        <Link to="/login" className="rounded border border-accent/40 bg-page px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/10 md:text-sm">Đăng nhập</Link>
      </div> : null}
    </header>
  );
}
