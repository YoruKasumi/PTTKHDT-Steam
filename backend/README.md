# Steam Store - Backend (3 tầng)

Kiến trúc backend Node.js / Express / MySQL theo đúng chuẩn 3 tầng: **Route + Middleware** → **Service (Business Logic)** → **DAO (Data Access Object)** → **MySQL**.

---

## 1. Cấu trúc thư mục

```text
backend/
├── package.json, .env.example, .gitignore
├── sql/
│   ├── steam_store_schema.sql       # Toàn bộ 30 bảng, 1 view, khóa ngoại, chỉ mục
│   └── steam_store_sample_data.sql  # Dữ liệu mẫu (35 games, ví, tài khoản demo, banner)
├── assets/public/games/             # Ảnh cover và trailer game phục vụ qua /api/media
├── storage/                         # Lưu trữ cục bộ (uploads tạm, builds file zip game)
├── tests/                           # Bộ 151 unit tests tự động (node --test)
├── scripts/                         # bootstrap-demo-accounts.js, bootstrap-admin.js
└── src/
    ├── server.js, app.js
    ├── config/                      env.js, database.js (pool + withTransaction)
    ├── routes/                      *.routes.js (Tầng Route)
    ├── middlewares/                 auth.js (JWT, RBAC), upload.js, errorHandler.js
    ├── services/                    23 Services (Tầng Nghiệp vụ)
    ├── exceptions/                  NghiepVuException, Forbidden, NotFound, Conflict
    ├── dao/                         19 DAOs (Tầng Truy vấn Dữ liệu)
    ├── integrations/                BankClient, PaymentGatewayClient, StorageClient
    └── utils/                       mailer, otpStore, tokenRevocation, response, autoDrmPackager
```

---

## 2. Hướng dẫn cài đặt và chạy cục bộ (Local Development)

### Yêu cầu tiên quyết
- **Node.js**: Phiên bản 18 trở lên (khuyến nghị Node.js 20 hoặc 22).
- **MySQL Server**: Phiên bản 8.0.16 trở lên.

### Các bước thực hiện
1. **Cấu hình môi trường**:
   ```powershell
   cd backend
   Copy-Item .env.example .env
   ```
   Cập nhật thông tin MySQL và bí mật JWT trong `.env`:
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

2. **Cài đặt thư viện và khởi tạo cơ sở dữ liệu**:
   ```powershell
   npm install
   npm run db:schema
   npm run db:sample
   ```

3. **Khởi tạo tài khoản phát triển (Admin & Staff demo)**:
   ```powershell
   npm run db:bootstrap-demo
   ```

4. **Tạo lại build demo bị thiếu**:
   ```powershell
   npm run db:repair-demo-builds
   ```
   Lệnh này chỉ tạo archive cho các phiên bản demo đã duyệt nhưng thiếu file trong storage; không thay đổi tài khoản, đơn hàng hay bản quyền.

5. **Chạy kiểm thử (Unit Tests)**:
   ```powershell
   npm test
   ```
   *(Toàn bộ 151 test cases phải pass 100%).*

6. **Khởi động server phát triển**:
   ```powershell
   npm run dev
   ```
   - Server lắng nghe tại: `http://localhost:3000`
   - Tài liệu OpenAPI / Swagger UI: `http://localhost:3000/api-docs`
   - Kiểm tra trạng thái máy chủ: `http://localhost:3000/health`
   - Kiểm tra kết nối MySQL: `http://localhost:3000/health/database`

---

## 3. Quy ước thiết kế 3 tầng

- **Route & Middleware**: Chỉ tiếp nhận HTTP request, xác thực JWT, kiểm tra phân quyền vai trò (RBAC), trích xuất tham số qua `requestContext(req)`, gọi đúng phương thức Service và trả kết quả dưới dạng JSON chuẩn. Không chứa logic nghiệp vụ.
- **Service**: Kiểm tra toàn bộ quy tắc nghiệp vụ (Business Rules), điều phối transaction (`withTransaction`), sử dụng pessimistic lock (`FOR UPDATE`) khi cần thiết, gửi thông báo (`NotificationService`), ghi nhật ký kiểm toán (`AuditLogService`), ném ngoại lệ chuẩn khi vi phạm.
- **DAO**: Chỉ chứa các câu lệnh SQL thuần túy (Prepared Statements với tham số `?` để ngăn chặn triệt để SQL Injection). Hỗ trợ nhận `conn` để chạy trong transaction của Service.
- **Chuẩn phản hồi API**:
  - Thành công: `{ success: true, message: '...', data: ... }`
  - Thất bại: `{ success: false, code: '...', message: '...', details?: ... }`

---

## 4. Danh sách các dịch vụ nghiệp vụ (Services)

| Service | Nghiệp vụ cốt lõi | DAO chính |
|---|---|---|
| **AuthService** | Đăng ký (OTP SMTP thật), Đăng nhập (JWT), Đăng xuất (Thu hồi JTI), Quên mật khẩu | AccountDAO |
| **CatalogService** | Tìm kiếm sản phẩm, Lọc theo thể loại/giá/sale, Sắp xếp, Chi tiết game | GameDAO |
| **CartService** | Thêm/xóa giỏ hàng, Kiểm tra bản quyền trùng lặp | CartDAO |
| **GameService** | Quản lý game, Upload ảnh bìa/trailer, Đóng gói DRM tự động | GameDAO |
| **WishlistService** | Danh sách game yêu thích, Chặn thêm game đã sở hữu | WishlistDAO |
| **WalletService** | Nạp tiền vào ví, Rút tiền, Ghi nhật ký biến động số dư | WalletDAO |
| **OrderService** | Thanh toán đơn hàng (Checkout), Yêu cầu hoàn tiền trong 24 giờ | OrderDAO |
| **LibraryService** | Thư viện game người dùng, Khởi chạy game (Ký DRM Launch Token), Verify token | LicenseDAO |
| **NotificationService** | Gửi và đánh dấu đã đọc thông báo hệ thống | NotificationDAO |
| **DeveloperService** | Quản lý thông tin nhà phát hành, Thu phí đăng ký NPH | DeveloperDAO |
| **PromotionService** | Quản lý chiến dịch giảm giá (Sale Campaign), Áp dụng Coupon | PromotionDAO |
| **ReportService** | Báo cáo doanh thu thời gian thực, Kết xuất bảng kê bán hàng | ReportDAO |
| **WithdrawalService** | Yêu cầu rút doanh thu của NPH, Chuyển khoản ngân hàng (BankClient), Khóa dòng bi quan | WithdrawalDAO |
| **ModerationService** | Kiểm duyệt game đăng bán, Duyệt/Từ chối đánh giá cộng đồng | ModerationDAO |
| **AuditLogService** | Ghi nhận nhật ký kiểm toán hành động quản trị | AuditLogDAO |
| **AccountService** | Khóa/Mở khóa tài khoản người dùng, Tự động hết hạn tạm khóa theo giờ | AccountDAO |
| **FinanceService** | Thống kê doanh số, Báo cáo tài chính, Tỷ lệ hoa hồng sàn | ReportDAO |
| **SystemConfigService** | Quản lý thông số cấu hình hệ thống (Dynamic Parameters) | SystemConfigDAO |
| **RbacService / StaffService** | Phân quyền vai trò quản trị, Quản lý tài khoản nhân viên | RoleDAO, StaffDAO |
