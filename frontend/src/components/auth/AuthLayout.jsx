import { Link } from 'react-router-dom';

/** Khung "Vortex Launcher" dùng chung cho Đăng nhập / Đăng ký. */
export default function AuthLayout({ active, hideTabs = false, children }) {
  return (
    <div className="flex min-h-screen flex-col border border-accent/40 bg-card">
      <div className="flex h-9 flex-none items-center justify-between border border-line bg-black px-[15px] text-[11px] font-bold">
        <span>🎮 VORTEX LAUNCHER&nbsp; v2.6.4</span>
        <span className="text-xs text-muted">—&nbsp; □&nbsp; ✕</span>
      </div>
      <div className="flex flex-1 justify-center">
        <main className="flex w-full max-w-[820px] flex-col items-center justify-center bg-card px-5 py-8 md:py-10">
          {!hideTabs ? <AuthTabs active={active} /> : null}
          {children}
        </main>
      </div>
    </div>
  );
}

function AuthTabs({ active }) {
  const base = 'rounded-lg px-[18px] py-[7px] text-xs';
  const on = 'bg-accent font-bold text-white';
  const off = 'font-medium text-muted';
  return (
    <div className="flex gap-1 rounded-[10px] bg-panel p-[3px]">
      <Link to="/login" className={`${base} ${active === 'login' ? on : off}`}>Đăng nhập</Link>
      <Link to="/register" className={`${base} ${active === 'register' ? on : off}`}>Đăng ký</Link>
    </div>
  );
}
