-- =====================================================================
-- STEAM STORE - DỮ LIỆU MẪU (chạy SAU steam_store_schema.sql)
-- Mã định danh được rút gọn (A001, G001...) để dễ đọc; bản thật dùng UUID 36 ký tự.
-- Hash tài khoản mẫu không dùng để đăng nhập. Sau khi nạp dữ liệu, chạy
-- `npm run db:bootstrap-admin` để đặt mật khẩu mới cho A001 qua biến môi trường.
-- Cột sinh tự động (GAMEVERSION.CurrentGameID, LICENSE.ActiveKey) không có trong INSERT.
-- =====================================================================
USE steam_store;
SET NAMES utf8mb4;

INSERT INTO ACCOUNT (AccountID, Username, PasswordHash, Email, DisplayName, AvatarUrl, Status, NotifyEnabled, CreatedAt) VALUES
  ('A001', 'admin01', 'SAMPLE_ADMIN_DISABLED', 'admin@steamstore.vn', 'Quản trị viên', NULL, 'Active', 1, '2026-10-20 08:00:00'),
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

-- =====================================================================
-- DỮ LIỆU MỞ RỘNG: thêm 20 game thuộc ba nhà phát hành và dữ liệu liên quan
-- =====================================================================
INSERT INTO ACCOUNT (AccountID, Username, PasswordHash, Email, DisplayName, AvatarUrl, Status, NotifyEnabled, CreatedAt) VALUES
  ('A006', 'mekong_pixel', 'SAMPLE_PASSWORD_DISABLED', 'hello@mekongpixel.example', 'Mekong Pixel', NULL, 'Active', 1, '2026-10-28 10:00:00'),
  ('A007', 'lotus_forge', 'SAMPLE_PASSWORD_DISABLED', 'contact@lotusforge.example', 'Lotus Forge', NULL, 'Active', 1, '2026-10-29 10:00:00'),
  ('A008', 'ngoc_demo', 'SAMPLE_PASSWORD_DISABLED', 'ngoc.demo@example.test', 'Ngọc Demo', NULL, 'Active', 1, '2026-11-12 09:00:00'),
  ('A009', 'hoang_demo', 'SAMPLE_PASSWORD_DISABLED', 'hoang.demo@example.test', 'Hoàng Demo', NULL, 'Active', 1, '2026-11-12 09:30:00');

INSERT INTO CUSTOMER (AccountID) VALUES
  ('A008'),
  ('A009');

INSERT INTO DEVELOPER (AccountID, CompanyName, BankAccount, FeePaid, VerifyStatus) VALUES
  ('A006', 'Mekong Pixel', NULL, 1, 'Verified'),
  ('A007', 'Lotus Forge', NULL, 1, 'Verified');

INSERT INTO GENRE (GenreID, GenreName, Description) VALUES
  ('GN06', 'Adventure', 'Phiêu lưu và khám phá'),
  ('GN07', 'Strategy', 'Chiến thuật và quản lý'),
  ('GN08', 'Horror', 'Kinh dị và sinh tồn'),
  ('GN09', 'Platformer', 'Đi cảnh và vượt chướng ngại'),
  ('GN10', 'Sports', 'Thể thao và thi đấu'),
  ('GN11', 'Casual', 'Trải nghiệm thư giãn');

INSERT INTO GAME (GameID, DeveloperID, Title, Description, Price, CoverImage, TrailerUrl, MinSpec, RecSpec, Status, ReleaseDate) VALUES
  ('G004', 'A003', 'Mekong: Delta Guardians', 'Phiêu lưu hành động bảo vệ vùng châu thổ trước sinh vật huyền bí.', 129000, 'covers/g004.jpg', NULL, 'CPU 2 nhân, RAM 4GB', 'CPU 4 nhân, RAM 8GB', 'Approved', '2026-09-10 00:00:00'),
  ('G005', 'A003', 'Cloud Village: Farm Days', 'Mô phỏng xây dựng nông trại và kết nối những ngôi làng trên mây.', 89000, 'covers/g005.jpg', NULL, 'CPU 2 nhân, RAM 4GB', 'CPU 4 nhân, RAM 8GB', 'Approved', '2026-09-18 00:00:00'),
  ('G006', 'A003', 'Neon Courier', 'Game đua xe arcade miễn phí đưa thư qua thành phố tương lai.', 0, 'covers/g006.jpg', NULL, 'CPU 2 nhân, RAM 4GB', 'CPU 4 nhân, RAM 8GB', 'Approved', '2026-09-22 00:00:00'),
  ('G007', 'A003', 'Hành Trình Sao Bắc', 'Nhập vai khám phá quần đảo và giải mã những chòm sao cổ.', 179000, 'covers/g007.jpg', NULL, 'CPU 4 nhân, RAM 8GB', 'CPU 6 nhân, RAM 16GB', 'Approved', '2026-09-30 00:00:00'),
  ('G008', 'A003', 'Mê Cung Thủy Tinh', 'Giải đố trong mê cung thay đổi hình dạng theo từng lựa chọn.', 69000, 'covers/g008.jpg', NULL, 'CPU 2 nhân, RAM 4GB', 'CPU 4 nhân, RAM 8GB', 'Approved', '2026-10-02 00:00:00'),
  ('G009', 'A003', 'Iron Harbor Tactics', 'Chiến thuật theo lượt về một cảng biển công nghiệp giả tưởng.', 99000, 'covers/g009.jpg', NULL, 'CPU 2 nhân, RAM 4GB', 'CPU 4 nhân, RAM 8GB', 'Approved', '2026-10-05 00:00:00'),
  ('G010', 'A003', 'Bóng Đêm Ở Đồi Sương', 'Phiêu lưu kinh dị điều tra một thị trấn miền núi bị bỏ hoang.', 119000, 'covers/g010.jpg', NULL, 'CPU 4 nhân, RAM 8GB', 'CPU 6 nhân, RAM 16GB', 'Approved', '2026-10-08 00:00:00'),
  ('G011', 'A006', 'Skyline Skater', 'Trượt ván qua những mái nhà và đường ray trên cao.', 149000, 'covers/g011.jpg', NULL, 'CPU 2 nhân, RAM 4GB', 'CPU 4 nhân, RAM 8GB', 'Approved', '2026-10-10 00:00:00'),
  ('G012', 'A006', 'Bếp Nhỏ Hội An', 'Mô phỏng quản lý quán ăn nhỏ với các món ăn và nguyên liệu địa phương.', 59000, 'covers/g012.jpg', NULL, 'CPU 2 nhân, RAM 4GB', 'CPU 4 nhân, RAM 8GB', 'Approved', '2026-10-12 00:00:00'),
  ('G013', 'A006', 'Redline Delta', 'Đua xe tốc độ cao trên những cung đường ven sông.', 159000, 'covers/g013.jpg', NULL, 'CPU 4 nhân, RAM 8GB', 'CPU 6 nhân, RAM 16GB', 'Approved', '2026-10-14 00:00:00'),
  ('G014', 'A006', 'Lục Địa Cổ Thư', 'Nhập vai chiến thuật trong thế giới được ghi chép bằng những cổ thư.', 199000, 'covers/g014.jpg', NULL, 'CPU 4 nhân, RAM 8GB', 'CPU 6 nhân, RAM 16GB', 'Approved', '2026-10-16 00:00:00'),
  ('G015', 'A006', 'Thành Phố Sau Mưa', 'Phiêu lưu giải đố tìm lại ký ức trong thành phố ven biển.', 79000, 'covers/g015.jpg', NULL, 'CPU 2 nhân, RAM 4GB', 'CPU 4 nhân, RAM 8GB', 'Approved', '2026-10-18 00:00:00'),
  ('G016', 'A006', 'Forest Keeper', 'Mô phỏng quản lý khu rừng và cân bằng hệ sinh thái.', 109000, 'covers/g016.jpg', NULL, 'CPU 2 nhân, RAM 4GB', 'CPU 4 nhân, RAM 8GB', 'Approved', '2026-10-20 00:00:00'),
  ('G017', 'A006', 'Pixel Monsoon', 'Đi cảnh miễn phí qua những màn chơi lấy cảm hứng từ mùa mưa.', 0, 'covers/g017.jpg', NULL, 'CPU 2 nhân, RAM 4GB', 'CPU 4 nhân, RAM 8GB', 'Approved', '2026-10-22 00:00:00'),
  ('G018', 'A007', 'Lotus Starship', 'Hành động chiến thuật trong các trận chiến tàu vũ trụ.', 189000, 'covers/g018.jpg', NULL, 'CPU 4 nhân, RAM 8GB', 'CPU 6 nhân, RAM 16GB', 'Approved', '2026-10-24 00:00:00'),
  ('G019', 'A007', 'Đảo Mộng Mơ', 'Giải đố nhẹ nhàng trên quần đảo với những nhân vật kỳ thú.', 49000, 'covers/g019.jpg', NULL, 'CPU 2 nhân, RAM 4GB', 'CPU 4 nhân, RAM 8GB', 'Approved', '2026-10-26 00:00:00'),
  ('G020', 'A007', 'Silent Ward', 'Kinh dị sinh tồn trong một bệnh viện mất điện.', 99000, 'covers/g020.jpg', NULL, 'CPU 4 nhân, RAM 8GB', 'CPU 6 nhân, RAM 16GB', 'Approved', '2026-10-28 00:00:00'),
  ('G021', 'A007', 'Champions of Saigon', 'Thể thao đối kháng theo đội với chế độ thi đấu chiến thuật.', 129000, 'covers/g021.jpg', NULL, 'CPU 2 nhân, RAM 4GB', 'CPU 4 nhân, RAM 8GB', 'Approved', '2026-10-30 00:00:00'),
  ('G022', 'A007', 'Tiny Workshop', 'Mô phỏng chế tạo vật dụng trong một xưởng nhỏ ấm cúng.', 79000, 'covers/g022.jpg', NULL, 'CPU 2 nhân, RAM 4GB', 'CPU 4 nhân, RAM 8GB', 'Approved', '2026-11-01 00:00:00'),
  ('G023', 'A007', 'Aurora Circuit', 'Đua xe arcade trên những đường đua phủ ánh cực quang.', 139000, 'covers/g023.jpg', NULL, 'CPU 2 nhân, RAM 4GB', 'CPU 4 nhân, RAM 8GB', 'Approved', '2026-11-03 00:00:00');

INSERT INTO GAME_GENRE (GameID, GenreID) VALUES
  ('G004', 'GN01'), ('G004', 'GN06'),
  ('G005', 'GN02'), ('G005', 'GN11'),
  ('G006', 'GN04'), ('G006', 'GN01'),
  ('G007', 'GN03'), ('G007', 'GN06'),
  ('G008', 'GN05'), ('G008', 'GN06'),
  ('G009', 'GN07'),
  ('G010', 'GN08'), ('G010', 'GN06'),
  ('G011', 'GN09'), ('G011', 'GN10'),
  ('G012', 'GN02'), ('G012', 'GN11'),
  ('G013', 'GN04'), ('G013', 'GN10'),
  ('G014', 'GN03'), ('G014', 'GN07'),
  ('G015', 'GN06'), ('G015', 'GN05'),
  ('G016', 'GN02'), ('G016', 'GN07'),
  ('G017', 'GN09'), ('G017', 'GN11'),
  ('G018', 'GN01'), ('G018', 'GN07'),
  ('G019', 'GN05'), ('G019', 'GN11'),
  ('G020', 'GN08'),
  ('G021', 'GN10'), ('G021', 'GN07'),
  ('G022', 'GN02'), ('G022', 'GN11'),
  ('G023', 'GN04'), ('G023', 'GN01');

INSERT INTO GAMEVERSION (VersionID, GameID, VersionNumber, BuildFile, FileSize, Sha256, ChangeLog, UploadDate, IsCurrent) VALUES
  ('V005', 'G004', '1.0.0', 'games/G004/1.0.0/build.zip', 52428800, NULL, 'Bản mẫu đầu tiên', '2026-09-10 10:00:00', 1),
  ('V006', 'G005', '1.0.0', 'games/G005/1.0.0/build.zip', 31457280, NULL, 'Bản mẫu đầu tiên', '2026-09-18 10:00:00', 1),
  ('V007', 'G006', '1.0.0', 'games/G006/1.0.0/build.zip', 41943040, NULL, 'Bản mẫu đầu tiên', '2026-09-22 10:00:00', 1),
  ('V008', 'G007', '1.0.0', 'games/G007/1.0.0/build.zip', 73400320, NULL, 'Bản mẫu đầu tiên', '2026-09-30 10:00:00', 1),
  ('V009', 'G008', '1.0.0', 'games/G008/1.0.0/build.zip', 26214400, NULL, 'Bản mẫu đầu tiên', '2026-10-02 10:00:00', 1),
  ('V010', 'G009', '1.0.0', 'games/G009/1.0.0/build.zip', 36700160, NULL, 'Bản mẫu đầu tiên', '2026-10-05 10:00:00', 1),
  ('V011', 'G010', '1.0.0', 'games/G010/1.0.0/build.zip', 57671680, NULL, 'Bản mẫu đầu tiên', '2026-10-08 10:00:00', 1),
  ('V012', 'G011', '1.0.0', 'games/G011/1.0.0/build.zip', 47185920, NULL, 'Bản mẫu đầu tiên', '2026-10-10 10:00:00', 1),
  ('V013', 'G012', '1.0.0', 'games/G012/1.0.0/build.zip', 29360128, NULL, 'Bản mẫu đầu tiên', '2026-10-12 10:00:00', 1),
  ('V014', 'G013', '1.0.0', 'games/G013/1.0.0/build.zip', 62914560, NULL, 'Bản mẫu đầu tiên', '2026-10-14 10:00:00', 1),
  ('V015', 'G014', '1.0.0', 'games/G014/1.0.0/build.zip', 83886080, NULL, 'Bản mẫu đầu tiên', '2026-10-16 10:00:00', 1),
  ('V016', 'G015', '1.0.0', 'games/G015/1.0.0/build.zip', 26214400, NULL, 'Bản mẫu đầu tiên', '2026-10-18 10:00:00', 1),
  ('V017', 'G016', '1.0.0', 'games/G016/1.0.0/build.zip', 41943040, NULL, 'Bản mẫu đầu tiên', '2026-10-20 10:00:00', 1),
  ('V018', 'G017', '1.0.0', 'games/G017/1.0.0/build.zip', 31457280, NULL, 'Bản mẫu đầu tiên', '2026-10-22 10:00:00', 1),
  ('V019', 'G018', '1.0.0', 'games/G018/1.0.0/build.zip', 78643200, NULL, 'Bản mẫu đầu tiên', '2026-10-24 10:00:00', 1),
  ('V020', 'G019', '1.0.0', 'games/G019/1.0.0/build.zip', 20971520, NULL, 'Bản mẫu đầu tiên', '2026-10-26 10:00:00', 1),
  ('V021', 'G020', '1.0.0', 'games/G020/1.0.0/build.zip', 52428800, NULL, 'Bản mẫu đầu tiên', '2026-10-28 10:00:00', 1),
  ('V022', 'G021', '1.0.0', 'games/G021/1.0.0/build.zip', 47185920, NULL, 'Bản mẫu đầu tiên', '2026-10-30 10:00:00', 1),
  ('V023', 'G022', '1.0.0', 'games/G022/1.0.0/build.zip', 26214400, NULL, 'Bản mẫu đầu tiên', '2026-11-01 10:00:00', 1),
  ('V024', 'G023', '1.0.0', 'games/G023/1.0.0/build.zip', 62914560, NULL, 'Bản mẫu đầu tiên', '2026-11-03 10:00:00', 1);

INSERT INTO ACTIVATIONKEY (KeyID, KeyCode, GameID, Status, CreatedDate, ActivatedDate, RedeemedBy) VALUES
  ('K004', 'MEK04-8F2KQ-77XPA', 'G004', 'Unused', '2026-09-10 10:30:00', NULL, NULL),
  ('K005', 'NEON6-3H9TZ-21MQB', 'G006', 'Unused', '2026-09-22 10:30:00', NULL, NULL),
  ('K006', 'HARB9-5R7LC-90WDE', 'G009', 'Unused', '2026-10-05 10:30:00', NULL, NULL),
  ('K007', 'BEP12-4T8NX-31QWE', 'G012', 'Unused', '2026-10-12 10:30:00', NULL, NULL),
  ('K008', 'RAIN5-9K2LM-44PZX', 'G015', 'Unused', '2026-10-18 10:30:00', NULL, NULL),
  ('K009', 'LOT18-6V3BN-82JHA', 'G018', 'Unused', '2026-10-24 10:30:00', NULL, NULL),
  ('K010', 'WARD0-7C4DP-15MNS', 'G020', 'Unused', '2026-10-28 10:30:00', NULL, NULL),
  ('K011', 'AUR23-2X5FG-93RKT', 'G023', 'Unused', '2026-11-03 10:30:00', NULL, NULL);

INSERT INTO SALECAMPAIGN (CampaignID, GameID, PercentOff, StartDate, EndDate) VALUES
  ('C004', 'G005', 25, '2026-11-15 00:00:00', '2026-12-01 23:59:59'),
  ('C005', 'G011', 15, '2026-11-15 00:00:00', '2026-12-01 23:59:59'),
  ('C006', 'G015', 30, '2026-11-15 00:00:00', '2026-12-01 23:59:59'),
  ('C007', 'G020', 40, '2026-11-15 00:00:00', '2026-12-01 23:59:59'),
  ('C008', 'G023', 20, '2026-11-15 00:00:00', '2026-12-01 23:59:59');

INSERT INTO CART (CustomerID) VALUES
  ('A008'),
  ('A009');

INSERT INTO CARTITEM (CustomerID, GameID, PriceAtAdd) VALUES
  ('A008', 'G007', 179000),
  ('A008', 'G020', 99000),
  ('A009', 'G013', 159000),
  ('A009', 'G021', 129000);

INSERT INTO ORDERS (OrderID, CustomerID, CouponID, OrderDate, TotalAmount, Status) VALUES
  ('O004', 'A008', NULL, '2026-11-13 10:15:00', 129000, 'Completed'),
  ('O005', 'A008', NULL, '2026-11-14 11:20:00', 59000, 'Completed'),
  ('O006', 'A009', NULL, '2026-11-15 12:25:00', 189000, 'Completed'),
  ('O007', 'A009', NULL, '2026-11-16 13:30:00', 79000, 'Completed');

INSERT INTO ORDERITEM (OrderID, GameID, UnitPrice, PriceAfterDiscount) VALUES
  ('O004', 'G004', 129000, 129000),
  ('O005', 'G012', 59000, 59000),
  ('O006', 'G018', 189000, 189000),
  ('O007', 'G022', 79000, 79000);

INSERT INTO WALLET (WalletID, CustomerID, Balance, Currency) VALUES
  ('W004', 'A008', 62000, 'VND'),
  ('W005', 'A009', 32000, 'VND');

INSERT INTO `TRANSACTION` (TransID, WalletID, OrderID, Type, Amount, TransDate, Status) VALUES
  ('T09', 'W004', NULL, 'Deposit', 250000, '2026-11-13 10:00:00', 'Success'),
  ('T10', 'W004', 'O004', 'Purchase', 129000, '2026-11-13 10:15:00', 'Success'),
  ('T11', 'W004', 'O005', 'Purchase', 59000, '2026-11-14 11:20:00', 'Success'),
  ('T12', 'W005', NULL, 'Deposit', 300000, '2026-11-15 12:00:00', 'Success'),
  ('T13', 'W005', 'O006', 'Purchase', 189000, '2026-11-15 12:25:00', 'Success'),
  ('T14', 'W005', 'O007', 'Purchase', 79000, '2026-11-16 13:30:00', 'Success');

INSERT INTO LICENSE (LicenseID, CustomerID, GameID, Source, PurchaseDate, AccessToken, Status, RevokedAt) VALUES
  ('L005', 'A008', 'G004', 'Purchase', '2026-11-13 10:15:00', 'f933fca1ed1e1f3f1e9160d55e4c460b9cb663f34fc70c5eb167563557afa60c', 'Active', NULL),
  ('L006', 'A008', 'G012', 'Purchase', '2026-11-14 11:20:00', '1726b93dd05f2fdb46ba299f3df9f4e11b8f0e5bcccab38807a94edeb09646c1', 'Active', NULL),
  ('L007', 'A009', 'G018', 'Purchase', '2026-11-15 12:25:00', 'ff16ff2cfd6034ca9110ff2726dc7573baa17465dbcd0494441f218e7d11e3c5', 'Active', NULL),
  ('L008', 'A009', 'G022', 'Purchase', '2026-11-16 13:30:00', '5366db0c2d8c88573916264674b32c318b5a2c68b60d36e068d3f6a9d0c856a0', 'Active', NULL);

INSERT INTO WISHLISTITEM (CustomerID, GameID, AddedDate) VALUES
  ('A008', 'G023', '2026-11-15 20:00:00'),
  ('A009', 'G005', '2026-11-16 20:00:00');

INSERT INTO REVIEW (ReviewID, CustomerID, GameID, Rating, Content, ReviewDate, Status) VALUES
  ('RV04', 'A008', 'G004', 5, 'Không khí phiêu lưu thú vị và chạy ổn định.', '2026-11-14 18:00:00', 'Visible'),
  ('RV05', 'A008', 'G012', 4, 'Mô phỏng thư giãn, nội dung mẫu đa dạng.', '2026-11-15 18:00:00', 'Visible'),
  ('RV06', 'A009', 'G018', 5, 'Các trận chiến chiến thuật có nhịp độ tốt.', '2026-11-16 18:00:00', 'Visible'),
  ('RV07', 'A009', 'G022', 4, 'Một game mô phỏng nhẹ nhàng để chơi ngắn.', '2026-11-17 18:00:00', 'Visible');

INSERT INTO NOTIFICATION (NotificationID, AccountID, Type, Content, SentAt, IsRead) VALUES
  ('N04', 'A008', 'OrderCompleted', 'Đơn O004 đã hoàn tất.', '2026-11-13 10:15:00', 1),
  ('N05', 'A009', 'WishlistSale', 'Cloud Village: Farm Days đang giảm giá.', '2026-11-16 00:05:00', 0);
