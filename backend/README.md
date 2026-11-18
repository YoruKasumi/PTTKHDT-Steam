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

```bash
npm install
cp .env.example .env        # sửa DB_PASSWORD, JWT_SECRET
npm run db:schema          # tạo CSDL (MySQL 8.0.16+)
npm run db:extra           # bảng BANNER, SYSTEM_PARAMETER
npm run db:sample          # dữ liệu mẫu (tùy chọn)
npm run dev
```

Kiểm tra: `GET http://localhost:3000/health`. Các API có dạng `/api/<service>/<tenHamTrongSequence>`, ví dụ `POST /api/auth/guiThongTinDangKy`.

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
