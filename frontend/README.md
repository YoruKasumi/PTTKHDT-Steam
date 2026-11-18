# Steam Store - Frontend (React + Vite + Tailwind)

Dựng từ file Figma `0Uj10YZiDvKJfhEU3yO1dL` (giao diện tối, màu nhấn tím `#7053e1`, font Inter).

## Chạy thử

```bash
npm install
npm run assets     # tải ảnh và icon từ Figma vào public/assets (liên kết Figma sống 7 ngày)
npm run dev        # http://localhost:5173, /api được proxy sang backend cổng 3000
```

## Tailwind

Dùng Tailwind v4 qua plugin Vite (`@tailwindcss/vite`), không cần `tailwind.config.js`. Màu, font và bo góc của thiết kế khai báo trong khối `@theme` của `src/styles/global.css`:

| Class | Giá trị | Dùng cho |
|---|---|---|
| `bg-page` | `#080213` | nền trang |
| `bg-card` | `#0b0910` | khối, header |
| `bg-topbar` | `#000` | thanh trên cùng |
| `text-accent`, `bg-accent`, `border-accent` | `#7053e1` | màu nhấn |
| `bg-success` | `#1ca52c` | nhãn Free |
| `rounded-section` | 40px | khối lớn |

Cần đổi tông màu thì sửa một chỗ trong `@theme`.

## Trạng thái

- Đã dựng: khung chung (thanh trên, header, tìm kiếm) và màn hình **Home**.
- Chưa dựng: 27 màn hình còn lại. Mỗi màn hình có route sẵn và hiện trang tạm kèm node Figma (xem `src/routes.jsx`).
- Dữ liệu Home đang là dữ liệu giả (`src/data/mockGames.js`); lớp gọi API ở `src/api/`, tên hàm khớp sơ đồ sequence và route backend.
- Banner dùng shader của Figma (`@figma/expressive-components`), cần trình duyệt hỗ trợ WebGPU (Chrome, Edge mới).
