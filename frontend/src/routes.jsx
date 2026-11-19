import Home from './pages/Home';
import ScreenPlaceholder from './pages/ScreenPlaceholder';
import Cart from './pages/cart/Cart';
import Wallet from './pages/wallet/Wallet';
import Settings from './pages/settings/Settings';
import DeveloperRegistration from './pages/developer/DeveloperRegistration';
import DeveloperProfile from './pages/developer/DeveloperProfile';
import DeveloperGames from './pages/developer/DeveloperGames';
import DeveloperKeys from './pages/developer/DeveloperKeys';
import DeveloperRevenue from './pages/developer/DeveloperRevenue';
import AdminAccounts from './pages/admin/AdminAccounts';
import AdminKeyApprovals from './pages/admin/AdminKeyApprovals';
import Wishlist from './pages/Wishlist';
import Library from './pages/Library';
import GameDetail from './pages/GameDetail';
import Orders from './pages/Orders';
import WalletTransactions from './pages/wallet/WalletTransactions';

// Danh mục route và metadata Figma; các màn hình đã dựng được ánh xạ ở routes bên dưới.
export const pendingScreens = [
  { path: "/search", title: "Bộ lọc tìm kiếm game", node: "90:29", uc: "UC6 CatalogService" },
  { path: "/search/results", title: "Kết quả tìm kiếm", node: "169:2", uc: "UC6 CatalogService" },
  { path: "/games/:id", title: "Chi tiết sản phẩm", node: "168:2", uc: "UC7 CatalogService" },
  { path: "/cart", title: "Giỏ hàng", node: "94:1576", uc: "UC8-10 CartService; UC15 OrderService" },
  { path: "/library", title: "Thư viện", node: "1:485", uc: "UC16-19 LibraryService" },
  { path: "/wishlist", title: "Wishlist", node: "1:551", uc: "UC11 WishlistService" },
  { path: "/profile", title: "Hồ sơ cá nhân", node: "1:607", uc: "UC4-5 ProfileService, AuthService" },
  { path: "/wallet", title: "Ví và số dư", node: "1:643", uc: "UC12-14 WalletService" },
  { path: "/wallet/transactions", title: "Biến động ví", node: "143:2", uc: "UC20 WalletService" },
  { path: "/orders", title: "Đơn hàng và hoàn tiền", node: "139:2", uc: "UC15, UC21 OrderService" },
  { path: "/settings", title: "Cài đặt ứng dụng", node: "1:686", uc: "UC22 NotificationService" },
  { path: "/login", title: "Đăng nhập", node: "8:240", uc: "UC2 AuthService" },
  { path: "/register", title: "Đăng ký", node: "8:284", uc: "UC1 AuthService" },
  { path: "/forgot-password", title: "Quên mật khẩu", node: "44:2", uc: "chưa có trong sequence" },
  { path: "/developer/register", title: "Đăng ký Developer và kích hoạt Key", node: "141:2", uc: "UC23 DeveloperService" },
  { path: "/developer/revenue", title: "Doanh thu và rút tiền", node: "93:769", uc: "UC30, UC33 ReportService, WithdrawalService" },
  { path: "/developer/games", title: "Dự án game", node: "91:331", uc: "UC25-26, UC34-36 GameService" },
  { path: "/developer/patches", title: "Bản vá", node: "94:1083", uc: "UC24, UC29 GameService" },
  { path: "/developer/keys", title: "Sinh mã Key", node: "94:1262", uc: "UC28 PromotionService" },
  { path: "/developer/profile", title: "Hồ sơ Developer", node: "163:477", uc: "UC23, UC37 DeveloperService" },
  { path: "/admin/accounts", title: "Kiểm soát tài khoản", node: "127:2", uc: "UC42, 44, 45 AccountService" },
  { path: "/admin/games", title: "Kiểm duyệt phát hành game", node: "146:2", uc: "UC38-41 ModerationService" },
  { path: "/admin/keys", title: "Phê duyệt kích hoạt Key", node: "146:44", uc: "chưa có trong sequence" },
  { path: "/admin/withdrawals", title: "Duyệt rút doanh thu", node: "146:66", uc: "UC57 WithdrawalService" },
  { path: "/admin/system-config", title: "Cấu hình hệ thống", node: "147:2", uc: "UC58 SystemConfigService" },
  { path: "/admin/rbac", title: "Ma trận phân quyền", node: "147:42", uc: "UC59 RbacService" },
  { path: "/admin/staff", title: "Quản lý nhân sự", node: "147:110", uc: "UC61-63 StaffService" },
];

export const routes = [
  { path: '/', element: <Home /> },
  ...pendingScreens
    .filter((screen) => !['/login', '/register', '/forgot-password'].includes(screen.path))
    .map((screen) => ({
      path: screen.path,
      element: {
        '/cart': <Cart />,
        '/wallet': <Wallet />,
        '/wallet/transactions': <WalletTransactions />,
        '/settings': <Settings />,
        '/games/:id': <GameDetail />,
        '/library': <Library />,
        '/wishlist': <Wishlist />,
        '/orders': <Orders />,
        '/developer/register': <DeveloperRegistration />,
        '/developer/profile': <DeveloperProfile />,
        '/developer/games': <DeveloperGames />,
        '/developer/keys': <DeveloperKeys />,
        '/developer/revenue': <DeveloperRevenue />,
        '/admin/accounts': <AdminAccounts />,
        '/admin/keys': <AdminKeyApprovals />,
      }[screen.path] ?? <ScreenPlaceholder screen={screen} />,
    })),
];
