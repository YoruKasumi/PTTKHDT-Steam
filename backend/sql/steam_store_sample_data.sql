-- =====================================================================
-- STEAM STORE - DỮ LIỆU MẪU (chạy SAU steam_store_schema.sql)
-- Mã định danh được rút gọn (A001, G001...) để dễ đọc; bản thật dùng UUID 36 ký tự.
-- PasswordHash chỉ là chuỗi minh họa: tài khoản mẫu KHÔNG đăng nhập được; hãy đăng ký qua API.
-- Cột sinh tự động (GAMEVERSION.CurrentGameID, LICENSE.ActiveKey) không có trong INSERT.
-- =====================================================================
USE steam_store;

INSERT INTO ACCOUNT (AccountID, Username, PasswordHash, Email, DisplayName, AvatarUrl, Status, NotifyEnabled, CreatedAt) VALUES
  ('A001', 'admin01', '$2b$10$4fb49ce0c1875431f506d907c6793e6dcc01047dc37649718e3cb', 'admin@steamstore.vn', 'Quản trị viên', NULL, 'Active', 1, '2026-10-20 08:00:00'),
  ('A002', 'mod_lan', '$2b$10$6cfec6bad14e5d1f96092df43eca706090977bbc39a34a203f9cb', 'lan.kiemduyet@steamstore.vn', 'Lan - Kiểm duyệt', NULL, 'Active', 1, '2026-10-21 09:30:00'),
  ('A003', 'nvh_studio', '$2b$10$825dadeff067f14458f7436c0755dcb7c7a8357f0c4d85144245b', 'contact@nvhstudio.vn', 'NVH Studio', 'avatars/a003.png', 'Active', 1, '2026-10-25 10:00:00'),
  ('A004', 'minhanh', '$2b$10$33132f41e49a1017cac84b9dbae616c3c9047d64eae5b1fa85b7a', 'minhanh@gmail.com', 'Minh Anh', NULL, 'Active', 1, '2026-11-05 19:20:00'),
  ('A005', 'baotran', '$2b$10$cb353c20b8f0bd9439163f9353c53d9b627fe40e2b19af2956c4a', 'baotran@gmail.com', 'Bảo Trân', 'avatars/a005.png', 'Active', 0, '2026-11-06 21:05:00');

INSERT INTO CUSTOMER (AccountID) VALUES
  ('A003'),
  ('A004'),
  ('A005');

INSERT INTO DEVELOPER (AccountID, CompanyName, BankAccount, FeePaid, VerifyStatus) VALUES
  ('A003', 'NVH Studio', '0123456789', 1, 'Verified');

INSERT INTO ADMIN (AccountID) VALUES
  ('A001');

INSERT INTO `ROLE` (RoleID, RoleName, ManagedBy) VALUES
  ('R01', 'GameModerator', 'A001'),
  ('R02', 'Support', 'A001');

INSERT INTO ROLE_PERMISSION (RoleID, PermissionCode) VALUES
  ('R01', 'game.approve'),
  ('R01', 'game.delist'),
  ('R01', 'withdrawal.approve'),
  ('R02', 'review.moderate');

INSERT INTO MANAGER (AccountID, RoleID) VALUES
  ('A002', 'R01');

INSERT INTO GENRE (GenreID, GenreName, Description) VALUES
  ('GN01', 'Action', 'Hành động'),
  ('GN02', 'Simulation', 'Mô phỏng'),
  ('GN03', 'RPG', 'Nhập vai'),
  ('GN04', 'Racing', 'Đua xe'),
  ('GN05', 'Puzzle', 'Giải đố');

INSERT INTO GAME (GameID, DeveloperID, Title, Description, Price, CoverImage, TrailerUrl, MinSpec, RecSpec, Status, ReleaseDate) VALUES
  ('G001', 'A003', 'Rồng Lửa Online', 'Game nhập vai hành động săn rồng thế giới mở', 199000, 'covers/g001.jpg', NULL, 'CPU i3, RAM 8GB, GTX 750', 'CPU i5, RAM 16GB, GTX 1060', 'Approved', '2026-11-02 00:00:00'),
  ('G002', 'A003', 'Pixel Farm', 'Game mô phỏng nông trại phong cách pixel', 99000, 'covers/g002.jpg', NULL, 'CPU Dual-core, RAM 4GB', 'CPU i3, RAM 8GB', 'Approved', '2026-11-02 00:00:00'),
  ('G003', 'A003', 'Neon Racer', 'Game đua xe tốc độ cao trong thành phố neon', 149000, 'covers/g003.jpg', 'https://example.com/neon-racer-trailer', 'CPU i3, RAM 8GB, GTX 960', 'CPU i5, RAM 16GB, RTX 2060', 'Approved', '2026-11-05 00:00:00');

INSERT INTO GAME_GENRE (GameID, GenreID) VALUES
  ('G001', 'GN01'),
  ('G001', 'GN03'),
  ('G002', 'GN02'),
  ('G003', 'GN04');

INSERT INTO GAMEVERSION (VersionID, GameID, VersionNumber, BuildFile, FileSize, Sha256, ChangeLog, UploadDate, IsCurrent) VALUES
  ('V001', 'G001', '1.0.0', 'games/G001/1.0.0/build.zip', 52428800, 'a2392c7d5768c43fc6d6ba86d2d456250b7faa6aa1b3d1673805c64c03beda79', 'Bản phát hành đầu tiên', '2026-11-01 14:00:00', 0),
  ('V002', 'G001', '1.1.0', 'games/G001/1.1.0/build.zip', 53477376, 'f41ebb21122b38a639e4527dfa28ea00121ad7dede7cb0be09e613c575ed6f4a', 'Sửa lỗi treo máy, thêm boss mới', '2026-11-08 10:30:00', 1),
  ('V003', 'G002', '1.0.0', 'games/G002/1.0.0/build.zip', 20971520, 'cdaded0be586d5d16bb2ffbdc6056b461aa45c92dfe03e30a8b780063f9646e9', 'Bản phát hành đầu tiên', '2026-11-01 14:30:00', 1),
  ('V004', 'G003', '1.0.0', 'games/G003/1.0.0/build.zip', 73400320, 'a62362543903b3399013f07a12fde20259bbb3bf4cb8005d7dd9f60385190264', 'Bản phát hành đầu tiên', '2026-11-04 09:00:00', 1);

INSERT INTO ACTIVATIONKEY (KeyID, KeyCode, GameID, Status, CreatedDate, ActivatedDate, RedeemedBy) VALUES
  ('K001', 'DRGN1-8F2KQ-77XPA', 'G001', 'Used', '2026-11-01 15:00:00', '2026-11-09 20:00:00', 'A005'),
  ('K002', 'DRGN1-3H9TZ-21MQB', 'G001', 'Unused', '2026-11-01 15:00:00', NULL, NULL),
  ('K003', 'PIXFM-5R7LC-90WDE', 'G002', 'Unused', '2026-11-01 15:05:00', NULL, NULL);

INSERT INTO SALECAMPAIGN (CampaignID, GameID, PercentOff, StartDate, EndDate) VALUES
  ('C001', 'G001', 30, '2026-11-10 00:00:00', '2026-11-24 23:59:59'),
  ('C002', 'G002', 50, '2026-11-10 00:00:00', '2026-11-17 23:59:59'),
  ('C003', 'G003', 20, '2026-11-11 00:00:00', '2026-11-18 23:59:59');

INSERT INTO CART (CustomerID) VALUES
  ('A004'),
  ('A005');

INSERT INTO CARTITEM (CustomerID, GameID, PriceAtAdd) VALUES
  ('A004', 'G002', 99000),
  ('A005', 'G003', 149000);

INSERT INTO COUPON (CouponID, Code, DiscountValue, ExpiryDate, UsageLimit, UsedCount, DeveloperID, GameID) VALUES
  ('CP01', 'WELCOME20', 20000, '2026-12-31 23:59:59', 100, 1, NULL, NULL),
  ('CP02', 'NVH50K', 50000, '2026-12-15 23:59:59', 50, 0, 'A003', 'G001');

INSERT INTO ORDERS (OrderID, CustomerID, CouponID, OrderDate, TotalAmount, Status) VALUES
  ('O001', 'A004', 'CP01', '2026-11-08 09:15:00', 179000, 'Completed'),
  ('O002', 'A005', NULL, '2026-11-10 10:20:00', 49500, 'Refunded'),
  ('O003', 'A005', NULL, '2026-11-11 08:30:00', 49500, 'Completed');

INSERT INTO ORDERITEM (OrderID, GameID, UnitPrice, PriceAfterDiscount) VALUES
  ('O001', 'G001', 199000, 179000),
  ('O002', 'G002', 99000, 49500),
  ('O003', 'G002', 99000, 49500);

INSERT INTO LICENSE (LicenseID, CustomerID, GameID, Source, PurchaseDate, AccessToken, Status, RevokedAt) VALUES
  ('L001', 'A004', 'G001', 'Purchase', '2026-11-08 09:15:00', '668b2245fe89b82c883add46d887175478e14a1467e264169755830659ff4c4b', 'Active', NULL),
  ('L002', 'A005', 'G002', 'Purchase', '2026-11-10 10:20:00', 'cb62aa9e04da6a47f9ffe7c42df84d7f3248d4645bab50dc88c65b73872d2091', 'Revoked', '2026-11-10 13:45:00'),
  ('L003', 'A005', 'G001', 'Key', '2026-11-09 20:00:00', '47892b4437ca5f00bb92da7fd8873601bc276329ad05dd0dcd56ebdbaff1f00b', 'Active', NULL),
  ('L004', 'A005', 'G002', 'Purchase', '2026-11-11 08:30:00', '1f26f7db509ed22b6292914e9e645e087137d0e99a9c3edb744ea57b709278d0', 'Active', NULL);

INSERT INTO LICENSE_DEVICE (DeviceID, LicenseID, DeviceFingerprint, DeviceName, FirstSeen, LastSeen, Status) VALUES
  ('D001', 'L001', '388c357c4f386995ab3ac6e47f0c40140309463860edde4bfbd12e28558be5e1', 'PC-Minh Anh', '2026-11-08 20:10:00', '2026-11-10 21:00:00', 'Active'),
  ('D002', 'L003', 'd0bcbea8c0c64cc6af300c1a81b99285d4c4583bb60ff98eacd93b812f8b981d', 'Laptop-Bảo Trân', '2026-11-09 20:05:00', '2026-11-11 07:50:00', 'Active'),
  ('D003', 'L004', 'd0bcbea8c0c64cc6af300c1a81b99285d4c4583bb60ff98eacd93b812f8b981d', 'Laptop-Bảo Trân', '2026-11-11 08:40:00', '2026-11-11 08:40:00', 'Active');

INSERT INTO WISHLISTITEM (CustomerID, GameID, AddedDate) VALUES
  ('A004', 'G003', '2026-11-09 18:00:00'),
  ('A005', 'G003', '2026-11-10 22:15:00');

INSERT INTO REVIEW (ReviewID, CustomerID, GameID, Rating, Content, ReviewDate, Status) VALUES
  ('RV01', 'A004', 'G001', 5, 'Đồ họa đẹp, boss rất cuốn', '2026-11-09 21:30:00', 'Visible'),
  ('RV02', 'A005', 'G001', 4, 'Hay nhưng hơi dài', '2026-11-10 20:00:00', 'Visible'),
  ('RV03', 'A005', 'G002', 1, 'Nội dung không phù hợp (đã bị ẩn)', '2026-11-11 09:00:00', 'Hidden');

INSERT INTO REFUNDREQUEST (RequestID, OrderID, Reason, RequestDate, Status, HoursSincePurchase) VALUES
  ('RF01', 'O002', 'Game không chạy được trên máy của tôi', '2026-11-10 13:40:00', 'Approved', 3),
  ('RF02', 'O001', 'Đổi ý, không muốn chơi nữa', '2026-11-10 14:00:00', 'Rejected', 52);

INSERT INTO WALLET (WalletID, CustomerID, Balance, Currency) VALUES
  ('W001', 'A003', 50000, 'VND'),
  ('W002', 'A004', 321000, 'VND'),
  ('W003', 'A005', 150500, 'VND');

INSERT INTO `TRANSACTION` (TransID, WalletID, OrderID, Type, Amount, TransDate, Status) VALUES
  ('T01', 'W002', NULL, 'Deposit', 500000, '2026-11-08 09:00:00', 'Success'),
  ('T02', 'W002', 'O001', 'Purchase', 179000, '2026-11-08 09:15:00', 'Success'),
  ('T03', 'W003', NULL, 'Deposit', 200000, '2026-11-10 10:00:00', 'Success'),
  ('T04', 'W003', 'O002', 'Purchase', 49500, '2026-11-10 10:20:00', 'Success'),
  ('T05', 'W003', 'O002', 'Refund', 49500, '2026-11-10 13:45:00', 'Success'),
  ('T06', 'W003', 'O003', 'Purchase', 49500, '2026-11-11 08:30:00', 'Success'),
  ('T07', 'W001', NULL, 'Deposit', 150000, '2026-11-01 08:00:00', 'Success'),
  ('T08', 'W001', NULL, 'Fee', 100000, '2026-11-01 08:05:00', 'Success');

INSERT INTO WITHDRAWALREQUEST (RequestID, DeveloperID, Amount, BankInfo, Status, RequestDate) VALUES
  ('WD01', 'A003', 200000, 'VCB - 0123456789', 'Pending', '2026-11-11 09:00:00');

INSERT INTO NOTIFICATION (NotificationID, AccountID, Type, Content, SentAt, IsRead) VALUES
  ('N01', 'A005', 'WishlistSale', 'Neon Racer trong danh sách mong ước đang giảm 20%', '2026-11-11 00:05:00', 0),
  ('N02', 'A005', 'Refund', 'Yêu cầu hoàn tiền đơn O002 đã được duyệt', '2026-11-10 13:45:00', 1),
  ('N03', 'A003', 'GameApproved', 'Game Neon Racer đã được phê duyệt', '2026-11-05 10:00:00', 0);

INSERT INTO AUDITLOG (LogID, AccountID, Action, Target, LogAt, Detail) VALUES
  ('LG01', 'A001', 'role.create', 'ROLE:R01', '2026-10-30 09:00:00', 'Tạo vai trò GameModerator'),
  ('LG02', 'A002', 'game.approve', 'GAME:G001', '2026-11-02 08:30:00', 'Đạt tiêu chuẩn nội dung'),
  ('LG03', 'A002', 'game.reject', 'GAME:G003', '2026-11-01 16:00:00', 'Thiếu tệp build hợp lệ');

INSERT INTO GAMEREVIEW (CheckID, GameID, ManagerID, Decision, Reason, CheckedAt) VALUES
  ('CK01', 'G001', 'A002', 'Approved', NULL, '2026-11-02 08:30:00'),
  ('CK02', 'G002', 'A002', 'Approved', NULL, '2026-11-02 08:40:00'),
  ('CK03', 'G003', 'A002', 'Rejected', 'Thiếu tệp build hợp lệ', '2026-11-01 16:00:00'),
  ('CK04', 'G003', 'A002', 'Approved', NULL, '2026-11-05 10:00:00');
