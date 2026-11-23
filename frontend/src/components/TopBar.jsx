import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useCallback, useEffect, useState } from 'react';
import { useShop } from '../context/ShopContext';
import { formatVnd } from '../utils/format';
import { notificationApi } from '../api/notification';
import { authApi } from '../api/auth';

const links = [
  { to: '/', icon: 'icon-home.svg', label: 'Trang chủ' },
  { to: '/cart', icon: 'icon-cart.svg', label: 'Giỏ hàng' },
  { to: '/library', icon: 'icon-library.svg', label: 'Thư viện' },
  { to: '/wishlist', icon: 'icon-heart.svg', label: 'Danh sách mong muốn' },
  { to: '/search', icon: 'icon-filter.svg', label: 'Bộ lọc tìm kiếm' },
];

const developerLinks = [
  { to: '/developer/games', label: 'Dự án game' },
  { to: '/developer/patches', label: 'Bản vá' },
  { to: '/developer/keys', label: 'Mã bản quyền' },
  { to: '/developer/revenue', label: 'Doanh thu' },
];
const adminLinks = [
  { to: '/admin/accounts', label: 'Tài khoản' },
  { to: '/admin/games', label: 'Duyệt game' },
  { to: '/admin/withdrawals', label: 'Lệnh rút tiền' },
];
const managerLinks = [
  { to: '/admin/accounts', label: 'Tài khoản', permission: 'account.moderate' },
  { to: '/admin/games', label: 'Duyệt game', permission: 'game.approve' },
  { to: '/admin/reviews', label: 'Đánh giá', permission: 'review.moderate' },
  { to: '/moderation/community', label: 'Cộng đồng', permission: 'community.moderate' },
  { to: '/finance/overview', label: 'Tài chính', permission: 'finance.read' },
];

const btn = ({ isActive }) =>
  `relative flex h-11 w-12 items-center justify-center bg-[#15111f] transition-colors hover:bg-[#241b38] sm:w-[70px] ${isActive ? 'bg-[#211833] shadow-[inset_0_-2px_0_0_#a18dff]' : ''}`;

function timeAgo(dateString) {
  if (!dateString) return '';
  const now = new Date();
  const date = new Date(dateString);
  const diffSec = Math.floor((now - date) / 1000);
  if (diffSec < 60) return 'Vừa xong';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} phút trước`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours} giờ trước`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays} ngày trước`;
  return date.toLocaleDateString('vi-VN');
}

/** Thanh điều hướng đen phía trên (Figma: node 1:319). */
export default function TopBar() {
  const navigate = useNavigate();
  const { cart, balance, user, shopError, logout } = useShop();
  const roles = user?.roles || [];
  const isAdmin = roles.includes('Admin');
  const isDeveloper = roles.includes('Developer') && !isAdmin;
  const isManager = roles.includes('Manager') && !isAdmin && !isDeveloper;
  const isStoreUser = !user || (!isAdmin && !isDeveloper && !isManager);
  const portalLinks = isAdmin
    ? adminLinks
    : isDeveloper
      ? developerLinks
      : isManager
        ? managerLinks.filter((link) => (user?.permissions || []).includes(link.permission))
        : [];
  const [openMenu, setOpenMenu] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifs, setLoadingNotifs] = useState(false);

  const toggleMenu = (menu) => setOpenMenu((current) => current === menu ? '' : menu);

  const handleLogout = async () => {
    setOpenMenu('');
    try {
      await authApi.logout();
    } catch (_) {
      // Bỏ qua lỗi kết nối
    }
    await logout();
    navigate('/login');
  };

  const fetchNotifications = useCallback(async () => {
    if (!user?.accountId) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    try {
      setLoadingNotifs(true);
      const res = await notificationApi.layDanhSachThongBao();
      const items = res?.items || (Array.isArray(res) ? res : []);
      setNotifications(items);
      setUnreadCount(res?.unreadCount ?? items.filter((n) => !n.isRead).length);
    } catch {
      // Bỏ qua lỗi kết nối nền
    } finally {
      setLoadingNotifs(false);
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAllRead = async () => {
    try {
      await notificationApi.danhDauTatCaDaDoc();
      setNotifications((current) => current.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Lỗi đánh dấu tất cả đã đọc:', err);
    }
  };

  const handleMarkOneRead = async (item) => {
    if (item.isRead) return;
    try {
      await notificationApi.danhDauDaDoc(item.id || item.notificationId);
      setNotifications((current) =>
        current.map((n) =>
          (n.id === item.id || n.notificationId === item.notificationId) ? { ...n, isRead: true } : n,
        ),
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error('Lỗi đánh dấu đã đọc:', err);
    }
  };

  return (
    <div className="flex h-[51px] items-center justify-between bg-topbar px-3 sm:px-[50px]">
      <nav className="flex gap-2.5 sm:gap-[30px]" aria-label={isStoreUser ? 'Điều hướng cửa hàng' : 'Điều hướng khu vực làm việc'}>
        {isStoreUser ? links.map((l) => (
          <NavLink key={l.to} to={l.to} end className={btn} aria-label={l.to === '/cart' ? `${l.label} (${cart.length})` : l.label} title={l.label}>
            <img className="h-[30px] w-auto" src={`/assets/${l.icon}`} alt="" />
            {l.to === '/cart' && cart.length ? (
              <span className="absolute -right-1 -top-1 flex min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[11px] font-bold text-white">{cart.length}</span>
            ) : null}
          </NavLink>
        )) : portalLinks.map((link) => (
          <NavLink key={link.to} to={link.to} className={({ isActive }) => `rounded px-2 py-2 text-xs font-semibold sm:px-3 sm:text-sm ${isActive ? 'bg-[#211833] text-white' : 'text-violet-200 hover:bg-white/5'}`}>
            {link.label}
          </NavLink>
        ))}
      </nav>
      <div className="flex gap-2.5 sm:gap-[30px]">
        {(user?.roles?.includes('Customer') || user?.roles?.includes('Developer')) ? (
          <Link to="/wallet" className="flex items-center rounded-md px-2 text-xs font-bold text-emerald-300 hover:bg-white/5 sm:text-sm" aria-label={`Số dư ví ${formatVnd(balance)}`}>
            {formatVnd(balance)}
          </Link>
        ) : null}
        {shopError ? <span role="alert" title={shopError} className="self-center text-xs text-red-300">Lỗi đồng bộ giỏ hàng/ví</span> : null}
        <div className="relative">
          <button
            type="button"
            className={btn({ isActive: openMenu === 'notifications' })}
            aria-label={`Thông báo ${unreadCount > 0 ? `(${unreadCount} chưa đọc)` : ''}`}
            title="Thông báo"
            aria-expanded={openMenu === 'notifications'}
            onClick={() => {
              toggleMenu('notifications');
              if (openMenu !== 'notifications') fetchNotifications();
            }}
          >
            <img className="h-[30px] w-auto" src="/assets/icon-bell.svg" alt="" />
            {unreadCount > 0 ? (
              <span className="absolute -right-1 -top-1 flex min-w-5 h-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-md">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            ) : null}
            <img className="absolute bottom-1.5 right-1.5 size-[15px] rotate-90" src="/assets/caret-bell.svg" alt="" />
          </button>
          {openMenu === 'notifications' ? (
            <section aria-label="Thông báo mới" className="absolute right-0 top-full z-50 mt-2 w-[320px] rounded-lg border border-stone-900 bg-zinc-950 p-3 shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/20 pb-2">
                <div className="flex items-center gap-2">
                  <h2 className="m-0 text-sm font-semibold text-white/70">THÔNG BÁO</h2>
                  {unreadCount > 0 && (
                    <span className="rounded-full bg-red-500/20 px-1.5 py-0.5 text-[10px] font-bold text-red-400">
                      {unreadCount} mới
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button type="button" onClick={handleMarkAllRead} className="text-xs font-semibold text-accent-light hover:underline">
                    Đã đọc tất cả
                  </button>
                )}
              </div>
              <ul className="m-0 list-none space-y-2 p-0 pt-3 max-h-[360px] overflow-y-auto">
                {loadingNotifs && notifications.length === 0 ? (
                  <li className="p-3 text-center text-xs text-muted">Đang tải thông báo...</li>
                ) : notifications.length === 0 ? (
                  <li className="p-3 text-center text-xs text-muted">Không có thông báo nào</li>
                ) : (
                  notifications.map((item) => (
                    <li
                      key={item.id || item.notificationId}
                      onClick={() => handleMarkOneRead(item)}
                      className={`cursor-pointer rounded-md border p-3 transition-colors ${
                        item.isRead
                          ? 'border-white/5 bg-neutral-900/60 opacity-80'
                          : 'border-indigo-500/30 bg-neutral-900 shadow-sm'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-[11px] font-bold uppercase tracking-wider ${
                          item.type === 'REFUND' || item.type === 'WARNING'
                            ? 'text-yellow-400'
                            : item.type === 'PURCHASE' || item.type === 'WALLET'
                            ? 'text-emerald-400'
                            : 'text-accent-light'
                        }`}>
                          {item.type || 'Hệ thống'}
                        </span>
                        {!item.isRead && (
                          <span className="size-2 rounded-full bg-accent" title="Chưa đọc" />
                        )}
                      </div>
                      <p className="mb-1 mt-1 text-xs text-white leading-relaxed">{item.content}</p>
                      <span className="text-[10px] text-zinc-400">{timeAgo(item.sentAt)}</span>
                    </li>
                  ))
                )}
              </ul>
              <Link to="/settings" onClick={() => setOpenMenu('')} className="mt-3 block text-center text-xs font-bold text-accent-light hover:underline">
                Cài đặt thông báo
              </Link>
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
              <Link to="/profile" onClick={() => setOpenMenu('')} className="block rounded px-3 py-3 text-xs text-white hover:bg-white/5">
                Thông tin cá nhân
              </Link>
              {(user?.roles?.includes('Customer') || user?.roles?.includes('Developer')) ? (
                <Link to="/wallet" onClick={() => setOpenMenu('')} className="block rounded px-3 py-3 text-xs text-white hover:bg-white/5">
                  Ví
                </Link>
              ) : null}
              {user?.roles?.includes('Customer') ? (
                <Link to="/orders" onClick={() => setOpenMenu('')} className="block rounded px-3 py-3 text-xs text-white hover:bg-white/10">
                  Lịch sử đơn hàng
                </Link>
              ) : null}
              {user?.roles?.includes('Customer') && !user?.roles?.includes('Developer') ? (
                <Link to="/developer/register" onClick={() => setOpenMenu('')} className="block rounded px-3 py-3 text-xs text-violet-200 hover:bg-violet-500/10">
                  Đăng ký nhà phát hành
                </Link>
              ) : null}
              <Link to="/settings" onClick={() => setOpenMenu('')} className="block rounded px-3 py-3 text-xs text-white hover:bg-white/5">
                Cài đặt
              </Link>
              {user ? (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full text-left block rounded px-3 py-3 text-xs text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
                >
                  Đăng xuất
                </button>
              ) : (
                <>
                  <Link to="/register" onClick={() => setOpenMenu('')} className="block rounded px-3 py-3 text-xs text-white hover:bg-white/5">
                    Đăng ký
                  </Link>
                  <Link to="/login" onClick={() => setOpenMenu('')} className="block rounded px-3 py-3 text-xs text-white hover:bg-white/5">
                    Đăng nhập
                  </Link>
                </>
              )}
            </nav>
          ) : null}
        </div>
      </div>
    </div>
  );
}
