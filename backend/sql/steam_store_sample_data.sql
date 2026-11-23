-- =====================================================================
-- STEAM STORE - DỮ LIỆU MẪU TOÀN DIỆN (SEED DATA)
-- Khởi tạo đầy đủ danh mục, tài khoản, game demo, đơn hàng, ví, đánh giá,
-- thông số hệ thống và banner quảng bá.
-- Chạy SAU steam_store_schema.sql.
-- =====================================================================
USE steam_store;
SET NAMES utf8mb4;

-- Xóa các game không còn/không có ảnh bìa hợp lệ khỏi dữ liệu đang tồn tại.
-- Các game hợp lệ trong seed đều dùng cover từ /api/media/games/<slug>/.
DELETE FROM ACTIVATIONKEY
WHERE GameID IN (
  SELECT GameID FROM GAME
  WHERE CoverImage IS NULL OR TRIM(CoverImage) = '' OR CoverImage NOT LIKE '/api/media/games/%'
);
DELETE FROM CARTITEM
WHERE GameID IN (
  SELECT GameID FROM GAME
  WHERE CoverImage IS NULL OR TRIM(CoverImage) = '' OR CoverImage NOT LIKE '/api/media/games/%'
);
DELETE FROM COUPON
WHERE GameID IN (
  SELECT GameID FROM GAME
  WHERE CoverImage IS NULL OR TRIM(CoverImage) = '' OR CoverImage NOT LIKE '/api/media/games/%'
);
DELETE FROM ORDERITEM
WHERE GameID IN (
  SELECT GameID FROM GAME
  WHERE CoverImage IS NULL OR TRIM(CoverImage) = '' OR CoverImage NOT LIKE '/api/media/games/%'
);
DELETE FROM LICENSE
WHERE GameID IN (
  SELECT GameID FROM GAME
  WHERE CoverImage IS NULL OR TRIM(CoverImage) = '' OR CoverImage NOT LIKE '/api/media/games/%'
);
DELETE FROM WISHLISTITEM
WHERE GameID IN (
  SELECT GameID FROM GAME
  WHERE CoverImage IS NULL OR TRIM(CoverImage) = '' OR CoverImage NOT LIKE '/api/media/games/%'
);
DELETE FROM REVIEW
WHERE GameID IN (
  SELECT GameID FROM GAME
  WHERE CoverImage IS NULL OR TRIM(CoverImage) = '' OR CoverImage NOT LIKE '/api/media/games/%'
);
DELETE FROM REFUNDREQUEST
WHERE GameID IN (
  SELECT GameID FROM GAME
  WHERE CoverImage IS NULL OR TRIM(CoverImage) = '' OR CoverImage NOT LIKE '/api/media/games/%'
);
DELETE FROM GAME
WHERE CoverImage IS NULL
   OR TRIM(CoverImage) = ''
   OR CoverImage NOT LIKE '/api/media/games/%';

-- ---------------------------------------------------------------------
-- 1. THAM SỐ CẤU HÌNH HỆ THỐNG
-- ---------------------------------------------------------------------
INSERT INTO SYSTEM_PARAMETER (ParamKey, ParamValue, Description) VALUES
  ('REFUND_WINDOW_HOURS', '24', 'Thời hạn hoàn tiền tối đa (giờ)'),
  ('MAX_KEYS_PER_BATCH', '200', 'Số lượng key tối đa được tạo trong mỗi đợt'),
  ('MAX_UNUSED_KEYS_PER_GAME', '2000', 'Số key chưa kích hoạt tối đa của mỗi game'),
  ('DEVELOPER_FEE_VND', '100000', 'Phí đăng ký nhà phát hành Steam Direct (VND)'),
  ('MIN_DEPOSIT_VND', '10000', 'Số tiền nạp tối thiểu vào ví (VND)'),
  ('PLATFORM_COMMISSION_PERCENT', '20', 'Tỷ lệ hoa hồng sàn (%)'),
  ('MIN_WITHDRAWAL_VND', '100000', 'Hạn mức rút tiền tối thiểu của nhà phát hành (VND)'),
  ('MAX_BUILD_FILE_BYTES', '2147483648', 'Dung lượng build tối đa cho phép (byte)');

-- ---------------------------------------------------------------------
-- 2. TÀI KHOẢN VÀ PHÂN QUYỀN
-- ---------------------------------------------------------------------
-- Tài khoản seed dùng chung mật khẩu đăng nhập: Vortex123!
-- Danh sách:
-- admin01 (admin@steamstore.vn) | Vortex123! | Quản trị viên
-- mod_lan (lan.kiemduyet@steamstore.vn) | Vortex123! | Kiểm duyệt
-- nvh_studio (contact@nvhstudio.vn) | Vortex123! | Khách hàng + Nhà phát hành
-- minhanh (minhanh@gmail.com) | Vortex123! | Khách hàng
-- baotran (baotran@gmail.com) | Vortex123! | Khách hàng
-- mekong_pixel (hello@mekongpixel.example) | Vortex123! | Nhà phát hành
-- lotus_forge (contact@lotusforge.example) | Vortex123! | Nhà phát hành
-- ngoc_demo (ngoc.demo@example.test) | Vortex123! | Khách hàng
-- hoang_demo (hoang.demo@example.test) | Vortex123! | Khách hàng
INSERT INTO ACCOUNT (AccountID, Username, PasswordHash, Email, DisplayName, AvatarUrl, Status, NotifyEnabled, CreatedAt) VALUES
  ('A001', 'admin01', '$2a$12$SBs7KcqTnSibrODGVqnQRekYvJ2C44TG8Cm8rmH9ipzfs/b.bOq72', 'admin@steamstore.vn', 'Quản trị viên', NULL, 'Active', 1, '2026-10-20 08:00:00'),
  ('A002', 'mod_lan', '$2a$12$SBs7KcqTnSibrODGVqnQRekYvJ2C44TG8Cm8rmH9ipzfs/b.bOq72', 'lan.kiemduyet@steamstore.vn', 'Lan - Kiểm duyệt', NULL, 'Active', 1, '2026-10-21 09:30:00'),
  ('A003', 'nvh_studio', '$2a$12$SBs7KcqTnSibrODGVqnQRekYvJ2C44TG8Cm8rmH9ipzfs/b.bOq72', 'contact@nvhstudio.vn', 'NVH Studio', 'avatars/a003.png', 'Active', 1, '2026-10-25 10:00:00'),
  ('A004', 'minhanh', '$2a$12$SBs7KcqTnSibrODGVqnQRekYvJ2C44TG8Cm8rmH9ipzfs/b.bOq72', 'minhanh@gmail.com', 'Minh Anh', NULL, 'Active', 1, '2026-11-05 19:20:00'),
  ('A005', 'baotran', '$2a$12$SBs7KcqTnSibrODGVqnQRekYvJ2C44TG8Cm8rmH9ipzfs/b.bOq72', 'baotran@gmail.com', 'Bảo Trân', 'avatars/a005.png', 'Active', 0, '2026-11-06 21:05:00'),
  ('A006', 'mekong_pixel', '$2a$12$SBs7KcqTnSibrODGVqnQRekYvJ2C44TG8Cm8rmH9ipzfs/b.bOq72', 'hello@mekongpixel.example', 'Mekong Pixel', NULL, 'Active', 1, '2026-10-28 10:00:00'),
  ('A007', 'lotus_forge', '$2a$12$SBs7KcqTnSibrODGVqnQRekYvJ2C44TG8Cm8rmH9ipzfs/b.bOq72', 'contact@lotusforge.example', 'Lotus Forge', NULL, 'Active', 1, '2026-10-29 10:00:00'),
  ('A008', 'ngoc_demo', '$2a$12$SBs7KcqTnSibrODGVqnQRekYvJ2C44TG8Cm8rmH9ipzfs/b.bOq72', 'ngoc.demo@example.test', 'Ngọc Demo', NULL, 'Active', 1, '2026-11-12 09:00:00'),
  ('A009', 'hoang_demo', '$2a$12$SBs7KcqTnSibrODGVqnQRekYvJ2C44TG8Cm8rmH9ipzfs/b.bOq72', 'hoang.demo@example.test', 'Hoàng Demo', NULL, 'Active', 1, '2026-11-12 09:30:00');

INSERT INTO CUSTOMER (AccountID) VALUES
  ('A003'),
  ('A004'),
  ('A005'),
  ('A008'),
  ('A009');

INSERT INTO DEVELOPER (AccountID, CompanyName, BankAccount, FeePaid, VerifyStatus) VALUES
  ('A003', 'NVH Studio', '0123456789', 1, 'Verified'),
  ('A006', 'Mekong Pixel', '0987654321', 1, 'Verified'),
  ('A007', 'Lotus Forge', '1122334455', 1, 'Verified');

INSERT INTO ADMIN (AccountID) VALUES
  ('A001');

INSERT INTO `ROLE` (RoleID, RoleName, ManagedBy) VALUES
  ('R01', 'GameModerator', 'A001'),
  ('R02', 'Support', 'A001');

INSERT INTO ROLE_PERMISSION (RoleID, PermissionCode) VALUES
  ('R01', 'finance.read'),
  ('R01', 'community.moderate'),
  ('R01', 'audit.read'),
  ('R01', 'game.approve'),
  ('R01', 'game.delist'),
  ('R01', 'review.moderate');

INSERT INTO MANAGER (AccountID, RoleID) VALUES
  ('A002', 'R01');

-- ---------------------------------------------------------------------
-- 3. THỂ LOẠI (GENRES)
-- ---------------------------------------------------------------------
INSERT INTO GENRE (GenreID, GenreName, Description) VALUES
  ('GN01', 'Action', 'Hành động nhịp độ cao'),
  ('GN02', 'Simulation', 'Mô phỏng chân thực và quản lý'),
  ('GN03', 'RPG', 'Nhập vai và phát triển nhân vật'),
  ('GN04', 'Racing', 'Đua xe tốc độ cao'),
  ('GN05', 'Puzzle', 'Giải đố trí tuệ'),
  ('GN06', 'Adventure', 'Phiêu lưu và khám phá thế giới'),
  ('GN07', 'Strategy', 'Chiến thuật và tư duy'),
  ('GN08', 'Horror', 'Kinh dị và sinh tồn'),
  ('GN09', 'Platformer', 'Đi cảnh vượt chướng ngại vật'),
  ('GN10', 'Sports', 'Thể thao và thi đấu'),
  ('GN11', 'Casual', 'Trải nghiệm thư giãn nhẹ nhàng'),
  ('GN12', 'Co-op', 'Chơi phối hợp đồng đội'),
  ('GN13', 'Multiplayer', 'Nhiều người chơi trực tuyến'),
  ('GN14', 'Open World', 'Thế giới mở rộng lớn'),
  ('GN15', 'Sci-fi', 'Khoa học viễn tưởng'),
  ('GN16', 'Survival', 'Sinh tồn khắc nghiệt'),
  ('GN17', 'Fighting', 'Đối kháng võ thuật');

-- ---------------------------------------------------------------------
-- 4. DANH MỤC TRÒ CHƠI (GAMES)
-- ---------------------------------------------------------------------
INSERT INTO GAME (GameID, DeveloperID, Title, Slug, Description, Price, CoverImage, TrailerUrl, MinSpec, RecSpec, Status, ReleaseDate) VALUES
  ('G001', 'A003', 'Rồng Lửa Online', 'rong-lua-online', 'Game nhập vai hành động săn rồng thế giới mở', 199000, 'covers/g001.jpg', NULL, 'CPU i3, RAM 8GB, GTX 750', 'CPU i5, RAM 16GB, GTX 1060', 'Approved', '2026-11-02 00:00:00'),
  ('G002', 'A003', 'Pixel Farm', 'pixel-farm', 'Game mô phỏng nông trại phong cách pixel', 99000, 'covers/g002.jpg', NULL, 'CPU Dual-core, RAM 4GB', 'CPU i3, RAM 8GB', 'Approved', '2026-11-02 00:00:00'),
  ('G003', 'A003', 'Neon Racer', 'neon-racer', 'Game đua xe tốc độ cao trong thành phố neon', 149000, 'covers/g003.jpg', 'https://example.com/neon-racer-trailer', 'CPU i3, RAM 8GB, GTX 960', 'CPU i5, RAM 16GB, RTX 2060', 'Approved', '2026-11-05 00:00:00'),
  ('G004', 'A006', 'Mekong: Delta Guardians', 'mekong-delta-guardians', 'Phiêu lưu hành động bảo vệ vùng châu thổ trước sinh vật huyền bí.', 129000, 'covers/g004.jpg', NULL, 'CPU 2 nhân, RAM 4GB', 'CPU 4 nhân, RAM 8GB', 'Approved', '2026-09-10 00:00:00'),
  ('G005', 'A006', 'Cloud Village: Farm Days', 'cloud-village-farm-days', 'Mô phỏng xây dựng nông trại và kết nối những ngôi làng trên mây.', 89000, 'covers/g005.jpg', NULL, 'CPU 2 nhân, RAM 4GB', 'CPU 4 nhân, RAM 8GB', 'Approved', '2026-09-18 00:00:00'),
  ('G006', 'A006', 'Neon Courier', 'neon-courier', 'Game đua xe arcade miễn phí đưa thư qua thành phố tương lai.', 0, 'covers/g006.jpg', NULL, 'CPU 2 nhân, RAM 4GB', 'CPU 4 nhân, RAM 8GB', 'Approved', '2026-09-22 00:00:00'),
  ('G007', 'A007', 'Hành Trình Sao Bắc', 'hanh-trinh-sao-bac', 'Nhập vai khám phá quần đảo và giải mã những chòm sao cổ.', 179000, 'covers/g007.jpg', NULL, 'CPU 4 nhân, RAM 8GB', 'CPU 6 nhân, RAM 16GB', 'Approved', '2026-09-30 00:00:00'),
  ('G008', 'A007', 'Mê Cung Thủy Tinh', 'me-cung-thuy-tinh', 'Giải đố trong mê cung thay đổi hình dạng theo từng lựa chọn.', 69000, 'covers/g008.jpg', NULL, 'CPU 2 nhân, RAM 4GB', 'CPU 4 nhân, RAM 8GB', 'Approved', '2026-10-02 00:00:00'),
  ('G009', 'A007', 'Iron Harbor Tactics', 'iron-harbor-tactics', 'Chiến thuật theo lượt về một cảng biển công nghiệp giả tưởng.', 99000, 'covers/g009.jpg', NULL, 'CPU 2 nhân, RAM 4GB', 'CPU 4 nhân, RAM 8GB', 'Approved', '2026-10-05 00:00:00'),
  ('G010', 'A003', 'Bóng Đêm Ở Đồi Sương', 'bong-dem-o-doi-suong', 'Phiêu lưu kinh dị điều tra một thị trấn miền núi bị bỏ hoang.', 119000, 'covers/g010.jpg', NULL, 'CPU 4 nhân, RAM 8GB', 'CPU 6 nhân, RAM 16GB', 'Approved', '2026-10-08 00:00:00'),
  ('G011', 'A006', 'Skyline Skater', 'skyline-skater', 'Trượt ván qua những mái nhà và đường ray trên cao.', 149000, 'covers/g011.jpg', NULL, 'CPU 2 nhân, RAM 4GB', 'CPU 4 nhân, RAM 8GB', 'Approved', '2026-10-10 00:00:00'),
  ('G012', 'A006', 'Bếp Nhỏ Hội An', 'bep-nho-hoi-an', 'Mô phỏng quản lý quán ăn nhỏ với các món ăn và nguyên liệu địa phương.', 59000, 'covers/g012.jpg', NULL, 'CPU 2 nhân, RAM 4GB', 'CPU 4 nhân, RAM 8GB', 'Approved', '2026-10-12 00:00:00'),
  ('G013', 'A006', 'Redline Delta', 'redline-delta', 'Đua xe tốc độ cao trên những cung đường ven sông.', 159000, 'covers/g013.jpg', NULL, 'CPU 4 nhân, RAM 8GB', 'CPU 6 nhân, RAM 16GB', 'Approved', '2026-10-14 00:00:00'),
  ('G014', 'A006', 'Lục Địa Cổ Thư', 'luc-dia-co-thu', 'Nhập vai chiến thuật trong thế giới được ghi chép bằng những cổ thư.', 199000, 'covers/g014.jpg', NULL, 'CPU 4 nhân, RAM 8GB', 'CPU 6 nhân, RAM 16GB', 'Approved', '2026-10-16 00:00:00'),
  ('G015', 'A006', 'Thành Phố Sau Mưa', 'thanh-pho-sau-mua', 'Phiêu lưu giải đố tìm lại ký ức trong thành phố ven biển.', 79000, 'covers/g015.jpg', NULL, 'CPU 2 nhân, RAM 4GB', 'CPU 4 nhân, RAM 8GB', 'Approved', '2026-10-18 00:00:00'),
  ('G016', 'A006', 'Forest Keeper', 'forest-keeper', 'Mô phỏng quản lý khu rừng và cân bằng hệ sinh thái.', 109000, 'covers/g016.jpg', NULL, 'CPU 2 nhân, RAM 4GB', 'CPU 4 nhân, RAM 8GB', 'Approved', '2026-10-20 00:00:00'),
  ('G017', 'A006', 'Pixel Monsoon', 'pixel-monsoon', 'Đi cảnh miễn phí qua những màn chơi lấy cảm hứng từ mùa mưa.', 0, 'covers/g017.jpg', NULL, 'CPU 2 nhân, RAM 4GB', 'CPU 4 nhân, RAM 8GB', 'Approved', '2026-10-22 00:00:00'),
  ('G018', 'A007', 'Lotus Starship', 'lotus-starship', 'Hành động chiến thuật trong các trận chiến tàu vũ trụ.', 189000, 'covers/g018.jpg', NULL, 'CPU 4 nhân, RAM 8GB', 'CPU 6 nhân, RAM 16GB', 'Approved', '2026-10-24 00:00:00'),
  ('G019', 'A007', 'Đảo Mộng Mơ', 'dao-mong-mo', 'Giải đố nhẹ nhàng trên quần đảo với những nhân vật kỳ thú.', 49000, 'covers/g019.jpg', NULL, 'CPU 2 nhân, RAM 4GB', 'CPU 4 nhân, RAM 8GB', 'Approved', '2026-10-26 00:00:00'),
  ('G020', 'A007', 'Silent Ward', 'silent-ward', 'Kinh dị sinh tồn trong một bệnh viện mất điện.', 99000, 'covers/g020.jpg', NULL, 'CPU 4 nhân, RAM 8GB', 'CPU 6 nhân, RAM 16GB', 'Approved', '2026-10-28 00:00:00'),
  ('G021', 'A007', 'Champions of Saigon', 'champions-of-saigon', 'Thể thao đối kháng theo đội với chế độ thi đấu chiến thuật.', 129000, 'covers/g021.jpg', NULL, 'CPU 2 nhân, RAM 4GB', 'CPU 4 nhân, RAM 8GB', 'Approved', '2026-10-30 00:00:00'),
  ('G022', 'A007', 'Tiny Workshop', 'tiny-workshop', 'Mô phỏng chế tạo vật dụng trong một xưởng nhỏ ấm cúng.', 79000, 'covers/g022.jpg', NULL, 'CPU 2 nhân, RAM 4GB', 'CPU 4 nhân, RAM 8GB', 'Approved', '2026-11-01 00:00:00'),
  ('G023', 'A007', 'Aurora Circuit', 'aurora-circuit', 'Đua xe arcade trên những đường đua phủ ánh cực quang.', 139000, 'covers/g023.jpg', NULL, 'CPU 2 nhân, RAM 4GB', 'CPU 4 nhân, RAM 8GB', 'Approved', '2026-11-03 00:00:00'),
  -- 12 Game tiêu biểu với hình ảnh và video chuẩn:
  ('4062f680-6ca3-4382-a191-27f44e853bcc', 'A003', 'Sudoku Classic', 'sudoku', 'Giải các bảng Sudoku cổ điển với nhiều mức độ thử thách rèn luyện trí tuệ.', 0, '/api/media/games/sudoku/sudoku-cover.jpg', NULL, 'Trình duyệt hiện đại.', 'Trình duyệt hiện đại.', 'Approved', '2026-11-01 00:00:00'),
  ('10abda67-23bc-4ce7-a65c-5aeb2609e915', 'A007', 'Marvel''s Spider-Man', 'spider-man', 'Game hành động phiêu lưu đu tơ nhện tốc độ cao bảo vệ thành phố New York.', 1299000, '/api/media/games/spider-man/spider-man-cover.jpeg', NULL, 'CPU Core i5, RAM 8GB, GTX 1060', 'CPU Core i7, RAM 16GB, RTX 3060', 'Approved', '2026-11-01 00:00:00'),
  ('335a42d6-86bc-461b-8be2-c2a41d6e42a9', 'A007', 'R.E.P.O.', 'repo', 'Game kinh dị phối hợp thu thập cổ vật kỳ quái cùng đồng đội dưới lòng đất.', 149000, '/api/media/games/repo/repo-cover.jpg', NULL, 'CPU Core i3, RAM 8GB, GTX 960', 'CPU Core i5, RAM 16GB, GTX 1660', 'Approved', '2026-11-01 00:00:00'),
  ('0c604156-99c9-43c7-9418-6fe59e55ec43', 'A006', 'Dragon Ball: Sparking! ZERO', 'dragon-ball', 'Đấu trường đối kháng 3D đỉnh cao với dàn chiến binh Saiyan huyền thoại.', 1490000, '/api/media/games/dragon-ball/dragon-ball-cover.jpeg', NULL, 'CPU Core i5, RAM 8GB, GTX 1060', 'CPU Core i7, RAM 16GB, RTX 2070', 'Approved', '2026-11-01 00:00:00'),
  ('2ae9b50b-5e46-4bfc-80a2-4026e4cd425f', 'A006', 'Ma Sói (Agrou - Werewolf)', 'ma-soi', 'Game suy luận xã hội nhiều người chơi kịch tính quanh đống lửa làng cổ.', 140000, '/api/media/games/ma-soi/ma-soi-cover.jpeg', NULL, 'CPU Dual-core, RAM 4GB', 'CPU Core i3, RAM 8GB', 'Approved', '2026-11-01 00:00:00'),
  ('77af5bcf-2166-4e4b-9d0a-1c8464a79034', 'A006', 'Sky: Children of the Light', 'sky-children-of-the-light', 'Game phiêu lưu đầy thi vị, mang lại cảm giác bình yên và gắn kết bạn bè.', 0, '/api/media/games/sky-children-of-the-light/sky-children-of-the-light-cover.png', '/api/media/games/sky-children-of-the-light/sky-children-of-the-light-trailer.mp4', 'Trình duyệt hiện đại.', 'Trình duyệt hiện đại.', 'Approved', '2026-11-01 00:00:00'),
  ('a0a83077-1b60-47cd-bfe9-c0f572dd3e61', 'A007', 'Marvel Rivals: Dr. Doom', 'dr-doom-throne', 'Game bắn súng chiến thuật theo đội hình anh hùng Marvel độc đáo.', 450000, '/api/media/games/dr-doom-throne/dr-doom-throne-cover.jpg', NULL, 'CPU Core i5, RAM 8GB, GTX 1060', 'CPU Core i7, RAM 16GB, RTX 3070', 'Approved', '2026-11-01 00:00:00'),
  ('105c2452-1568-4112-8dad-4a845ed49054', 'A007', 'Squid Game: The Challenge', 'squid-game', 'Vượt qua các trò chơi sinh tồn gay cấn để giành lấy giải thưởng khổng lồ.', 180000, '/api/media/games/squid-game/squid-game-cover.jpeg', NULL, 'CPU Core i3, RAM 8GB', 'CPU Core i5, RAM 16GB', 'Approved', '2026-11-01 00:00:00'),
  ('6397c897-5ed9-4c01-9636-d244dc958e82', 'A003', 'Wuthering Waves', 'wuthering-waves', 'Game nhập vai thế giới mở hậu tận thế với hệ thống chiến đấu mãn nhãn.', 0, '/api/media/games/wuthering-waves/wuthering-waves-cover.jpg', '/api/media/games/wuthering-waves/wuthering-waves-trailer.mp4', 'CPU Core i5, RAM 8GB, GTX 1060', 'CPU Core i7, RAM 16GB, RTX 2060', 'Approved', '2026-11-01 00:00:00'),
  ('997cc33e-7a1e-4dbd-b0f4-63f463f909f0', 'A006', 'Genshin Impact', 'genshin-impact', 'Khám phá thế giới Teyvat kỳ diệu cùng hàng chục nhân vật sở hữu sức mạnh nguyên tố.', 0, '/api/media/games/genshin-impact/genshin-impact-cover.jpeg', '/api/media/games/genshin-impact/genshin-impact-trailer.mp4', 'CPU Core i5, RAM 8GB, GTX 1060', 'CPU Core i7, RAM 16GB, GTX 1660 Ti', 'Approved', '2026-11-01 00:00:00'),
  ('1f1e3734-3a06-4bad-9bd1-7d5ee19da93b', 'A003', 'Retro Snake', 'snake', 'Rắn săn mồi cổ điển quen thuộc với đồ họa retro arcade phong cách hoài niệm.', 0, '/api/media/games/snake/snake-cover.jpg', NULL, 'Trình duyệt hiện đại.', 'Trình duyệt hiện đại.', 'Approved', '2026-11-01 00:00:00'),
  ('77e0f14a-1617-49d1-80ab-e5cc594c8464', 'A003', 'Tetris Effect', 'tetris', 'Game xếp gạch cổ điển kết hợp âm nhạc huyền ảo và hiệu ứng thị giác đỉnh cao.', 120000, '/api/media/games/tetris/tetris-cover.jpg', NULL, 'Trình duyệt hiện đại.', 'Trình duyệt hiện đại.', 'Approved', '2026-11-01 00:00:00');

-- ---------------------------------------------------------------------
-- 5. GÁN THỂ LOẠI CHO GAME (GAME_GENRE)
-- ---------------------------------------------------------------------
INSERT INTO GAME_GENRE (GameID, GenreID) VALUES
  ('G001', 'GN01'), ('G001', 'GN03'),
  ('G002', 'GN02'),
  ('G003', 'GN04'),
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
  ('G023', 'GN04'), ('G023', 'GN01'),
  ('4062f680-6ca3-4382-a191-27f44e853bcc', 'GN05'), ('4062f680-6ca3-4382-a191-27f44e853bcc', 'GN11'),
  ('10abda67-23bc-4ce7-a65c-5aeb2609e915', 'GN01'), ('10abda67-23bc-4ce7-a65c-5aeb2609e915', 'GN06'),
  ('335a42d6-86bc-461b-8be2-c2a41d6e42a9', 'GN08'), ('335a42d6-86bc-461b-8be2-c2a41d6e42a9', 'GN12'),
  ('0c604156-99c9-43c7-9418-6fe59e55ec43', 'GN17'), ('0c604156-99c9-43c7-9418-6fe59e55ec43', 'GN01'),
  ('2ae9b50b-5e46-4bfc-80a2-4026e4cd425f', 'GN13'), ('2ae9b50b-5e46-4bfc-80a2-4026e4cd425f', 'GN07'),
  ('77af5bcf-2166-4e4b-9d0a-1c8464a79034', 'GN06'), ('77af5bcf-2166-4e4b-9d0a-1c8464a79034', 'GN11'),
  ('a0a83077-1b60-47cd-bfe9-c0f572dd3e61', 'GN01'), ('a0a83077-1b60-47cd-bfe9-c0f572dd3e61', 'GN13'),
  ('105c2452-1568-4112-8dad-4a845ed49054', 'GN16'), ('105c2452-1568-4112-8dad-4a845ed49054', 'GN11'),
  ('6397c897-5ed9-4c01-9636-d244dc958e82', 'GN03'), ('6397c897-5ed9-4c01-9636-d244dc958e82', 'GN14'),
  ('997cc33e-7a1e-4dbd-b0f4-63f463f909f0', 'GN03'), ('997cc33e-7a1e-4dbd-b0f4-63f463f909f0', 'GN14'),
  ('1f1e3734-3a06-4bad-9bd1-7d5ee19da93b', 'GN05'), ('1f1e3734-3a06-4bad-9bd1-7d5ee19da93b', 'GN11'),
  ('77e0f14a-1617-49d1-80ab-e5cc594c8464', 'GN05'), ('77e0f14a-1617-49d1-80ab-e5cc594c8464', 'GN11');

-- ---------------------------------------------------------------------
-- 6. PHIÊN BẢN GÓI BUILD (GAMEVERSION)
-- ---------------------------------------------------------------------
INSERT INTO GAMEVERSION (VersionID, GameID, VersionNumber, BuildFile, FileSize, Sha256, ChangeLog, UploadDate, IsCurrent) VALUES
  ('V001', 'G001', '1.0.0', 'games/G001/1.0.0/build.zip', 52428800, 'a2392c7d5768c43fc6d6ba86d2d456250b7faa6aa1b3d1673805c64c03beda79', 'Bản phát hành đầu tiên', '2026-11-01 14:00:00', 0),
  ('V002', 'G001', '1.1.0', 'games/G001/1.1.0/build.zip', 53477376, 'f41ebb21122b38a639e4527dfa28ea00121ad7dede7cb0be09e613c575ed6f4a', 'Sửa lỗi treo máy, thêm boss mới', '2026-11-08 10:30:00', 1),
  ('V003', 'G002', '1.0.0', 'games/G002/1.0.0/build.zip', 20971520, 'cdaded0be586d5d16bb2ffbdc6056b461aa45c92dfe03e30a8b780063f9646e9', 'Bản phát hành đầu tiên', '2026-11-01 14:30:00', 1),
  ('V004', 'G003', '1.0.0', 'games/G003/1.0.0/build.zip', 73400320, 'a62362543903b3399013f07a12fde20259bbb3bf4cb8005d7dd9f60385190264', 'Bản phát hành đầu tiên', '2026-11-04 09:00:00', 1),
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
  ('V024', 'G023', '1.0.0', 'games/G023/1.0.0/build.zip', 62914560, NULL, 'Bản mẫu đầu tiên', '2026-11-03 10:00:00', 1),
  ('V025', '4062f680-6ca3-4382-a191-27f44e853bcc', '1.0.0', 'developers/A003/games/4062f680-6ca3-4382-a191-27f44e853bcc/1.0.0/build.zip', 5242880, NULL, 'Phiên bản Sudoku 1.0.0', '2026-11-01 10:00:00', 1),
  ('V026', '10abda67-23bc-4ce7-a65c-5aeb2609e915', '1.0.0', 'developers/A007/games/10abda67-23bc-4ce7-a65c-5aeb2609e915/1.0.0/build.zip', 1848, 'e86315182cd311d375ed544682ae77827608e07100164104c2fe17b16a300f26', 'Phiên bản Spider-Man 1.0.0', '2026-11-01 10:00:00', 1),
  ('V027', '335a42d6-86bc-461b-8be2-c2a41d6e42a9', '1.0.0', 'developers/A007/games/335a42d6-86bc-461b-8be2-c2a41d6e42a9/1.0.0/build.zip', 1834, 'e59c69e26d7b1798123f962eed6e7ab76a9aeda0b779b1596b3c665849026a87', 'Phiên bản REPO 1.0.0', '2026-11-01 10:00:00', 1),
  ('V028', '0c604156-99c9-43c7-9418-6fe59e55ec43', '1.0.0', 'developers/A006/games/0c604156-99c9-43c7-9418-6fe59e55ec43/1.0.0/build.zip', 1864, '4df20651a30ef3f771ea5493d5f8e95943cda8228b96231e6478493971db8b53', 'Phiên bản Dragon Ball 1.0.0', '2026-11-01 10:00:00', 1),
  ('V029', '2ae9b50b-5e46-4bfc-80a2-4026e4cd425f', '1.0.0', 'developers/A006/games/2ae9b50b-5e46-4bfc-80a2-4026e4cd425f/1.0.0/build.zip', 1862, '1b3b1b11b9d2a05e35182dee251fa34152867fa3f414236fc23b937b2722106e', 'Phiên bản Ma Sói 1.0.0', '2026-11-01 10:00:00', 1),
  ('V030', '77af5bcf-2166-4e4b-9d0a-1c8464a79034', '1.0.0', 'developers/A006/games/77af5bcf-2166-4e4b-9d0a-1c8464a79034/1.0.0/build.zip', 1858, '214261aecb7d36aa306d4c72bcef66f27fd24698b518c389081d95a7a82b5c74', 'Phiên bản Sky Children 1.0.0', '2026-11-01 10:00:00', 1),
  ('V031', 'a0a83077-1b60-47cd-bfe9-c0f572dd3e61', '1.0.0', 'developers/A007/games/a0a83077-1b60-47cd-bfe9-c0f572dd3e61/1.0.0/build.zip', 1856, '6be48ff65625d5ad7db05db62b3de004ec523456ff4a32e96c4b4a85ff518ba5', 'Phiên bản Dr Doom 1.0.0', '2026-11-01 10:00:00', 1),
  ('V032', '105c2452-1568-4112-8dad-4a845ed49054', '1.0.0', 'developers/A007/games/105c2452-1568-4112-8dad-4a845ed49054/1.0.0/build.zip', 1858, '91b0ed03c755d8ccb363cd0df2aca5710f08482205b262b3f9f3badecb293666', 'Phiên bản Squid Game 1.0.0', '2026-11-01 10:00:00', 1),
  ('V033', '6397c897-5ed9-4c01-9636-d244dc958e82', '1.0.0', 'developers/A003/games/6397c897-5ed9-4c01-9636-d244dc958e82/1.0.0/build.zip', 1841, '0847be42fd90f20cc0e5f40444e0ccd3c26bd62be70525fd74db7932a7c2425e', 'Phiên bản Wuthering Waves 1.0.0', '2026-11-01 10:00:00', 1),
  ('V034', '997cc33e-7a1e-4dbd-b0f4-63f463f909f0', '1.0.0', 'developers/A006/games/997cc33e-7a1e-4dbd-b0f4-63f463f909f0/1.0.0/build.zip', 1840, 'bd78b9c1b8d9e55afcdd4d212e656054819c96a6117d1fb547b87e1c39fbe084', 'Phiên bản Genshin Impact 1.0.0', '2026-11-01 10:00:00', 1),
  ('V035', '1f1e3734-3a06-4bad-9bd1-7d5ee19da93b', '1.0.0', 'developers/A003/games/1f1e3734-3a06-4bad-9bd1-7d5ee19da93b/1.0.0/build.zip', 5242880, NULL, 'Phiên bản Snake 1.0.0', '2026-11-01 10:00:00', 1),
  ('V036', '77e0f14a-1617-49d1-80ab-e5cc594c8464', '1.0.0', 'developers/A003/games/77e0f14a-1617-49d1-80ab-e5cc594c8464/1.0.0/build.zip', 10485760, NULL, 'Phiên bản Tetris 1.0.0', '2026-11-01 10:00:00', 1);

-- ---------------------------------------------------------------------
-- 7. MÃ KÍCH HOẠT (ACTIVATION KEYS)
-- ---------------------------------------------------------------------
INSERT INTO ACTIVATIONKEY (KeyID, KeyCode, GameID, Status, CreatedDate, ActivatedDate, RedeemedBy) VALUES
  ('K001', 'DRGN1-8F2KQ-77XPA', 'G001', 'Used', '2026-11-01 15:00:00', '2026-11-09 20:00:00', 'A005'),
  ('K002', 'DRGN1-3H9TZ-21MQB', 'G001', 'Unused', '2026-11-01 15:00:00', NULL, NULL),
  ('K003', 'PIXFM-5R7LC-90WDE', 'G002', 'Unused', '2026-11-01 15:05:00', NULL, NULL),
  ('K004', 'MEK04-8F2KQ-77XPA', 'G004', 'Unused', '2026-09-10 10:30:00', NULL, NULL),
  ('K005', 'NEON6-3H9TZ-21MQB', 'G006', 'Unused', '2026-09-22 10:30:00', NULL, NULL),
  ('K006', 'HARB9-5R7LC-90WDE', 'G009', 'Unused', '2026-10-05 10:30:00', NULL, NULL),
  ('K007', 'BEP12-4T8NX-31QWE', 'G012', 'Unused', '2026-10-12 10:30:00', NULL, NULL),
  ('K008', 'RAIN5-9K2LM-44PZX', 'G015', 'Unused', '2026-10-18 10:30:00', NULL, NULL),
  ('K009', 'LOT18-6V3BN-82JHA', 'G018', 'Unused', '2026-10-24 10:30:00', NULL, NULL),
  ('K010', 'WARD0-7C4DP-15MNS', 'G020', 'Unused', '2026-10-28 10:30:00', NULL, NULL),
  ('K011', 'AUR23-2X5FG-93RKT', 'G023', 'Unused', '2026-11-03 10:30:00', NULL, NULL),
  ('K012', 'SPIDER-ABCD-1234', '10abda67-23bc-4ce7-a65c-5aeb2609e915', 'Unused', '2026-11-01 10:00:00', NULL, NULL),
  ('K013', 'REPO-TEAM-7890', '335a42d6-86bc-461b-8be2-c2a41d6e42a9', 'Unused', '2026-11-01 10:00:00', NULL, NULL),
  ('K014', 'DBZ-SUPER-4567', '0c604156-99c9-43c7-9418-6fe59e55ec43', 'Unused', '2026-11-01 10:00:00', NULL, NULL);

-- ---------------------------------------------------------------------
-- 8. CHIẾN DỊCH KHUYẾN MÃI (SALE CAMPAIGNS)
-- ---------------------------------------------------------------------
INSERT INTO SALECAMPAIGN (CampaignID, GameID, PercentOff, StartDate, EndDate) VALUES
  ('C001', 'G001', 30, '2026-11-10 00:00:00', '2026-11-24 23:59:59'),
  ('C002', 'G002', 50, '2026-11-10 00:00:00', '2026-11-17 23:59:59'),
  ('C003', 'G003', 20, '2026-11-11 00:00:00', '2026-11-18 23:59:59'),
  ('C004', 'G005', 25, '2026-11-15 00:00:00', '2026-12-01 23:59:59'),
  ('C005', 'G011', 15, '2026-11-15 00:00:00', '2026-12-01 23:59:59'),
  ('C006', 'G015', 30, '2026-11-15 00:00:00', '2026-12-01 23:59:59'),
  ('C007', 'G020', 40, '2026-11-15 00:00:00', '2026-12-01 23:59:59'),
  ('C008', 'G023', 20, '2026-11-15 00:00:00', '2026-12-01 23:59:59'),
  ('C009', '10abda67-23bc-4ce7-a65c-5aeb2609e915', 20, '2026-11-01 00:00:00', '2026-12-31 23:59:59');

-- ---------------------------------------------------------------------
-- 9. GIỎ HÀNG (CARTS)
-- ---------------------------------------------------------------------
INSERT INTO CART (CustomerID) VALUES
  ('A003'),
  ('A004'),
  ('A005'),
  ('A008'),
  ('A009');

INSERT INTO CARTITEM (CustomerID, GameID, PriceAtAdd) VALUES
  ('A004', 'G002', 99000),
  ('A005', 'G003', 149000),
  ('A008', 'G007', 179000),
  ('A008', 'G020', 99000),
  ('A009', 'G013', 159000),
  ('A009', 'G021', 129000);

-- ---------------------------------------------------------------------
-- 10. MÃ GIẢM GIÁ (COUPONS)
-- ---------------------------------------------------------------------
INSERT INTO COUPON (CouponID, Code, DiscountValue, ExpiryDate, UsageLimit, UsedCount, DeveloperID, GameID) VALUES
  ('CP01', 'WELCOME20', 20000, '2026-12-31 23:59:59', 100, 1, NULL, NULL),
  ('CP02', 'NVH50K', 50000, '2026-12-15 23:59:59', 50, 0, 'A003', 'G001');

-- ---------------------------------------------------------------------
-- 11. ĐƠN HÀNG VÀ CHI TIẾT ĐƠN HÀNG (ORDERS & ORDERITEMS)
-- ---------------------------------------------------------------------
INSERT INTO ORDERS (OrderID, CustomerID, CouponID, OrderDate, TotalAmount, Status) VALUES
  ('O001', 'A004', 'CP01', '2026-11-08 09:15:00', 179000, 'Completed'),
  ('O002', 'A005', NULL, '2026-11-10 10:20:00', 49500, 'Refunded'),
  ('O003', 'A005', NULL, '2026-11-11 08:30:00', 49500, 'Completed'),
  ('O004', 'A008', NULL, '2026-11-13 10:15:00', 129000, 'Completed'),
  ('O005', 'A008', NULL, '2026-11-14 11:20:00', 59000, 'Completed'),
  ('O006', 'A009', NULL, '2026-11-15 12:25:00', 189000, 'Completed'),
  ('O007', 'A009', NULL, '2026-11-16 13:30:00', 79000, 'Completed');

INSERT INTO ORDERITEM (OrderID, GameID, UnitPrice, PriceAfterDiscount) VALUES
  ('O001', 'G001', 199000, 179000),
  ('O002', 'G002', 99000, 49500),
  ('O003', 'G002', 99000, 49500),
  ('O004', 'G004', 129000, 129000),
  ('O005', 'G012', 59000, 59000),
  ('O006', 'G018', 189000, 189000),
  ('O007', 'G022', 79000, 79000);

-- ---------------------------------------------------------------------
-- 12. BẢN QUYỀN SỞ HỮU (LICENSES)
-- ---------------------------------------------------------------------
INSERT INTO LICENSE (LicenseID, CustomerID, GameID, Source, PurchaseDate, AccessToken, Status, RevokedAt, RevokedReason) VALUES
  ('L001', 'A004', 'G001', 'Purchase', '2026-11-08 09:15:00', '668b2245fe89b82c883add46d887175478e14a1467e264169755830659ff4c4b', 'Active', NULL, NULL),
  ('L002', 'A005', 'G002', 'Purchase', '2026-11-10 10:20:00', 'cb62aa9e04da6a47f9ffe7c42df84d7f3248d4645bab50dc88c65b73872d2091', 'Revoked', '2026-11-10 13:45:00', 'Refund'),
  ('L003', 'A005', 'G001', 'Key', '2026-11-09 20:00:00', '47892b4437ca5f00bb92da7fd8873601bc276329ad05dd0dcd56ebdbaff1f00b', 'Active', NULL, NULL),
  ('L004', 'A005', 'G002', 'Purchase', '2026-11-11 08:30:00', '1f26f7db509ed22b6292914e9e645e087137d0e99a9c3edb744ea57b709278d0', 'Active', NULL, NULL),
  ('L005', 'A008', 'G004', 'Purchase', '2026-11-13 10:15:00', 'f933fca1ed1e1f3f1e9160d55e4c460b9cb663f34fc70c5eb167563557afa60c', 'Active', NULL, NULL),
  ('L006', 'A008', 'G012', 'Purchase', '2026-11-14 11:20:00', '1726b93dd05f2fdb46ba299f3df9f4e11b8f0e5bcccab38807a94edeb09646c1', 'Active', NULL, NULL),
  ('L007', 'A009', 'G018', 'Purchase', '2026-11-15 12:25:00', 'ff16ff2cfd6034ca9110ff2726dc7573baa17465dbcd0494441f218e7d11e3c5', 'Active', NULL, NULL),
  ('L008', 'A009', 'G022', 'Purchase', '2026-11-16 13:30:00', '5366db0c2d8c88573916264674b32c318b5a2c68b60d36e068d3f6a9d0c856a0', 'Active', NULL, NULL),
  ('L009', 'A004', '4062f680-6ca3-4382-a191-27f44e853bcc', 'Purchase', '2026-11-01 10:00:00', 'e933fca1ed1e1f3f1e9160d55e4c460b9cb663f34fc70c5eb167563557afa60d', 'Active', NULL, NULL);

-- ---------------------------------------------------------------------
-- 13. DANH SÁCH MONG MUỐN (WISHLIST)
-- ---------------------------------------------------------------------
INSERT INTO WISHLISTITEM (CustomerID, GameID, AddedDate) VALUES
  ('A004', 'G003', '2026-11-09 18:00:00'),
  ('A005', 'G003', '2026-11-10 22:15:00'),
  ('A008', 'G023', '2026-11-15 20:00:00'),
  ('A009', 'G005', '2026-11-16 20:00:00');

-- ---------------------------------------------------------------------
-- 14. ĐÁNH GIÁ (REVIEWS)
-- ---------------------------------------------------------------------
INSERT INTO REVIEW (ReviewID, CustomerID, GameID, Rating, Content, ReviewDate, Status) VALUES
  ('RV01', 'A004', 'G001', 5, 'Đồ họa đẹp, boss rất cuốn', '2026-11-09 21:30:00', 'Visible'),
  ('RV02', 'A005', 'G001', 4, 'Hay nhưng hơi dài', '2026-11-10 20:00:00', 'Visible'),
  ('RV03', 'A005', 'G002', 1, 'Nội dung không phù hợp (đã bị ẩn)', '2026-11-11 09:00:00', 'Hidden'),
  ('RV04', 'A008', 'G004', 5, 'Không khí phiêu lưu thú vị và chạy ổn định.', '2026-11-14 18:00:00', 'Visible'),
  ('RV05', 'A008', 'G012', 4, 'Mô phỏng thư giãn, nội dung mẫu đa dạng.', '2026-11-15 18:00:00', 'Visible'),
  ('RV06', 'A009', 'G018', 5, 'Các trận chiến chiến thuật có nhịp độ tốt.', '2026-11-16 18:00:00', 'Visible'),
  ('RV07', 'A009', 'G022', 4, 'Một game mô phỏng nhẹ nhàng để chơi ngắn.', '2026-11-17 18:00:00', 'Visible');

-- ---------------------------------------------------------------------
-- 15. YÊU CẦU HOÀN TIỀN (REFUND REQUESTS)
-- ---------------------------------------------------------------------
INSERT INTO REFUNDREQUEST (RequestID, OrderID, GameID, Reason, RequestDate, Status, HoursSincePurchase) VALUES
  ('RF01', 'O002', 'G002', 'Game không chạy được trên máy của tôi', '2026-11-10 13:40:00', 'Approved', 3),
  ('RF02', 'O001', 'G001', 'Đổi ý, không muốn chơi nữa', '2026-11-10 14:00:00', 'Rejected', 52);

-- ---------------------------------------------------------------------
-- 16. VÍ VÀ GIAO DỊCH (WALLET & TRANSACTIONS)
-- ---------------------------------------------------------------------
INSERT INTO WALLET (WalletID, CustomerID, Balance, Currency) VALUES
  ('W001', 'A003', 50000, 'VND'),
  ('W002', 'A004', 321000, 'VND'),
  ('W003', 'A005', 150500, 'VND'),
  ('W004', 'A008', 62000, 'VND'),
  ('W005', 'A009', 32000, 'VND');

INSERT INTO `TRANSACTION` (TransID, WalletID, OrderID, Type, Amount, TransDate, Status, Detail) VALUES
  ('T01', 'W002', NULL, 'Deposit', 500000, '2026-11-08 09:00:00', 'Success', 'Nạp tiền vào ví qua ngân hàng'),
  ('T02', 'W002', 'O001', 'Purchase', 179000, '2026-11-08 09:15:00', 'Success', 'Mua game Rồng Lửa Online'),
  ('T03', 'W003', NULL, 'Deposit', 200000, '2026-11-10 10:00:00', 'Success', 'Nạp tiền vào ví'),
  ('T04', 'W003', 'O002', 'Purchase', 49500, '2026-11-10 10:20:00', 'Success', 'Mua game Pixel Farm'),
  ('T05', 'W003', 'O002', 'Refund', 49500, '2026-11-10 13:45:00', 'Success', 'Hoàn tiền game Pixel Farm'),
  ('T06', 'W003', 'O003', 'Purchase', 49500, '2026-11-11 08:30:00', 'Success', 'Mua game Pixel Farm'),
  ('T07', 'W001', NULL, 'Deposit', 150000, '2026-11-01 08:00:00', 'Success', 'Nạp tiền phí phát hành'),
  ('T08', 'W001', NULL, 'Fee', 100000, '2026-11-01 08:05:00', 'Success', 'Phí đăng ký Steam Direct'),
  ('T09', 'W004', NULL, 'Deposit', 250000, '2026-11-13 10:00:00', 'Success', 'Nạp tiền vào ví'),
  ('T10', 'W004', 'O004', 'Purchase', 129000, '2026-11-13 10:15:00', 'Success', 'Mua game Mekong: Delta Guardians'),
  ('T11', 'W004', 'O005', 'Purchase', 59000, '2026-11-14 11:20:00', 'Success', 'Mua game Bếp Nhỏ Hội An'),
  ('T12', 'W005', NULL, 'Deposit', 300000, '2026-11-15 12:00:00', 'Success', 'Nạp tiền vào ví'),
  ('T13', 'W005', 'O006', 'Purchase', 189000, '2026-11-15 12:25:00', 'Success', 'Mua game Lotus Starship'),
  ('T14', 'W005', 'O007', 'Purchase', 79000, '2026-11-16 13:30:00', 'Success', 'Mua game Tiny Workshop');

-- ---------------------------------------------------------------------
-- 17. YÊU CẦU RÚT TIỀN (WITHDRAWAL REQUESTS)
-- ---------------------------------------------------------------------
INSERT INTO WITHDRAWALREQUEST (RequestID, DeveloperID, Amount, BankInfo, Status, RequestDate) VALUES
  ('WD01', 'A003', 200000, 'VCB - 0123456789 - NVH STUDIO', 'Pending', '2026-11-11 09:00:00');

-- ---------------------------------------------------------------------
-- 18. THÔNG BÁO (NOTIFICATIONS)
-- ---------------------------------------------------------------------
INSERT INTO NOTIFICATION (NotificationID, AccountID, Type, Content, SentAt, IsRead) VALUES
  ('N01', 'A005', 'WishlistSale', 'Neon Racer trong danh sách mong ước đang giảm 20%', '2026-11-11 00:05:00', 0),
  ('N02', 'A005', 'Refund', 'Yêu cầu hoàn tiền đơn O002 đã được duyệt', '2026-11-10 13:45:00', 1),
  ('N03', 'A003', 'GameApproved', 'Game Neon Racer đã được phê duyệt', '2026-11-05 10:00:00', 0),
  ('N04', 'A008', 'OrderCompleted', 'Đơn O004 đã hoàn tất.', '2026-11-13 10:15:00', 1),
  ('N05', 'A009', 'WishlistSale', 'Cloud Village: Farm Days đang giảm giá.', '2026-11-16 00:05:00', 0);

-- ---------------------------------------------------------------------
-- 19. NHẬT KÝ QUẢN TRỊ (AUDIT LOGS)
-- ---------------------------------------------------------------------
INSERT INTO AUDITLOG (LogID, AccountID, Action, Target, LogAt, Detail) VALUES
  ('LG01', 'A001', 'role.create', 'ROLE:R01', '2026-10-30 09:00:00', 'Tạo vai trò GameModerator'),
  ('LG02', 'A002', 'game.approve', 'GAME:G001', '2026-11-02 08:30:00', 'Đạt tiêu chuẩn nội dung'),
  ('LG03', 'A002', 'game.reject', 'GAME:G003', '2026-11-01 16:00:00', 'Thiếu tệp build hợp lệ');

-- ---------------------------------------------------------------------
-- 20. DUYỆT GAME (GAME REVIEWS / MODERATION)
-- ---------------------------------------------------------------------
INSERT INTO GAMEREVIEW (CheckID, GameID, ManagerID, Decision, Reason, CheckedAt) VALUES
  ('CK01', 'G001', 'A002', 'Approved', NULL, '2026-11-02 08:30:00'),
  ('CK02', 'G002', 'A002', 'Approved', NULL, '2026-11-02 08:40:00'),
  ('CK03', 'G003', 'A002', 'Rejected', 'Thiếu tệp build hợp lệ', '2026-11-01 16:00:00'),
  ('CK04', 'G003', 'A002', 'Approved', NULL, '2026-11-05 10:00:00');

-- ---------------------------------------------------------------------
-- 21. BANNER QUẢNG BÁ (BANNERS)
-- ---------------------------------------------------------------------
INSERT INTO BANNER (BannerID, ImageUrl, LinkUrl, Title, StartDate, EndDate, SortOrder, IsActive, CreatedBy, CreatedAt) VALUES
  ('BN01', '/api/media/games/spider-man/spider-man-cover.jpeg', '/games/10abda67-23bc-4ce7-a65c-5aeb2609e915', 'Marvel''s Spider-Man - Siêu phẩm hành động', '2026-11-01 00:00:00', '2026-12-31 23:59:59', 1, 1, 'A001', '2026-11-01 00:00:00'),
  ('BN02', '/api/media/games/wuthering-waves/wuthering-waves-cover.jpg', '/games/6397c897-5ed9-4c01-9636-d244dc958e82', 'Wuthering Waves - Khám phá thế giới mở kỳ thú', '2026-11-01 00:00:00', '2026-12-31 23:59:59', 2, 1, 'A001', '2026-11-01 00:00:00'),
  ('BN03', '/api/media/games/genshin-impact/genshin-impact-cover.jpeg', '/games/997cc33e-7a1e-4dbd-b0f4-63f463f909f0', 'Genshin Impact - Hành trình bất tận', '2026-11-01 00:00:00', '2026-12-31 23:59:59', 3, 1, 'A001', '2026-11-01 00:00:00');
