import { Link } from 'react-router-dom';

/** Khung "Vortex Launcher" dùng chung cho Đăng nhập / Đăng ký (Figma: 8:240, 8:284). */
export default function AuthLayout({ active, promo, sideClass = 'lg:w-[420px]', hideTabs = false, children }) {
  return (
    <div className="flex min-h-screen flex-col border border-accent/40 bg-card">
      <div className="flex h-9 flex-none items-center justify-between border border-line bg-black px-[15px] text-[11px] font-bold">
        <span>🎮 VORTEX LAUNCHER&nbsp; v2.6.4</span>
        <span className="text-xs text-muted">—&nbsp; □&nbsp; ✕</span>
      </div>
      <div className="flex flex-1">
        <aside className={`hidden flex-none items-center justify-center border border-line bg-page px-8 lg:flex ${sideClass}`}>
          <PromoCard {...promo} />
        </aside>
        <main className="flex flex-1 flex-col items-center bg-card px-5 pb-10 pt-8 md:pt-[45px]">
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

function PromoCard({ badge, title, description, giftTitle, giftNote }) {
  return (
    <div className="relative h-[260px] w-[360px] max-w-full rounded-[14px] border border-accent/30 bg-panel">
      <span className="absolute left-[19px] top-[19px] rounded-xl bg-accent/30 px-3 py-[5px] text-[10px] font-bold text-accent-light">
        {badge}
      </span>
      <h2 className="absolute left-[19px] top-[55px] m-0 whitespace-pre-line text-[22px] font-bold leading-normal">{title}</h2>
      <p className="absolute left-[19px] top-[119px] m-0 whitespace-pre-line text-xs text-muted">{description}</p>
      <div className="absolute left-[19px] top-[179px] h-[60px] w-[320px] max-w-[calc(100%-38px)] rounded-lg border border-accent/40 bg-card">
        <p className="absolute left-[11px] top-[11px] m-0 text-xs font-bold">{giftTitle}</p>
        <p className="absolute left-[11px] top-[33px] m-0 text-[11px] text-ok">{giftNote}</p>
      </div>
    </div>
  );
}
