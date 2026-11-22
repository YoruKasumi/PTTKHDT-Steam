# Steam Store - Frontend (React + Vite + Tailwind CSS)

Giao diện người dùng nền tảng Vortex Gaming xây dựng trên nền **React 18**, **Vite 5** và **Tailwind CSS v4** (`@tailwindcss/vite`), thiết kế theo phong cách hiện đại với tông màu tối (#080213) và màu nhấn tím (#7053e1).

---

## 1. Cấu trúc mã nguồn

```text
frontend/
├── Dockerfile              # Multi-stage build (Node 22 -> Nginx Alpine)
├── nginx.conf              # Reverse proxy cho /api, /api-docs và SPA fallback
├── package.json            # Scripts: dev, build, preview
├── index.html              # Template HTML gốc
└── src/
    ├── api/                # Lớp gọi HTTP API (Axios instance http.js kèm Interceptors)
    │   ├── auth.js         # API Đăng ký (OTP), Đăng nhập, Đăng xuất, Quên mật khẩu
    │   ├── catalog.js      # API Danh mục, Tìm kiếm, Lọc, Chi tiết game, Đánh giá
    │   ├── cart.js         # API Giỏ hàng, Áp mã coupon
    │   ├── library.js      # API Thư viện game, Khởi chạy game (DRM Launch)
    │   ├── order.js        # API Thanh toán, Lịch sử đơn hàng, Hoàn tiền
    │   ├── wallet.js       # API Ví điện tử, Nạp tiền ví
    │   ├── developer.js    # API Đăng game, Cập nhật build, Tạo key, Rút doanh thu
    │   └── admin.js        # API Kiểm duyệt game, Duyệt rút tiền, Quản lý tài khoản
    ├── components/         # Header, TopBar, Footer, GameCard, Modals, RouteGuard
    ├── context/            # ShopContext quản lý đăng nhập, giỏ hàng, số dư ví, thông báo
    ├── pages/              # Màn hình theo tuyến đường (Route)
    │   ├── Home.jsx        # Trang chủ: Carousel game sale, game nổi bật, banner
    │   ├── CatalogSearch.jsx # Tìm kiếm nâng cao, bộ lọc thể loại/giá/sale
    │   ├── GameDetail.jsx  # Chi tiết game, trailer video, thông số cấu hình, mua/thêm giỏ
    │   ├── Library.jsx     # Thư viện game sở hữu, khởi chạy game trong iframe DRM
    │   ├── Cart.jsx        # Xem giỏ hàng, áp dụng coupon, chuyển sang checkout
    │   ├── Orders.jsx      # Lịch sử đơn hàng, yêu cầu hoàn tiền từng game trong 24h
    │   ├── Profile.jsx     # Hồ sơ người dùng, cập nhật thông tin cá nhân
    │   ├── auth/           # Màn hình Đăng nhập, Đăng ký (kèm nút Gửi OTP), Quên mật khẩu
    │   ├── wallet/         # Ví điện tử, nạp tiền, lịch sử giao dịch
    │   ├── developer/      # Cổng thông tin Nhà phát hành: đăng game, upload build, rút tiền
    │   └── admin/          # Bảng điều khiển Quản trị viên: duyệt game, duyệt rút tiền, khóa tài khoản
    ├── styles/             # global.css (Tailwind @theme: màu sắc, font Inter, bo góc)
    └── utils/              # Tiện ích: định dạng tiền tệ, ngày tháng, helper
```

---

## 2. Hướng dẫn chạy cục bộ (Local Development)

### Cài đặt dependencies và chạy dev server
```powershell
cd frontend
npm install
npm run dev
```
- Giao diện mở tại: `http://localhost:5173`
- Trong file `vite.config.js`, các request `/api` tự động được chuyển tiếp (proxy) sang backend tại `http://localhost:3000`.

### Kiểm tra biên dịch Production
```powershell
npm run build
```
Bản build tối ưu hóa sẽ được xuất ra thư mục `dist/`.

---

## 3. Hệ thống Theme & Màu sắc (Tailwind CSS v4)

Khai báo biến trong khối `@theme` tại `src/styles/global.css`:

| Tên biến CSS | Mã màu HEX | Mục đích sử dụng |
|---|---|---|
| `bg-page` | `#080213` | Nền trang chính |
| `bg-card` | `#0b0910` | Nền khối card, header, thanh điều hướng |
| `bg-panel` | `#130f1c` | Nền sidebar, modal, bảng dữ liệu phụ |
| `text-accent` / `bg-accent` | `#7053e1` | Màu tím thương hiệu, nút CTA, điểm nhấn |
| `bg-success` | `#1ca52c` | Nhãn Free, trạng thái kích hoạt, thành công |
| `border-line` | `#231c36` | Đường kẻ phân cách, viền input |

---

## 4. Tích hợp Backend & Xử lý lỗi

- **Xác thực tự động**: `src/api/http.js` tự động gắn JWT Bearer Token lấy từ `localStorage` hoặc `sessionStorage` vào tất cả các yêu cầu gửi đi.
- **Xử lý phản hồi**: Backend trả về định dạng chuẩn `{ success, message, data }`. Response Interceptor tự động bóc tách trả về `data`, đồng thời chuẩn hóa thông báo lỗi thân thiện hiển thị trên giao diện người dùng.
