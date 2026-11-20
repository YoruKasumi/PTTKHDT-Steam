# Steam Store - Backend (3 tầng)

Khung backend Node.js / Express / MySQL theo kiến trúc 3 tầng: **Route + Service (Business Logic)** → **DAO (Data Access)** → **MySQL**.
Tên phương thức trong `services/`, `dao/`, `integrations/` lấy đúng từ các sơ đồ sequence. Nội dung hàm chưa cài đặt (ném `NotImplementedException`); mỗi hàm có chú thích liệt kê luồng theo sơ đồ.

## Cấu trúc thư mục

```
backend/
├─ package.json, .env.example, .gitignore
├─ sql/                          steam_store_schema.sql, steam_store_sample_data.sql, extra_tables.sql
├─ docs/                         sequence_method_map.md, frontend_handlers.md, needs_review.md
├─ storage/                      uploads/ (tạm), builds/ (file game khi dùng driver local)
├─ tests/
└─ src/
   ├─ server.js, app.js
   ├─ config/                    env.js, database.js (pool + withTransaction), storage.js
   ├─ routes/                    *.routes.js  ┐
   ├─ middlewares/               auth.js (JWT, phân quyền), upload.js, errorHandler.js  ┘ Business Logic: Route
   ├─ services/                  23 *Service + BaseService + index.js   (Business Logic)
   ├─ exceptions/                NghiepVuException, Forbidden, NotFound, NotImplemented
   ├─ dao/                       19 *DAO + BaseDAO                      (Data Access)
   ├─ integrations/              StorageClient, PaymentGatewayClient, BankClient
   └─ utils/                     asyncHandler, response, requestContext, password, token
```

## Chạy thử

### Cài MySQL và kết nối backend trên Windows

Backend dùng **MySQL Server 8.0.16 trở lên**. MySQL Workbench chỉ là ứng dụng giao diện để quản lý/chạy SQL; cài Workbench một mình chưa có MySQL Server để backend kết nối. Cài và khởi động dịch vụ MySQL Server trước, thường có tên dịch vụ `MySQL80`.

Mở PowerShell tại thư mục backend:

```powershell
cd D:\Code\PTTKHDT-Steam\backend
Copy-Item .env.example .env
notepad .env
```

Trong `.env`, đặt thông tin trùng với MySQL Server đang chạy:

```dotenv
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=mat_khau_root_cua_mysql
DB_NAME=steam_store
```

`PORT=3000` là cổng HTTP của backend; `DB_PORT=3306` là cổng MySQL. Đây là hai cổng khác nhau. Không commit file `.env` hoặc gửi mật khẩu database lên chat.

Sau khi lưu `.env`, tạo database và các bảng:

```powershell
npm install
npm run db:schema
npm run db:extra
npm run db:sample
```

`db:sample` là tùy chọn nếu cần dữ liệu mẫu. **Cẩn thận:** `sql/steam_store_schema.sql` xóa và tạo lại các bảng trong `steam_store`; chỉ chạy trên database mới hoặc sau khi đã sao lưu dữ liệu cần giữ. Các lệnh `db:*` dùng MySQL CLI (`mysql`) và cần MySQL `bin` có trong `PATH`. Có thể thay bằng Workbench: kết nối `localhost:3306` với user MySQL của bạn, mở file SQL tương ứng trong thư mục `sql/`, rồi Execute.

Khởi động backend:

```powershell
npm run dev
```

Mở Swagger UI tại **http://localhost:3000/api-docs**. OpenAPI JSON ở `http://localhost:3000/api-docs/openapi.json`; kiểm tra backend bằng `/health` và MySQL bằng `/health/database`. Swagger chỉ được bật khi `NODE_ENV` không phải `production`.

Các API có yêu cầu đăng nhập cần Bearer JWT trong Swagger nút **Authorize**.

### Chạy tự động bằng npm

```bash
npm install
cp .env.example .env
npm run db:schema
npm run db:extra
npm run db:sample
npm run dev
```

Khối lệnh trên dùng cú pháp `cp` của Bash; với PowerShell dùng các lệnh Windows trong phần trước. Đặt `BOOTSTRAP_ADMIN_USERNAME`, `BOOTSTRAP_ADMIN_EMAIL`, `BOOTSTRAP_ADMIN_DISPLAY_NAME`, `BOOTSTRAP_ADMIN_PASSWORD` trong môi trường rồi chạy `npm run db:bootstrap-admin` nếu cần tạo Admin đầu tiên.

Các API có dạng `/api/<service>/<tenHamTrongSequence>`, ví dụ `POST /api/auth/guiThongTinDangKy`. Xem danh sách và thử request tại Swagger UI.

`db:bootstrap-admin` không nhận mật khẩu qua tham số dòng lệnh, không có mật khẩu mặc định và chỉ chạy khi bảng `ADMIN` trống hoặc chứa đúng tài khoản mẫu A001 đang bị vô hiệu hóa. Không ghi các biến `BOOTSTRAP_ADMIN_*` vào SQL hay commit chúng. Nếu bỏ qua dữ liệu mẫu, có thể chạy lệnh bootstrap ngay sau `db:extra`; nếu đã nạp sample, script sẽ đặt thông tin đăng nhập mới cho A001.

Để tạo hai tài khoản phát triển tạm thời (Admin và Staff/Manager) với mật khẩu ngẫu nhiên, sau khi đã tạo schema, chạy `npm run db:bootstrap-demo`. Lệnh chỉ dùng ngoài production, chỉ tạo nếu username/email demo chưa tồn tại và in thông tin đăng nhập một lần ra terminal. Lưu lại mật khẩu; chạy lại sẽ không ghi đè các tài khoản trước đó.

Đăng ký Customer yêu cầu `username`, `email`, `displayName`, `password` và OTP 4 chữ số. Trong môi trường không phải production, OTP `0000` mô phỏng thất bại; OTP 4 chữ số khác mô phỏng xác minh thành công. Đây chỉ là luồng thử nghiệm, không gửi email/SMS; production bị chặn cho đến khi tích hợp nhà cung cấp OTP thật.

Đăng nhập nhận `account` (username hoặc email) và `password`, trả JWT cùng vai trò để dùng qua Swagger **Authorize**. Mật khẩu lưu dưới dạng bcrypt hash.

## Quy ước

- **Route** chỉ nhận request, gọi đúng một hàm Service và trả JSON; không chứa nghiệp vụ.
- **Service** kiểm tra quy định nghiệp vụ, điều phối transaction (`this.transaction(async (conn) => ...)`), ném `NghiepVuException` khi vi phạm.
- **DAO** chỉ chứa SQL; hàm ghi nhận thêm tham số `conn` để chạy trong transaction của Service.
- Thông điệp phía giao diện (`chon...`, `nhap...`, `hienThi...`) nằm trong `docs/frontend_handlers.md`, dùng cho bước frontend.
- Lời gọi giữa các service được gắn trong `services/index.js` (ví dụ `moderationService.auditLogService`).

## Danh sách service

| Service | Use case | Hàm public (UI gọi) | Hàm nội bộ | DAO chính |
|---|---|---|---|---|
| AuthService | UC1, UC2, UC3, UC5, UC12 | 4 | 4 | AccountDAO |
| ProfileService | UC4 | 2 | 0 | AccountDAO |
| CatalogService | UC6, UC7 | 8 | 0 | GameDAO |
| CartService | UC8, UC9, UC10 | 3 | 2 | CartDAO |
| GameService | UC9, UC11, UC15, UC24, UC25, UC26, UC29, UC34, UC35, UC36 | 11 | 2 | GameDAO |
| WishlistService | UC11 | 2 | 0 | WishlistDAO |
| WalletService | UC12, UC13, UC14, UC15, UC20, UC21 | 7 | 0 | WalletDAO |
| OrderService | UC15, UC21 | 3 | 0 | OrderDAO |
| LibraryService | UC16, UC17, UC18, UC19 | 3 | 3 | LicenseDAO |
| NotificationService | UC22 | 2 | 0 | NotificationDAO |
| DeveloperService | UC23 | 2 | 0 | DeveloperDAO |
| PromotionService | UC27, UC28 | 2 | 4 | PromotionDAO |
| ReportService | UC30, UC31, UC32 | 3 | 4 | ReportDAO |
| WithdrawalService | UC33, UC57 | 4 | 1 | WithdrawalDAO |
| ModerationService | UC38, UC39, UC40, UC41, UC43, UC47 | 9 | 1 | ModerationDAO |
| AuditLogService | UC39, UC40, UC41, UC43, UC44, UC45, UC58, UC59, UC60, UC61, UC62 | 4 | 2 | AuditLogDAO |
| AccountService | UC42, UC44, UC45 | 3 | 0 | AccountDAO |
| GenreService | UC48 | 3 | 0 | GenreDAO |
| BannerService | UC49 | 1 | 1 | BannerDAO |
| FinanceService | UC50, UC51, UC52, UC53, UC54, UC55, UC56 | 7 | 7 | ReportDAO |
| SystemConfigService | UC58 | 2 | 2 | SystemConfigDAO |
| RbacService | UC59 | 2 | 2 | RoleDAO |
| StaffService | UC61, UC62 | 3 | 1 | StaffDAO |

Xem thêm `docs/needs_review.md` để biết các điểm cần đối chiếu với sơ đồ.
