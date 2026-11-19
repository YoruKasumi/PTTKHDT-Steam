# Steam Store - Frontend (React + Vite + Tailwind)

Dựng từ file Figma `0Uj10YZiDvKJfhEU3yO1dL` (giao diện tối, màu nhấn tím `#7053e1`, font Inter).

## Chạy thử

```bash
npm install
npm run build      # kiểm tra biên dịch production
npm run dev        # http://localhost:5173, /api được proxy sang backend cổng 3000
npm run preview    # chạy thử bản build production
```

Chạy các lệnh trên trong thư mục `frontend`. Nếu muốn tải lại ảnh/icon từ Figma, chạy `npm run assets` trong môi trường có Bash; script dùng liên kết Figma có thời hạn.

## Cấu trúc mã nguồn

```text
src/
├─ api/                   # các lời gọi HTTP
├─ components/
│  ├─ auth/                # layout và field đăng nhập/đăng ký
│  ├─ cart/                # thành phần giỏ hàng
│  ├─ common/              # thành phần dùng chung, icon
│  └─ ...                  # header, banner, carousel, layout
├─ context/                # trạng thái giỏ hàng, ví, wishlist
├─ data/                   # dữ liệu mẫu và coupon
├─ pages/                  # màn hình theo route
├─ styles/                 # CSS toàn cục và theme Tailwind
└─ utils/                  # định dạng và hàm tiện ích
```

## Tailwind

Dùng Tailwind v4 qua plugin Vite (`@tailwindcss/vite`), không cần `tailwind.config.js`. Màu, font và bo góc của thiết kế khai báo trong khối `@theme` của `src/styles/global.css`:

| Class | Giá trị | Dùng cho |
|---|---|---|
| `bg-page` | `#080213` | nền trang |
| `bg-card` | `#0b0910` | khối, header |
| `bg-panel`, `bg-field`, `border-line` | các màu nền/viền phụ | form và khối phụ |
| `bg-topbar` | `#000` | thanh trên cùng |
| `text-accent`, `bg-accent`, `border-accent` | `#7053e1` | màu nhấn |
| `bg-success` | `#1ca52c` | nhãn Free |
| `rounded-section` | 40px | khối lớn |

Cần đổi tông màu thì sửa một chỗ trong `@theme`.

## Trạng thái

- Đã dựng: khung chung, **Home**, **Đăng nhập/Đăng ký/Quên mật khẩu**, **Wishlist**, **Thư viện**, **Chi tiết game**, **Giỏ hàng**, **Ví/Lịch sử giao dịch**, **Đơn hàng/Hóa đơn/Hoàn tiền**, **Cài đặt**, các màn hình Developer và màn hình Admin kiểm soát tài khoản/duyệt mã Key.
- Các form Developer, ví, cài đặt, lịch sử đơn hàng và Admin hiện dùng dữ liệu mẫu phía frontend; chưa kết nối API hoặc thực hiện thanh toán, gửi OTP hay hoàn tiền thật.
- Những màn hình chưa dựng còn lại hiện trang tạm kèm node Figma (xem `src/routes.jsx`).
- Dữ liệu Home đang là dữ liệu giả (`src/data/mockGames.js`); lớp gọi API ở `src/api/`, tên hàm khớp sơ đồ sequence và route backend.
- Banner dùng shader của Figma (`@figma/expressive-components`), cần trình duyệt hỗ trợ WebGPU (Chrome, Edge mới).
