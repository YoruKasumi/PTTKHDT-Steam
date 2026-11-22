# Vortex Gaming (PTTKHDT - Steam Store)

Nền tảng phân phối trò chơi trực tuyến toàn diện, xây dựng theo kiến trúc hướng đối tượng và mô hình 3 tầng (**Route + Service + DAO**). Dự án mô phỏng đầy đủ các phân hệ cốt lõi của Steam: Cửa hàng (Store/Catalog), Giỏ hàng & Thanh toán (Cart & Checkout), Thư viện bản quyền & Kích hoạt game (Library & DRM Launch), Ví điện tử & Hoàn tiền (Wallet & Refund 24h), Kênh nhà phát hành (Developer Portal), Kiểm duyệt & Quản trị hệ thống (Admin & Moderation).

---

## 1. Kiến trúc hệ thống

```mermaid
flowchart TD
    Client["Client / Trình duyệt (SPA React + Vite)"] -->|Port 5173 / HTTP| Nginx["Nginx Reverse Proxy (Frontend Container)"]
    Nginx -->|SPA Static Files| HTML["dist/ (HTML, JS, CSS, Assets)"]
    Nginx -->|/api/* và /api-docs/*| Backend["Node.js / Express (Backend Container)"]
    Backend -->|Tầng 1: Routes & Middlewares| MW["JWT Auth / RBAC / Upload / Error Handler"]
    MW -->|Tầng 2: Services (Business Logic)| Svc["23 Business Services (Transactions, Locks, OTP, DRM)"]
    Svc -->|Tầng 3: Data Access Objects| DAO["19 DAOs (Prepared Statements, Parameterized SQL)"]
    DAO -->|MySQL Protocol / Port 3306| DB[("MySQL 8.0 Server (steam_store Database)")]
    Backend -->|/api/media/*| Media["Assets & Uploads (Ảnh cover, Trailer, File game)"]
```

### Các công nghệ chủ đạo
- **Frontend**: React 18, Vite 5, Tailwind CSS v4 (`@tailwindcss/vite`), Axios, React Router v6, Lucide Icons.
- **Backend**: Node.js (>=18), Express 4.19, MySQL2 (Connection Pool & Transaction Runner), JWT (`jsonwebtoken`), Bcryptjs, Nodemailer (SMTP OTP), Swagger UI (OpenAPI 3.0), Multer, Adm-zip.
- **Cơ sở dữ liệu**: MySQL 8.0 (InnoDB, UTF8mb4, collation `utf8mb4_unicode_ci`).
- **Triển khai**: Docker & Docker Compose đa dịch vụ, tối ưu hóa Nginx reverse proxy.

---

## 2. Cấu trúc thư mục dự án

```text
PTTKHDT-Steam/
├── docker-compose.yml          # Điều phối 3 container: steam-frontend, steam-backend, steam-db
├── .env.docker                 # Cấu hình biến môi trường cho Docker Compose
├── .env.docker.example         # Mẫu cấu hình môi trường Docker
├── backend/
│   ├── Dockerfile              # Dockerfile backend (Node 22 Alpine, production-ready)
│   ├── package.json            # Scripts: test, dev, db:schema, db:sample, db:bootstrap-demo
│   ├── sql/
│   │   ├── steam_store_schema.sql       # 30 bảng, 1 view V_GAME_PRICE, toàn bộ ràng buộc FK/Check
│   │   └── steam_store_sample_data.sql  # Dữ liệu mẫu (35 game, tài khoản demo, ví, đánh giá, banner)
│   ├── assets/public/games/    # Ảnh bìa (cover) và trailer video chuẩn hóa theo slug game
│   ├── storage/                # Thư mục lưu trữ cục bộ (uploads tạm, builds file zip game)
│   ├── tests/                  # Bộ 151 unit tests tự động (node --test)
│   └── src/
│       ├── server.js           # Khởi động server HTTP & Suspension Expiry Background Job
│       ├── app.js              # Cấu hình Express, Helmet CSP, CORS, Media Static, Swagger UI
│       ├── config/             # database.js (Pool, withTransaction), env.js
│       ├── routes/             # Định nghĩa REST endpoints theo từng phân hệ
│       ├── middlewares/        # auth.js (JWT, RBAC), upload.js, errorHandler.js
│       ├── services/           # Nghiệp vụ: AuthService, OrderService, LibraryService, etc.
│       ├── dao/                # Truy vấn dữ liệu: GameDAO, OrderDAO, LicenseDAO, etc.
│       └── utils/              # mailer, otpStore, tokenRevocation, response, autoDrmPackager
├── frontend/
│   ├── Dockerfile              # Multi-stage build (Node 22 build -> Nginx Alpine serve)
│   ├── nginx.conf              # Cấu hình reverse proxy /api, /api-docs, /health và SPA fallback
│   ├── package.json            # Vite build, preview, dependencies
│   └── src/
│       ├── api/                # Axios HTTP client, bọc API catalog, auth, cart, library, wallet
│       ├── components/         # Header, TopBar, Footer, GameCard, Modals, RouteGuard
│       ├── context/            # ShopContext quản lý đăng nhập, giỏ hàng, số dư ví, thông báo
│       └── pages/              # Home, CatalogSearch, GameDetail, Library, Cart, Orders, Admin, Developer
└── docs/                       # Tài liệu thiết kế ca sử dụng (Use Cases) & Checklist dữ liệu
```

---

## 3. Luồng xử lý chi tiết (Flow Architecture)

### 3.1. Luồng Backend (Kiến trúc 3 tầng chuẩn)
1. **Tầng Route & Middleware** (`src/routes/`, `src/middlewares/`):
   - Nhận request từ client, xác thực chữ ký JWT Bearer (`auth.authenticate`) và kiểm tra trạng thái token có bị thu hồi trong blacklist không (`tokenRevocation`).
   - Kiểm tra phân quyền truy cập theo vai trò (`auth.authorize('Admin', 'Staff', 'Developer', 'Customer')`).
   - Thu thập tham số qua helper `requestContext(req)` chuẩn hóa (query, params, body, files, user).
   - Gọi phương thức nghiệp vụ tương ứng ở Tầng Service.
2. **Tầng Service (Business Logic)** (`src/services/`):
   - Thực thi các quy tắc nghiệp vụ: kiểm tra số dư ví, xác thực mã OTP qua SMTP, tính toán cửa sổ hoàn tiền 24 giờ, tính tỷ lệ hoa hồng sàn, ký JWT DRM launch token.
   - Quản lý transaction an toàn bằng `withTransaction(async (conn) => { ... })`: tự động `beginTransaction`, `commit` khi thành công và `rollback` khi xảy ra lỗi.
   - Hỗ trợ khóa bi quan (Pessimistic Lock `SELECT ... FOR UPDATE`) khi cập nhật số dư ví hoặc duyệt đơn rút tiền.
   - Tự động kích hoạt thông báo nội bộ (`NotificationService`) và nhật ký kiểm toán (`AuditLogService`).
3. **Tầng DAO (Data Access Object)** (`src/dao/`):
   - Thực thi các câu lệnh SQL thuần được tối ưu hóa, sử dụng Prepared Statements (`?`) chống SQL Injection 100%.
   - Nhận tham số kết nối `conn` tùy chọn để tham gia vào transaction của tầng Service.
   - Chuẩn hóa kiểu dữ liệu đầu ra: boolean từ `TINYINT(1)`, kiểu số nguyên/thực từ `DECIMAL`.

### 3.2. Luồng Frontend (SPA Client)
1. **Khởi tạo và Điều hướng**:
   - `App.jsx` và `routes.jsx` quản lý toàn bộ các tuyến đường.
   - `RouteGuard.jsx` bảo vệ các route nhạy cảm theo vai trò: chuyển hướng đến trang `/login` nếu chưa đăng nhập hoặc chặn truy cập nếu tài khoản không đủ quyền hạn.
2. **Quản lý phiên & Trạng thái người dùng**:
   - `ShopContext.jsx` lưu trữ `user`, `token`, vai trò `roles`. Khi người dùng đăng nhập hoặc F5 lại trang, context tự động đồng bộ từ `localStorage` / `sessionStorage`.
   - Nút **Đăng xuất** gọi API `/api/auth/guiYeuCauDangXuat` để đưa JTI của JWT vào danh sách thu hồi trên Redis/RAM backend, sau đó xóa sạch token tại client và điều hướng về trang đăng nhập.
3. **Tương tác API**:
   - `src/api/http.js` cấu hình Axios với `baseURL = import.meta.env.VITE_API_URL || '/api'`.
   - Mọi request tự động gắn `Authorization: Bearer <token>`.
   - Mọi response thành công tự động giải nén dữ liệu `res.data.data`. Mọi response lỗi được định dạng thành Error Object chứa đầy đủ `code`, `message`, `status`.

---

## 4. Hướng dẫn chạy bằng Docker Desktop

Triển khai trọn gói toàn bộ hệ thống bằng Docker Compose chỉ với một lệnh duy nhất. Hệ thống hiển thị rõ ràng trên giao diện Docker Desktop thành nhóm project **`pttkhdt-steam`** gồm 3 container độc lập:
- **`steam-frontend`**: Web giao diện React, lắng nghe cổng **5173**.
- **`steam-backend`**: Máy chủ API Node.js, lắng nghe cổng **3000**.
- **`steam-db`**: Cơ sở dữ liệu MySQL 8.0, ánh xạ cổng máy chủ **3307**.

### Bước 1: Chuẩn bị file cấu hình môi trường
Từ thư mục gốc dự án, tạo file `.env.docker` (nếu chưa có):
```powershell
Copy-Item .env.docker.example .env.docker
```
Nội dung chuẩn của `.env.docker`:
```dotenv
MYSQL_ROOT_PASSWORD=270106
MYSQL_DATABASE=steam_store
MYSQL_USER=steam_app
MYSQL_PASSWORD=270106
JWT_SECRET=steam-store-jwt-secret-key-32chars-min!
```

### Bước 2: Khởi động hệ thống bằng Docker Compose
Chạy lệnh sau tại thư mục gốc dự án:
```powershell
docker compose --env-file .env.docker up --build -d
```

### Bước 3: Kiểm tra trạng thái và truy cập ứng dụng
Sau khi các container đạt trạng thái **`healthy`**:
- **Trang chủ Cửa hàng (Frontend)**: [http://localhost:5173](http://localhost:5173)
- **Tài liệu Swagger UI (API Docs)**: [http://localhost:5173/api-docs](http://localhost:5173/api-docs) (hoặc trực tiếp tại [http://localhost:3000/api-docs](http://localhost:3000/api-docs))
- **Kiểm tra trạng thái kết nối MySQL**: [http://localhost:5173/health/database](http://localhost:5173/health/database)
- **Danh sách game trả về từ API**: [http://localhost:5173/api/catalog/games](http://localhost:5173/api/catalog/games)

### Bước 4: Lệnh quản lý Docker thường dùng
- **Xem nhật ký hoạt động (Logs)**:
  ```powershell
  docker compose logs -f
  ```
- **Dừng stack (giữ lại dữ liệu database)**:
  ```powershell
  docker compose --env-file .env.docker down
  ```
- **Xóa sạch và tạo lại database từ đầu (khi muốn nạp lại seed data mới)**:
  ```powershell
  docker compose --env-file .env.docker down -v
  docker compose --env-file .env.docker up --build -d
  ```

---

## 5. Hướng dẫn chạy thủ công trên máy cục bộ (Không dùng Docker)

### 5.1. Khởi tạo Cơ sở dữ liệu MySQL
1. Yêu cầu cài đặt MySQL Server 8.0+ đang chạy tại cổng `3306`.
2. Tạo database và nạp schema + seed data bằng 2 file SQL duy nhất trong thư mục `backend/sql/`:
   ```powershell
   Get-Content backend/sql/steam_store_schema.sql -Raw | & "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p
   Get-Content backend/sql/steam_store_sample_data.sql -Raw | & "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p
   ```

### 5.2. Khởi chạy Backend
1. Chuyển vào thư mục backend và cài đặt dependencies:
   ```powershell
   cd backend
   npm install
   ```
2. Cấu hình file `backend/.env` (tham khảo `backend/.env.example`):
   ```dotenv
   PORT=3000
   NODE_ENV=development
   CORS_ORIGIN=http://localhost:5173
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=mat_khau_mysql_cua_ban
   DB_NAME=steam_store
   JWT_SECRET=chuoi-bi-mat-jwt-it-nhat-32-ky-tu!
   ```
3. Tạo tài khoản quản trị viên và tài khoản kiểm thử:
   ```powershell
   npm run db:bootstrap-demo
   ```
4. Khởi động backend ở chế độ phát triển:
   ```powershell
   npm run dev
   ```

### 5.3. Khởi chạy Frontend
1. Chuyển vào thư mục frontend và cài đặt dependencies:
   ```powershell
   cd ../frontend
   npm install
   ```
2. Khởi chạy máy chủ phát triển Vite:
   ```powershell
   npm run dev
   ```
   Ứng dụng sẽ khả dụng tại [http://localhost:5173](http://localhost:5173).

---

## 6. Kiểm thử và Xác nhận chất lượng (Testing & Verification)

- **Chạy toàn bộ 151 Unit Tests Backend**:
  ```powershell
  npm --prefix backend test
  ```
  *(151/151 tests pass 100%, bao gồm kiểm thử bảo mật JWT, phân quyền RBAC, transaction ví, quy tắc hoàn tiền 24h, xác thực OTP qua SMTP, và điều kiện khởi chạy DRM).*

- **Kiểm tra biên dịch Frontend cho môi trường Production**:
  ```powershell
  npm --prefix frontend run build
  ```
  *(Biên dịch thành công mã nguồn tối ưu hóa trong thư mục `frontend/dist`).*

---

## 7. Tài khoản dùng thử hệ thống (Demo Accounts)

Sau khi nạp dữ liệu từ `steam_store_sample_data.sql` hoặc chạy `npm run db:bootstrap-demo`:

| Vai trò | Tên đăng nhập | Email | Quyền hạn & Chức năng kiểm thử |
|---|---|---|---|
| **Khách hàng (Customer)** | `minhanh` | `minhanh@gmail.com` | Duyệt game, giỏ hàng, nạp tiền ví, thanh toán đơn, mở game trong Thư viện, gửi yêu cầu hoàn tiền |
| **Khách hàng (Customer)** | `baotran` | `baotran@gmail.com` | Đánh giá sản phẩm, quản lý danh sách yêu thích (Wishlist) |
| **Nhà phát triển (Developer)** | `nvh_studio` | `contact@nvhstudio.vn` | Đăng bán game, quản lý phiên bản build, tạo Activation Key, gửi yêu cầu rút doanh thu |
| **Kiểm duyệt viên (Staff)** | `mod_lan` | `lan.kiemduyet@steamstore.vn` | Duyệt/Từ chối game chờ duyệt, kiểm duyệt đánh giá cộng đồng |
| **Quản trị viên (Admin)** | `demo_admin` | `demo.admin@example.test` | Duyệt chi tiền rút về ngân hàng, quản lý tài khoản vi phạm, cấu hình thông số sàn, thống kê doanh thu |

*(Lưu ý: Mật khẩu của tài khoản `minhanh`, `baotran`, `nvh_studio`, `mod_lan` được cung cấp trong môi trường demo nội bộ; mật khẩu tài khoản `demo_admin` được in ra màn hình khi chạy lệnh `npm run db:bootstrap-demo`).*
