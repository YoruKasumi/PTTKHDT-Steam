import { NavLink } from 'react-router-dom';
import { useShop } from '../../context/ShopContext';

const links = [
  { to: '/admin/accounts', label: 'Tài khoản', permission: 'account.moderate', adminOnly: false },
  { to: '/admin/coupons', label: 'Mã giảm giá', adminOnly: false },
  { to: '/admin/staff', label: 'Nhân sự', adminOnly: true },
  { to: '/admin/rbac', label: 'Phân quyền', adminOnly: true },
  { to: '/admin/reviews', label: 'Đánh giá', permission: 'review.moderate', adminOnly: false },
  { to: '/moderation/community', label: 'Cộng đồng', permission: 'community.moderate', adminOnly: false },
  { to: '/finance/overview', label: 'Tài chính', permission: 'finance.read', adminOnly: false },
  { to: '/admin/genres-banners', label: 'Thể loại & banner', permission: ['genres.manage', 'banners.manage'], adminOnly: false },
  { to: '/admin/audit-logs', label: 'Nhật ký', adminOnly: true },
  { to: '/admin/games', label: 'Kiểm duyệt game', permission: 'game.approve', adminOnly: false },
  { to: '/admin/system-config', label: 'Cấu hình', adminOnly: true },
];

export default function AdminShell({ title, description, children }) {
  const { user } = useShop();
  const currentUser = user || {};
  const roles = currentUser.roles || [];
  const permissions = currentUser.permissions || [];
  const isAdmin = roles.includes('Admin');
  const visibleLinks = links.filter((link) => (
    (isAdmin || (!link.adminOnly && (link.permission === undefined
      || (Array.isArray(link.permission)
        ? link.permission.some((permission) => permissions.includes(permission))
        : permissions.includes(link.permission)))))
  ));

  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 pb-20 pt-10 md:px-8">
      <div className="pt-2">
        <h1 className="m-0 text-2xl font-extrabold md:text-3xl">{title}</h1>
        <p className="mb-0 mt-2 max-w-3xl text-sm text-muted">{description}</p>
      </div>

      <nav aria-label="Điều hướng quản trị" className="my-5 flex gap-2 overflow-x-auto rounded-xl border border-white/10 bg-card p-2">
        {visibleLinks.map((link) => (
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
