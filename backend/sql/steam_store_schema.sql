-- =====================================================================
-- STEAM STORE - Lược đồ MySQL 8.0.16+  (cần 8.0.16 trở lên để CHECK có hiệu lực)
-- Dựa trên MoTaThietKeDuLieu (bản gốc 28 bảng); bản này có 29 bảng (thêm LICENSE_DEVICE) và 39 khóa ngoại.
-- BANNER và SYSTEM_PARAMETER được tạo bởi extra_tables.sql.
-- Các chỗ sửa / bổ sung được đánh dấu [SỬA] và [THÊM].
-- Chạy:  mysql -u root -p < steam_store_schema.sql
-- =====================================================================
CREATE DATABASE IF NOT EXISTS steam_store
  DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE steam_store;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS SYSTEM_PARAMETER, BANNER, GAMEREVIEW, AUDITLOG, NOTIFICATION, WITHDRAWALREQUEST, `TRANSACTION`, WALLET,
  REFUNDREQUEST, REVIEW, WISHLISTITEM, LICENSE_DEVICE, LICENSE, ORDERITEM, ORDERS, COUPON, CARTITEM, CART,
  SALECAMPAIGN, ACTIVATIONKEY, GAMEVERSION, GAME_GENRE, GENRE, GAME, MANAGER, ROLE_PERMISSION, `ROLE`,
  ADMIN, DEVELOPER, CUSTOMER, ACCOUNT;
DROP VIEW IF EXISTS V_GAME_PRICE;
SET FOREIGN_KEY_CHECKS = 1;

-- ---------------------------------------------------------------------
-- CỤM 1: TÀI KHOẢN VÀ PHÂN QUYỀN
-- ---------------------------------------------------------------------
CREATE TABLE ACCOUNT (
  AccountID     CHAR(36)     NOT NULL DEFAULT (UUID()),
  Username      VARCHAR(30)  NOT NULL,
  PasswordHash  VARCHAR(255) NOT NULL,                -- bcrypt
  Email         VARCHAR(100) NOT NULL,
  DisplayName   VARCHAR(50)  NOT NULL,
  AvatarUrl     VARCHAR(255) NULL,
  Status        ENUM('Active','Suspended','Banned') NOT NULL DEFAULT 'Active',
  NotifyEnabled TINYINT(1)   NOT NULL DEFAULT 1,
  CreatedAt     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (AccountID),
  UNIQUE KEY uq_account_username (Username),
  UNIQUE KEY uq_account_email (Email)
) ENGINE=InnoDB;

-- [SỬA] Một tài khoản ĐƯỢC PHÉP có cả dòng CUSTOMER lẫn DEVELOPER (khách hàng đăng ký làm nhà
-- phát hành, trả phí bằng ví). Bảng không cấm điều này; việc "đúng một vai trò" chỉ áp cho nhóm nội bộ
-- (MANAGER / ADMIN) và do tầng BLL kiểm tra.
CREATE TABLE CUSTOMER (
  AccountID CHAR(36) NOT NULL,
  PRIMARY KEY (AccountID),
  CONSTRAINT fk_customer_account FOREIGN KEY (AccountID) REFERENCES ACCOUNT(AccountID)
) ENGINE=InnoDB;

CREATE TABLE DEVELOPER (
  AccountID    CHAR(36)     NOT NULL,
  CompanyName  VARCHAR(150) NOT NULL,
  BankAccount  VARCHAR(50)  NULL,
  FeePaid      TINYINT(1)   NOT NULL DEFAULT 0,
  VerifyStatus ENUM('Pending','Verified','Rejected') NOT NULL DEFAULT 'Pending',
  PRIMARY KEY (AccountID),
  CONSTRAINT fk_developer_account FOREIGN KEY (AccountID) REFERENCES ACCOUNT(AccountID)
) ENGINE=InnoDB;

CREATE TABLE ADMIN (
  AccountID CHAR(36) NOT NULL,
  PRIMARY KEY (AccountID),
  CONSTRAINT fk_admin_account FOREIGN KEY (AccountID) REFERENCES ACCOUNT(AccountID)
) ENGINE=InnoDB;

CREATE TABLE `ROLE` (
  RoleID    CHAR(36)    NOT NULL DEFAULT (UUID()),
  RoleName  VARCHAR(50) NOT NULL,
  ManagedBy CHAR(36)    NOT NULL,
  PRIMARY KEY (RoleID),
  UNIQUE KEY uq_role_name (RoleName),
  CONSTRAINT fk_role_admin FOREIGN KEY (ManagedBy) REFERENCES ADMIN(AccountID)
) ENGINE=InnoDB;

CREATE TABLE ROLE_PERMISSION (
  RoleID         CHAR(36)    NOT NULL,
  PermissionCode VARCHAR(50) NOT NULL,                -- ví dụ game.approve
  PRIMARY KEY (RoleID, PermissionCode),
  CONSTRAINT fk_roleperm_role FOREIGN KEY (RoleID) REFERENCES `ROLE`(RoleID) ON DELETE CASCADE
) ENGINE=InnoDB;

-- [SỬA] Thêm RoleID: bản gốc có ROLE và ROLE_PERMISSION nhưng không có khóa ngoại nào gán vai trò cho
-- ai, nên phân quyền RBAC không dùng được. Đây là một trong 6 khóa ngoại mới (33 -> 39).
CREATE TABLE MANAGER (
  AccountID CHAR(36) NOT NULL,
  RoleID    CHAR(36) NOT NULL,
  PRIMARY KEY (AccountID),
  CONSTRAINT fk_manager_account FOREIGN KEY (AccountID) REFERENCES ACCOUNT(AccountID),
  CONSTRAINT fk_manager_role    FOREIGN KEY (RoleID)    REFERENCES `ROLE`(RoleID)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- CỤM 2: DANH MỤC GAME
-- ---------------------------------------------------------------------
CREATE TABLE GAME (
  GameID      CHAR(36)      NOT NULL DEFAULT (UUID()),
  DeveloperID CHAR(36)      NOT NULL,
  Title       VARCHAR(200)  NOT NULL,
  Slug        VARCHAR(120)  NULL,
  Description TEXT          NOT NULL,
  Price       DECIMAL(15,2) NOT NULL,
  CoverImage  VARCHAR(255)  NOT NULL,
  TrailerUrl  VARCHAR(255)  NULL,
  MinSpec     VARCHAR(500)  NOT NULL,
  RecSpec     VARCHAR(500)  NOT NULL,
  Status      ENUM('Pending','Approved','Rejected','Delisted','Hidden') NOT NULL DEFAULT 'Pending',
  ReleaseDate DATETIME      NULL,
  PRIMARY KEY (GameID),
  UNIQUE KEY uq_game_title (Title),
  UNIQUE KEY uq_game_slug (Slug),
  KEY idx_game_status (Status),
  CONSTRAINT fk_game_developer FOREIGN KEY (DeveloperID) REFERENCES DEVELOPER(AccountID),
  CONSTRAINT ck_game_price CHECK (Price >= 0)
) ENGINE=InnoDB;

CREATE TABLE GENRE (
  GenreID     CHAR(36)    NOT NULL DEFAULT (UUID()),
  GenreName   VARCHAR(80) NOT NULL,
  Description VARCHAR(500) NULL,
  PRIMARY KEY (GenreID),
  UNIQUE KEY uq_genre_name (GenreName)
) ENGINE=InnoDB;

CREATE TABLE GAME_GENRE (
  GameID  CHAR(36) NOT NULL,
  GenreID CHAR(36) NOT NULL,
  PRIMARY KEY (GameID, GenreID),
  CONSTRAINT fk_gg_game  FOREIGN KEY (GameID)  REFERENCES GAME(GameID)   ON DELETE CASCADE,
  CONSTRAINT fk_gg_genre FOREIGN KEY (GenreID) REFERENCES GENRE(GenreID) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE GAMEVERSION (
  VersionID     CHAR(36)    NOT NULL DEFAULT (UUID()),
  GameID        CHAR(36)    NOT NULL,
  VersionNumber VARCHAR(20) NOT NULL,
  BuildFile     VARCHAR(255) NOT NULL,                -- object key private: developers/<DeveloperID>/games/<GameID>/<version>/build.zip
  FileSize      BIGINT      NULL,                     -- [THÊM] byte, để hiện dung lượng và kiểm tra tải đủ
  Sha256        CHAR(64)    NULL,                     -- [THÊM] checksum để client kiểm tra tệp không bị sửa
  ChangeLog     TEXT        NULL,
  UploadDate    DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  IsCurrent     TINYINT(1)  NOT NULL DEFAULT 0,
  -- [SỬA] ép "mỗi game chỉ một bản hiện hành": cột sinh tự động mang GameID khi IsCurrent=1, NULL khi =0;
  -- UNIQUE bỏ qua NULL nên chỉ có tối đa một dòng IsCurrent=1 mỗi game. Khi đổi bản: UPDATE bản cũ = 0 TRƯỚC.
  CurrentGameID CHAR(36) GENERATED ALWAYS AS (IF(IsCurrent = 1, GameID, NULL)) STORED,
  PRIMARY KEY (VersionID),
  UNIQUE KEY uq_version_per_game (GameID, VersionNumber),   -- [SỬA] bản gốc UNIQUE toàn cục là sai
  UNIQUE KEY uq_one_current_per_game (CurrentGameID),
  CONSTRAINT fk_version_game FOREIGN KEY (GameID) REFERENCES GAME(GameID)
) ENGINE=InnoDB;

CREATE TABLE ACTIVATIONKEY (
  KeyID         CHAR(36)    NOT NULL DEFAULT (UUID()),
  KeyCode       VARCHAR(40) NOT NULL,
  GameID        CHAR(36)    NOT NULL,
  Status        ENUM('Unused','Used','Revoked') NOT NULL DEFAULT 'Unused',
  CreatedDate   DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ActivatedDate DATETIME    NULL,
  RedeemedBy    CHAR(36)    NULL,                     -- [THÊM] ai đã đổi mã (để đối soát / chống khiếu nại)
  PRIMARY KEY (KeyID),
  UNIQUE KEY uq_key_code (KeyCode),
  KEY idx_key_game_status (GameID, Status),
  CONSTRAINT fk_key_game     FOREIGN KEY (GameID)     REFERENCES GAME(GameID),
  CONSTRAINT fk_key_customer FOREIGN KEY (RedeemedBy) REFERENCES CUSTOMER(AccountID)
) ENGINE=InnoDB;

CREATE TABLE SALECAMPAIGN (
  CampaignID CHAR(36) NOT NULL DEFAULT (UUID()),
  GameID     CHAR(36) NOT NULL,
  PercentOff INT      NOT NULL,
  StartDate  DATETIME NOT NULL,
  EndDate    DATETIME NOT NULL,
  PRIMARY KEY (CampaignID),
  KEY idx_sale_window (GameID, StartDate, EndDate),
  CONSTRAINT fk_sale_game FOREIGN KEY (GameID) REFERENCES GAME(GameID),
  CONSTRAINT ck_sale_percent CHECK (PercentOff BETWEEN 1 AND 100),
  CONSTRAINT ck_sale_dates   CHECK (EndDate > StartDate)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- CỤM 3: MUA BÁN VÀ SỞ HỮU
-- ---------------------------------------------------------------------
CREATE TABLE CART (
  CustomerID CHAR(36) NOT NULL,
  PRIMARY KEY (CustomerID),
  CONSTRAINT fk_cart_customer FOREIGN KEY (CustomerID) REFERENCES CUSTOMER(AccountID)
) ENGINE=InnoDB;

CREATE TABLE CARTITEM (
  CustomerID CHAR(36)      NOT NULL,
  GameID     CHAR(36)      NOT NULL,
  PriceAtAdd DECIMAL(15,2) NOT NULL,
  PRIMARY KEY (CustomerID, GameID),
  CONSTRAINT fk_ci_cart FOREIGN KEY (CustomerID) REFERENCES CART(CustomerID) ON DELETE CASCADE,
  CONSTRAINT fk_ci_game FOREIGN KEY (GameID)     REFERENCES GAME(GameID),
  CONSTRAINT ck_ci_price CHECK (PriceAtAdd >= 0)
) ENGINE=InnoDB;

-- [SỬA] Bản gốc COUPON không có chủ sở hữu, nên chức năng "Developer tạo mã khuyến mãi" không thể
-- liệt kê / giới hạn mã theo nhà phát triển. Thêm DeveloperID, GameID (NULL = mọi game của developer).
CREATE TABLE COUPON (
  CouponID      CHAR(36)      NOT NULL DEFAULT (UUID()),
  Code          VARCHAR(30)   NOT NULL,
  DiscountValue DECIMAL(15,2) NOT NULL,
  ExpiryDate    DATETIME      NOT NULL,
  UsageLimit    INT           NOT NULL,
  UsedCount     INT           NOT NULL DEFAULT 0,
  DeveloperID   CHAR(36)      NULL,                   -- NULL = mã do sàn phát hành
  GameID        CHAR(36)      NULL,
  PRIMARY KEY (CouponID),
  UNIQUE KEY uq_coupon_code (Code),
  CONSTRAINT fk_coupon_developer FOREIGN KEY (DeveloperID) REFERENCES DEVELOPER(AccountID),
  CONSTRAINT fk_coupon_game      FOREIGN KEY (GameID)      REFERENCES GAME(GameID),
  CONSTRAINT ck_coupon_value CHECK (DiscountValue > 0),
  CONSTRAINT ck_coupon_limit CHECK (UsageLimit > 0),
  CONSTRAINT ck_coupon_used  CHECK (UsedCount <= UsageLimit)
) ENGINE=InnoDB;

CREATE TABLE ORDERS (
  OrderID     CHAR(36)      NOT NULL DEFAULT (UUID()),
  CustomerID  CHAR(36)      NOT NULL,
  CouponID    CHAR(36)      NULL,
  OrderDate   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  TotalAmount DECIMAL(15,2) NOT NULL,                 -- = SUM(ORDERITEM.PriceAfterDiscount); coupon đã được chia vào từng dòng
  Status      ENUM('Completed','Refunded') NOT NULL DEFAULT 'Completed',
  PRIMARY KEY (OrderID),
  KEY idx_orders_customer_date (CustomerID, OrderDate),
  CONSTRAINT fk_orders_customer FOREIGN KEY (CustomerID) REFERENCES CUSTOMER(AccountID),
  CONSTRAINT fk_orders_coupon   FOREIGN KEY (CouponID)   REFERENCES COUPON(CouponID),
  CONSTRAINT ck_orders_total CHECK (TotalAmount >= 0)
) ENGINE=InnoDB;

CREATE TABLE ORDERITEM (
  OrderID            CHAR(36)      NOT NULL,
  GameID             CHAR(36)      NOT NULL,
  UnitPrice          DECIMAL(15,2) NOT NULL,
  PriceAfterDiscount DECIMAL(15,2) NOT NULL,
  PRIMARY KEY (OrderID, GameID),
  KEY idx_oi_game (GameID),
  CONSTRAINT fk_oi_order FOREIGN KEY (OrderID) REFERENCES ORDERS(OrderID),
  CONSTRAINT fk_oi_game  FOREIGN KEY (GameID)  REFERENCES GAME(GameID),
  CONSTRAINT ck_oi_unit  CHECK (UnitPrice >= 0),
  CONSTRAINT ck_oi_after CHECK (PriceAfterDiscount >= 0 AND PriceAfterDiscount <= UnitPrice)
) ENGINE=InnoDB;

-- [SỬA] Bản gốc UNIQUE(CustomerID, GameID) khiến khách KHÔNG mua lại được game sau khi hoàn tiền
-- (dòng Revoked vẫn chiếm chỗ). Thay bằng ràng buộc chỉ áp lên bản quyền đang Active.
-- AccessToken: lưu SHA-256 (hex) của chuỗi ngẫu nhiên, không lưu bản rõ.
CREATE TABLE LICENSE (
  LicenseID    CHAR(36)     NOT NULL DEFAULT (UUID()),
  CustomerID   CHAR(36)     NOT NULL,
  GameID       CHAR(36)     NOT NULL,
  Source       ENUM('Purchase','Key') NOT NULL DEFAULT 'Purchase',  -- [THÊM] mua hay đổi mã
  PurchaseDate DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  AccessToken  VARCHAR(255) NOT NULL,
  Status       ENUM('Active','Revoked') NOT NULL DEFAULT 'Active',
  RevokedAt    DATETIME     NULL,                     -- [THÊM]
  ActiveKey    VARCHAR(80) GENERATED ALWAYS AS
               (IF(Status = 'Active', CONCAT(CustomerID, '|', GameID), NULL)) STORED,
  PRIMARY KEY (LicenseID),
  UNIQUE KEY uq_license_token (AccessToken),
  UNIQUE KEY uq_license_active (ActiveKey),
  KEY idx_license_game (GameID),
  CONSTRAINT fk_license_customer FOREIGN KEY (CustomerID) REFERENCES CUSTOMER(AccountID),
  CONSTRAINT fk_license_game     FOREIGN KEY (GameID)     REFERENCES GAME(GameID)
) ENGINE=InnoDB;

-- [THÊM] Ràng buộc bản quyền với thiết bị để hạn chế chia sẻ tài khoản / sao chép game (xem giải thích DRM).
CREATE TABLE LICENSE_DEVICE (
  DeviceID          CHAR(36)    NOT NULL DEFAULT (UUID()),
  LicenseID         CHAR(36)    NOT NULL,
  DeviceFingerprint CHAR(64)    NOT NULL,             -- SHA-256 của mã máy do launcher sinh
  DeviceName        VARCHAR(100) NULL,
  FirstSeen         DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  LastSeen          DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  Status            ENUM('Active','Revoked') NOT NULL DEFAULT 'Active',
  PRIMARY KEY (DeviceID),
  UNIQUE KEY uq_license_device (LicenseID, DeviceFingerprint),
  CONSTRAINT fk_ld_license FOREIGN KEY (LicenseID) REFERENCES LICENSE(LicenseID)
) ENGINE=InnoDB;

CREATE TABLE WISHLISTITEM (
  CustomerID CHAR(36) NOT NULL,
  GameID     CHAR(36) NOT NULL,
  AddedDate  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (CustomerID, GameID),
  CONSTRAINT fk_wl_customer FOREIGN KEY (CustomerID) REFERENCES CUSTOMER(AccountID) ON DELETE CASCADE,
  CONSTRAINT fk_wl_game     FOREIGN KEY (GameID)     REFERENCES GAME(GameID)
) ENGINE=InnoDB;

CREATE TABLE REVIEW (
  ReviewID   CHAR(36)      NOT NULL DEFAULT (UUID()),
  CustomerID CHAR(36)      NOT NULL,
  GameID     CHAR(36)      NOT NULL,
  Rating     INT           NOT NULL,
  Content    VARCHAR(1000) NOT NULL,
  ReviewDate DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  Status     ENUM('Visible','Hidden','Removed') NOT NULL DEFAULT 'Visible',
  PRIMARY KEY (ReviewID),
  UNIQUE KEY uq_review_once (CustomerID, GameID),     -- [SỬA] mỗi khách một đánh giá cho mỗi game
  KEY idx_review_game (GameID, Status),
  CONSTRAINT fk_review_customer FOREIGN KEY (CustomerID) REFERENCES CUSTOMER(AccountID),
  CONSTRAINT fk_review_game     FOREIGN KEY (GameID)     REFERENCES GAME(GameID),
  CONSTRAINT ck_review_rating CHECK (Rating BETWEEN 1 AND 5)
) ENGINE=InnoDB;

-- [SỬA] Bỏ CHECK (HoursSincePurchase <= 24): với CHECK đó không thể lưu yêu cầu bị TỪ CHỐI vì quá 24 giờ.
-- BLL tự kiểm tra 24 giờ và ghi Rejected.
CREATE TABLE REFUNDREQUEST (
  RequestID          CHAR(36)     NOT NULL DEFAULT (UUID()),
  OrderID            CHAR(36)     NOT NULL,
  Reason             VARCHAR(500) NOT NULL,
  RequestDate        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  Status             ENUM('Pending','Approved','Rejected') NOT NULL DEFAULT 'Pending',
  HoursSincePurchase INT          NOT NULL,
  PRIMARY KEY (RequestID),
  KEY idx_refund_order (OrderID),
  CONSTRAINT fk_refund_order FOREIGN KEY (OrderID) REFERENCES ORDERS(OrderID),
  CONSTRAINT ck_refund_hours CHECK (HoursSincePurchase >= 0)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- CỤM 4: TÀI CHÍNH
-- ---------------------------------------------------------------------
CREATE TABLE WALLET (
  WalletID   CHAR(36)      NOT NULL DEFAULT (UUID()),
  CustomerID CHAR(36)      NOT NULL,
  Balance    DECIMAL(15,2) NOT NULL DEFAULT 0,
  Currency   CHAR(3)       NOT NULL DEFAULT 'VND',
  PRIMARY KEY (WalletID),
  UNIQUE KEY uq_wallet_customer (CustomerID),
  CONSTRAINT fk_wallet_customer FOREIGN KEY (CustomerID) REFERENCES CUSTOMER(AccountID),
  CONSTRAINT ck_wallet_balance CHECK (Balance >= 0)
) ENGINE=InnoDB;

-- [SỬA] Thêm loại 'Fee' (phí Steam Direct) và OrderID để biết giao dịch Purchase / Refund thuộc đơn nào.
-- Đơn 0 đồng không tạo giao dịch vì Amount phải > 0.
CREATE TABLE `TRANSACTION` (
  TransID   CHAR(36)      NOT NULL DEFAULT (UUID()),
  WalletID  CHAR(36)      NOT NULL,
  OrderID   CHAR(36)      NULL,
  Type      ENUM('Deposit','Withdraw','Purchase','Refund','Fee') NOT NULL,
  Amount    DECIMAL(15,2) NOT NULL,
  TransDate DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  Status    ENUM('Success','Failed','Pending') NOT NULL DEFAULT 'Success',
  PRIMARY KEY (TransID),
  KEY idx_trans_wallet_date (WalletID, TransDate),
  CONSTRAINT fk_trans_wallet FOREIGN KEY (WalletID) REFERENCES WALLET(WalletID),
  CONSTRAINT fk_trans_order  FOREIGN KEY (OrderID)  REFERENCES ORDERS(OrderID),
  CONSTRAINT ck_trans_amount CHECK (Amount > 0)
) ENGINE=InnoDB;

-- Doanh thu khả dụng của developer KHÔNG lưu cột riêng, tính bằng:
--   SUM(ORDERITEM.PriceAfterDiscount của game do dev phát hành, đơn Completed)
--   - SUM(WITHDRAWALREQUEST.Amount với Status IN ('Pending','Approved'))   -- Pending = tiền đang tạm giữ
CREATE TABLE WITHDRAWALREQUEST (
  RequestID   CHAR(36)      NOT NULL DEFAULT (UUID()),
  DeveloperID CHAR(36)      NOT NULL,
  Amount      DECIMAL(15,2) NOT NULL,
  BankInfo    VARCHAR(100)  NOT NULL,
  Status      ENUM('Pending','Approved','Rejected') NOT NULL DEFAULT 'Pending',
  RequestDate DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (RequestID),
  KEY idx_wd_dev (DeveloperID, Status),
  CONSTRAINT fk_wd_developer FOREIGN KEY (DeveloperID) REFERENCES DEVELOPER(AccountID),
  CONSTRAINT ck_wd_amount CHECK (Amount > 0)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- CỤM 5: VẬN HÀNH VÀ KIỂM DUYỆT
-- ---------------------------------------------------------------------
CREATE TABLE NOTIFICATION (
  NotificationID CHAR(36)      NOT NULL DEFAULT (UUID()),
  AccountID      CHAR(36)      NOT NULL,
  Type           VARCHAR(30)   NOT NULL,
  Content        VARCHAR(1000) NOT NULL,
  SentAt         DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  IsRead         TINYINT(1)    NOT NULL DEFAULT 0,
  PRIMARY KEY (NotificationID),
  KEY idx_notif_account (AccountID, IsRead),
  CONSTRAINT fk_notif_account FOREIGN KEY (AccountID) REFERENCES ACCOUNT(AccountID)
) ENGINE=InnoDB;

CREATE TABLE AUDITLOG (
  LogID     CHAR(36)     NOT NULL DEFAULT (UUID()),
  AccountID CHAR(36)     NOT NULL,
  Action    VARCHAR(100) NOT NULL,
  Target    VARCHAR(200) NOT NULL,
  LogAt     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  Detail    TEXT         NULL,
  PRIMARY KEY (LogID),
  KEY idx_audit_account (AccountID, LogAt),
  CONSTRAINT fk_audit_account FOREIGN KEY (AccountID) REFERENCES ACCOUNT(AccountID)
) ENGINE=InnoDB;

-- Ánh xạ Decision -> GAME.Status: Approved->Approved, Rejected->Rejected, EmergencyDelist->Delisted.
-- Gợi ý: nên đổi tên GAMEREVIEW thành GAMEMODERATION để khỏi lẫn với REVIEW (đánh giá của khách).
CREATE TABLE GAMEREVIEW (
  CheckID   CHAR(36)     NOT NULL DEFAULT (UUID()),
  GameID    CHAR(36)     NOT NULL,
  ManagerID CHAR(36)     NOT NULL,
  Decision  ENUM('Approved','Rejected','EmergencyDelist') NOT NULL,
  Reason    VARCHAR(500) NULL,
  CheckedAt DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (CheckID),
  KEY idx_gr_game (GameID, CheckedAt),
  CONSTRAINT fk_gr_game    FOREIGN KEY (GameID)    REFERENCES GAME(GameID),
  CONSTRAINT fk_gr_manager FOREIGN KEY (ManagerID) REFERENCES MANAGER(AccountID),
  CONSTRAINT ck_gr_reason CHECK (Decision <> 'Rejected' OR (Reason IS NOT NULL AND Reason <> ''))
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- VIEW: giá hiện hành (đã trừ sale đang chạy). Dùng cho tìm kiếm / chi tiết / thanh toán.
-- ---------------------------------------------------------------------
CREATE VIEW V_GAME_PRICE AS
SELECT g.GameID,
       g.Price AS BasePrice,
       COALESCE(MAX(s.PercentOff), 0) AS PercentOff,
       ROUND(g.Price * (100 - COALESCE(MAX(s.PercentOff), 0)) / 100, 0) AS CurrentPrice
FROM GAME g
LEFT JOIN SALECAMPAIGN s
       ON s.GameID = g.GameID AND NOW() BETWEEN s.StartDate AND s.EndDate
GROUP BY g.GameID, g.Price;

-- Dữ liệu mẫu (thể loại, tài khoản, game, đơn hàng...) nằm trong steam_store_sample_data.sql.
