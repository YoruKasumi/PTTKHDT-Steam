-- Bảng bổ sung cho các chức năng nằm ngoài lược đồ 29 bảng (chạy sau steam_store_schema.sql).
USE steam_store;

-- UC49. Cấu hình banner trang chủ (BannerService)
CREATE TABLE IF NOT EXISTS BANNER (
  BannerID   CHAR(36)     NOT NULL DEFAULT (UUID()),
  ImageUrl   VARCHAR(255) NOT NULL,                  -- khóa đối tượng trên kho lưu trữ
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

-- UC58. Cấu hình tham số hệ thống (SystemConfigService)
CREATE TABLE IF NOT EXISTS SYSTEM_PARAMETER (
  ParamKey    VARCHAR(80)  NOT NULL,
  ParamValue  VARCHAR(500) NOT NULL,
  Description VARCHAR(255) NULL,
  UpdatedBy   CHAR(36)     NULL,
  UpdatedAt   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (ParamKey),
  CONSTRAINT fk_param_updater FOREIGN KEY (UpdatedBy) REFERENCES ACCOUNT(AccountID)
) ENGINE=InnoDB;

INSERT IGNORE INTO SYSTEM_PARAMETER (ParamKey, ParamValue, Description) VALUES
  ('REFUND_WINDOW_HOURS', '24', 'Thời hạn hoàn tiền (giờ)'),
  ('MAX_KEYS_PER_BATCH', '200', 'Số key tối đa mỗi lần sinh'),
  ('MAX_UNUSED_KEYS_PER_GAME', '2000', 'Số key chưa kích hoạt tối đa mỗi game'),
  ('DEVELOPER_FEE_VND', '100000', 'Phí Steam Direct (VND)'),
  ('MIN_DEPOSIT_VND', '10000', 'Số tiền nạp tối thiểu');
