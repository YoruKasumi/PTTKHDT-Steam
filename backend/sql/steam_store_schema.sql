-- =====================================================================
-- STEAM STORE - LƯỢC ĐỒ CƠ SỞ DỮ LIỆU CHUẨN (MySQL 8.0.16+)
-- Kiến trúc 3 tầng: Route -> Service -> DAO
-- Bao gồm đầy đủ 30 bảng, views, khóa ngoại, ràng buộc toàn vẹn và chỉ mục.
-- =====================================================================
CREATE DATABASE IF NOT EXISTS steam_store
  DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE steam_store;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS SYSTEM_PARAMETER, BANNER, GAMEREVIEW, AUDITLOG, NOTIFICATION,
  WITHDRAWALREQUEST, `TRANSACTION`, WALLET, REFUNDREQUEST, REVIEW, WISHLISTITEM,
  LICENSE, LICENSE_DEVICE, ORDERITEM, ORDERS, COUPON, CARTITEM, CART, SALECAMPAIGN, ACTIVATIONKEY,
  GAMEVERSION, GAME_GENRE, GENRE, GAME, MANAGER, ROLE_PERMISSION, `ROLE`,
  ADMIN, DEVELOPER, CUSTOMER, ACCOUNT;
DROP VIEW IF EXISTS V_GAME_PRICE;
SET FOREIGN_KEY_CHECKS = 1;

-- ---------------------------------------------------------------------
-- CỤM 1: TÀI KHOẢN VÀ PHÂN QUYỀN
-- ---------------------------------------------------------------------
CREATE TABLE ACCOUNT (
  AccountID     CHAR(36)     NOT NULL DEFAULT (UUID()),
  Username      VARCHAR(30)  NOT NULL,
  PasswordHash  VARCHAR(255) NOT NULL,
  Email         VARCHAR(100) NOT NULL,
  DisplayName   VARCHAR(50)  NOT NULL,
  AvatarUrl     VARCHAR(255) NULL,
  Status        ENUM('Active','Suspended','Banned') NOT NULL DEFAULT 'Active',
  SuspendUntil  DATETIME     NULL,
  NotifyEnabled TINYINT(1)   NOT NULL DEFAULT 1,
  CreatedAt     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (AccountID),
  UNIQUE KEY uq_account_username (Username),
  UNIQUE KEY uq_account_email (Email),
  KEY idx_account_suspension_expiry (Status, SuspendUntil)
) ENGINE=InnoDB;

CREATE TABLE CUSTOMER (
  AccountID CHAR(36) NOT NULL,
  PRIMARY KEY (AccountID),
  CONSTRAINT fk_customer_account FOREIGN KEY (AccountID) REFERENCES ACCOUNT(AccountID) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE DEVELOPER (
  AccountID    CHAR(36)     NOT NULL,
  CompanyName  VARCHAR(150) NOT NULL,
  BankAccount  VARCHAR(50)  NULL,
  FeePaid      TINYINT(1)   NOT NULL DEFAULT 0,
  VerifyStatus ENUM('Pending','Verified','Rejected') NOT NULL DEFAULT 'Pending',
  PRIMARY KEY (AccountID),
  CONSTRAINT fk_developer_account FOREIGN KEY (AccountID) REFERENCES ACCOUNT(AccountID) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE ADMIN (
  AccountID CHAR(36) NOT NULL,
  PRIMARY KEY (AccountID),
  CONSTRAINT fk_admin_account FOREIGN KEY (AccountID) REFERENCES ACCOUNT(AccountID) ON DELETE CASCADE
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
  PermissionCode VARCHAR(50) NOT NULL,
  PRIMARY KEY (RoleID, PermissionCode),
  CONSTRAINT fk_roleperm_role FOREIGN KEY (RoleID) REFERENCES `ROLE`(RoleID) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE MANAGER (
  AccountID CHAR(36) NOT NULL,
  RoleID    CHAR(36) NOT NULL,
  PRIMARY KEY (AccountID),
  CONSTRAINT fk_manager_account FOREIGN KEY (AccountID) REFERENCES ACCOUNT(AccountID) ON DELETE CASCADE,
  CONSTRAINT fk_manager_role    FOREIGN KEY (RoleID)    REFERENCES `ROLE`(RoleID)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- CỤM 2: DANH MỤC GAME VÀ PHIÊN BẢN
-- ---------------------------------------------------------------------
CREATE TABLE GENRE (
  GenreID     CHAR(36)     NOT NULL DEFAULT (UUID()),
  GenreName   VARCHAR(80)  NOT NULL,
  Description VARCHAR(500) NULL,
  PRIMARY KEY (GenreID),
  UNIQUE KEY uq_genre_name (GenreName)
) ENGINE=InnoDB;

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

CREATE TABLE GAME_GENRE (
  GameID  CHAR(36) NOT NULL,
  GenreID CHAR(36) NOT NULL,
  PRIMARY KEY (GameID, GenreID),
  CONSTRAINT fk_gg_game  FOREIGN KEY (GameID)  REFERENCES GAME(GameID)   ON DELETE CASCADE,
  CONSTRAINT fk_gg_genre FOREIGN KEY (GenreID) REFERENCES GENRE(GenreID) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE GAMEVERSION (
  VersionID     CHAR(36)     NOT NULL DEFAULT (UUID()),
  GameID        CHAR(36)     NOT NULL,
  VersionNumber VARCHAR(20)  NOT NULL,
  BuildFile     VARCHAR(255) NOT NULL,
  FileSize      BIGINT       NULL,
  Sha256        CHAR(64)     NULL,
  ChangeLog     TEXT         NULL,
  UploadDate    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  IsCurrent     TINYINT(1)   NOT NULL DEFAULT 0,
  CurrentGameID CHAR(36) GENERATED ALWAYS AS (IF(IsCurrent = 1, GameID, NULL)) VIRTUAL,
  PRIMARY KEY (VersionID),
  UNIQUE KEY uq_version_per_game (GameID, VersionNumber),
  UNIQUE KEY uq_one_current_per_game (CurrentGameID),
  CONSTRAINT fk_version_game FOREIGN KEY (GameID) REFERENCES GAME(GameID) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE ACTIVATIONKEY (
  KeyID         CHAR(36)    NOT NULL DEFAULT (UUID()),
  KeyCode       VARCHAR(40) NOT NULL,
  GameID        CHAR(36)    NOT NULL,
  Status        ENUM('Unused','Used','Revoked') NOT NULL DEFAULT 'Unused',
  CreatedDate   DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ActivatedDate DATETIME    NULL,
  RedeemedBy    CHAR(36)    NULL,
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
  CONSTRAINT fk_sale_game    FOREIGN KEY (GameID) REFERENCES GAME(GameID) ON DELETE CASCADE,
  CONSTRAINT ck_sale_percent CHECK (PercentOff BETWEEN 1 AND 100),
  CONSTRAINT ck_sale_dates   CHECK (EndDate > StartDate)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- CỤM 3: MUA BÁN VÀ SỞ HỮU BẢN QUYỀN
-- ---------------------------------------------------------------------
CREATE TABLE CART (
  CustomerID CHAR(36) NOT NULL,
  PRIMARY KEY (CustomerID),
  CONSTRAINT fk_cart_customer FOREIGN KEY (CustomerID) REFERENCES CUSTOMER(AccountID) ON DELETE CASCADE
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

CREATE TABLE COUPON (
  CouponID      CHAR(36)      NOT NULL DEFAULT (UUID()),
  Code          VARCHAR(30)   NOT NULL,
  DiscountValue DECIMAL(15,2) NOT NULL,
  ExpiryDate    DATETIME      NOT NULL,
  UsageLimit    INT           NOT NULL,
  UsedCount     INT           NOT NULL DEFAULT 0,
  DeveloperID   CHAR(36)      NULL,
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
  TotalAmount DECIMAL(15,2) NOT NULL,
  Status      ENUM('Completed','PartiallyRefunded','Refunded') NOT NULL DEFAULT 'Completed',
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
  CONSTRAINT fk_oi_order FOREIGN KEY (OrderID) REFERENCES ORDERS(OrderID) ON DELETE CASCADE,
  CONSTRAINT fk_oi_game  FOREIGN KEY (GameID)  REFERENCES GAME(GameID),
  CONSTRAINT ck_oi_unit  CHECK (UnitPrice >= 0),
  CONSTRAINT ck_oi_after CHECK (PriceAfterDiscount >= 0 AND PriceAfterDiscount <= UnitPrice)
) ENGINE=InnoDB;

CREATE TABLE LICENSE (
  LicenseID     CHAR(36)     NOT NULL DEFAULT (UUID()),
  CustomerID    CHAR(36)     NOT NULL,
  GameID        CHAR(36)     NOT NULL,
  Source        ENUM('Purchase','Key') NOT NULL DEFAULT 'Purchase',
  PurchaseDate  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  AccessToken   VARCHAR(255) NOT NULL,
  Status        ENUM('Active','Revoked') NOT NULL DEFAULT 'Active',
  RevokedAt     DATETIME     NULL,
  RevokedReason ENUM('Refund','AccountSuspended') NULL,
  ActiveKey     VARCHAR(80) GENERATED ALWAYS AS
                (IF(Status = 'Active', CONCAT(CustomerID, '|', GameID), NULL)) VIRTUAL,
  PRIMARY KEY (LicenseID),
  UNIQUE KEY uq_license_token (AccessToken),
  UNIQUE KEY uq_license_active (ActiveKey),
  KEY idx_license_game (GameID),
  CONSTRAINT fk_license_customer FOREIGN KEY (CustomerID) REFERENCES CUSTOMER(AccountID),
  CONSTRAINT fk_license_game     FOREIGN KEY (GameID)     REFERENCES GAME(GameID)
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
  UNIQUE KEY uq_review_once (CustomerID, GameID),
  KEY idx_review_game (GameID, Status),
  CONSTRAINT fk_review_customer FOREIGN KEY (CustomerID) REFERENCES CUSTOMER(AccountID),
  CONSTRAINT fk_review_game     FOREIGN KEY (GameID)     REFERENCES GAME(GameID),
  CONSTRAINT ck_review_rating CHECK (Rating BETWEEN 1 AND 5)
) ENGINE=InnoDB;

CREATE TABLE REFUNDREQUEST (
  RequestID          CHAR(36)     NOT NULL DEFAULT (UUID()),
  OrderID            CHAR(36)     NOT NULL,
  GameID             CHAR(36)     NULL,
  Reason             VARCHAR(500) NOT NULL,
  RequestDate        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  Status             ENUM('Pending','Approved','Rejected') NOT NULL DEFAULT 'Pending',
  HoursSincePurchase INT          NOT NULL,
  PRIMARY KEY (RequestID),
  KEY idx_refund_order (OrderID),
  KEY idx_refund_order_game_status (OrderID, GameID, Status),
  CONSTRAINT fk_refund_order FOREIGN KEY (OrderID) REFERENCES ORDERS(OrderID) ON DELETE CASCADE,
  CONSTRAINT fk_refund_game  FOREIGN KEY (GameID)  REFERENCES GAME(GameID),
  CONSTRAINT ck_refund_hours CHECK (HoursSincePurchase >= 0)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- CỤM 4: TÀI CHÍNH VÀ VÍ
-- ---------------------------------------------------------------------
CREATE TABLE WALLET (
  WalletID   CHAR(36)      NOT NULL DEFAULT (UUID()),
  CustomerID CHAR(36)      NOT NULL,
  Balance    DECIMAL(15,2) NOT NULL DEFAULT 0,
  Currency   CHAR(3)       NOT NULL DEFAULT 'VND',
  PRIMARY KEY (WalletID),
  UNIQUE KEY uq_wallet_customer (CustomerID),
  CONSTRAINT fk_wallet_customer FOREIGN KEY (CustomerID) REFERENCES CUSTOMER(AccountID) ON DELETE CASCADE,
  CONSTRAINT ck_wallet_balance CHECK (Balance >= 0)
) ENGINE=InnoDB;

CREATE TABLE `TRANSACTION` (
  TransID   CHAR(36)      NOT NULL DEFAULT (UUID()),
  WalletID  CHAR(36)      NOT NULL,
  OrderID   CHAR(36)      NULL,
  Type      ENUM('Deposit','Withdraw','Purchase','Refund','Fee') NOT NULL,
  Amount    DECIMAL(15,2) NOT NULL,
  TransDate DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  Status    ENUM('Success','Failed','Pending') NOT NULL DEFAULT 'Success',
  Detail    TEXT          NULL,
  PRIMARY KEY (TransID),
  KEY idx_trans_wallet_date (WalletID, TransDate),
  CONSTRAINT fk_trans_wallet FOREIGN KEY (WalletID) REFERENCES WALLET(WalletID) ON DELETE CASCADE,
  CONSTRAINT fk_trans_order  FOREIGN KEY (OrderID)  REFERENCES ORDERS(OrderID),
  CONSTRAINT ck_trans_amount CHECK (Amount > 0)
) ENGINE=InnoDB;

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
-- CỤM 5: VẬN HÀNH, KIỂM DUYỆT VÀ QUẢN TRỊ HỆ THỐNG
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
  CONSTRAINT fk_notif_account FOREIGN KEY (AccountID) REFERENCES ACCOUNT(AccountID) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE AUDITLOG (
  LogID     CHAR(36)     NOT NULL DEFAULT (UUID()),
  AccountID CHAR(36)     NULL,
  Action    VARCHAR(100) NOT NULL,
  Target    VARCHAR(200) NOT NULL,
  LogAt     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  Detail    TEXT         NULL,
  PRIMARY KEY (LogID),
  KEY idx_audit_account (AccountID, LogAt),
  CONSTRAINT fk_audit_account FOREIGN KEY (AccountID) REFERENCES ACCOUNT(AccountID) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE GAMEREVIEW (
  CheckID   CHAR(36)     NOT NULL DEFAULT (UUID()),
  GameID    CHAR(36)     NOT NULL,
  ManagerID CHAR(36)     NOT NULL,
  Decision  ENUM('Approved','Rejected','EmergencyDelist') NOT NULL,
  Reason    VARCHAR(500) NULL,
  CheckedAt DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (CheckID),
  KEY idx_gr_game (GameID, CheckedAt),
  CONSTRAINT fk_gr_game    FOREIGN KEY (GameID)    REFERENCES GAME(GameID) ON DELETE CASCADE,
  CONSTRAINT fk_gr_manager FOREIGN KEY (ManagerID) REFERENCES MANAGER(AccountID),
  CONSTRAINT ck_gr_reason CHECK (Decision <> 'Rejected' OR (Reason IS NOT NULL AND Reason <> ''))
) ENGINE=InnoDB;

CREATE TABLE BANNER (
  BannerID   CHAR(36)     NOT NULL DEFAULT (UUID()),
  ImageUrl   VARCHAR(255) NOT NULL,
  LinkUrl    VARCHAR(255) NULL,
  Title      VARCHAR(150) NULL,
  StartDate  DATETIME     NOT NULL,
  EndDate    DATETIME     NOT NULL,
  SortOrder  INT          NOT NULL DEFAULT 0,
  IsActive   TINYINT(1)   NOT NULL DEFAULT 1,
  CreatedBy  CHAR(36)     NOT NULL,
  CreatedAt  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (BannerID),
  CONSTRAINT fk_banner_creator FOREIGN KEY (CreatedBy) REFERENCES ACCOUNT(AccountID),
  CONSTRAINT ck_banner_dates CHECK (EndDate > StartDate)
) ENGINE=InnoDB;

CREATE TABLE SYSTEM_PARAMETER (
  ParamKey    VARCHAR(80)  NOT NULL,
  ParamValue  VARCHAR(500) NOT NULL,
  Description VARCHAR(255) NULL,
  UpdatedBy   CHAR(36)     NULL,
  UpdatedAt   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (ParamKey),
  CONSTRAINT fk_param_updater FOREIGN KEY (UpdatedBy) REFERENCES ACCOUNT(AccountID) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- VIEW: Giá bán hiện hành sau khi áp dụng chiến dịch giảm giá (Sale)
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

SET FOREIGN_KEY_CHECKS = 1;

