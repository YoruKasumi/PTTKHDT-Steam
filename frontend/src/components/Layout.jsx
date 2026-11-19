import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import TopBar from './TopBar';
import Header from './Header';

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <>
      <TopBar />
      <Header />
      {location.state?.loginSuccess ? (
        <div role="status" className="fixed right-4 top-16 z-40 flex items-center gap-4 rounded-lg bg-neutral-900 px-5 py-4 text-2xl font-bold text-indigo-400 shadow-xl">
          Đăng nhập thành công
          <button type="button" aria-label="Đóng thông báo" onClick={() => navigate(location.pathname, { replace: true, state: null })} className="text-sm text-zinc-400 hover:text-white">✕</button>
        </div>
      ) : null}
      <main>
        <Outlet />
      </main>
    </>
  );
}
