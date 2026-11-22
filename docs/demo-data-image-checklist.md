# Danh sách ảnh cần bổ sung cho dữ liệu demo

Database lưu đường dẫn/object key trong cột ảnh, không lưu dữ liệu ảnh trực tiếp.

## Chạy seed demo local

Script tạo tài khoản demo, duyệt các game demo, nạp ví, mua game, ghi đánh giá và hoàn tiền cho một hóa đơn. Chạy kiểm tra file game trước mà không kết nối DB:

```powershell
cd backend
npm run db:seed-demo -- --check
```

Để seed DB local, đặt mật khẩu dùng chung cho tài khoản demo (ít nhất 12 ký tự) và xác nhận rõ môi trường:

```powershell
$env:SEED_DEMO_DATA = "1"
$env:DEMO_ACCOUNT_PASSWORD = "ThayBangMatKhauLocalItNhat12KyTu"
npm run db:seed-demo
```

Với Docker Compose, chạy từ thư mục gốc repo để cập nhật image backend trước, rồi seed khi service `backend` và `db` đã healthy:

```powershell
$env:SEED_DEMO_DATA = "1"
$env:DEMO_ACCOUNT_PASSWORD = "ThayBangMatKhauLocalItNhat12KyTu"
docker compose --env-file .env.docker up --build -d
docker compose --env-file .env.docker exec -e SEED_DEMO_DATA -e DEMO_ACCOUNT_PASSWORD backend npm run db:seed-demo
```

Sau khi chạy, đầu ra liệt kê tên đăng nhập, game, hóa đơn, đánh giá và yêu cầu hoàn tiền. Tài khoản được tạo mới dùng mật khẩu trong `DEMO_ACCOUNT_PASSWORD`; nếu tài khoản demo đã tồn tại, seed không thay đổi mật khẩu hiện có.

Không chạy lệnh seed khi DB được cấu hình trỏ tới môi trường thật. Seed có xác nhận `SEED_DEMO_DATA=1` và từ chối chạy khi `NODE_ENV=production`.


## Ảnh bìa game

Các bản ghi demo trong Docker hiện chưa có ảnh bìa:

- `covers/demo-tetris.webp` — Xếp Gạch Tetris
- `covers/demo-snake.webp` — Rắn Săn Mồi Cổ Điển
- `covers/demo-sudoku.webp` — Sudoku Trí Tuệ
- `covers/demo-minesweeper.webp` — Dò Mìn Cổ Điển

Đây là object key đề xuất; `CoverImage` của bốn game demo hiện để trống cho tới khi ảnh thật được tải lên.

Catalog mẫu cũng cần các ảnh bìa sau (key đã có trong DB; cần tải file ảnh vào kho lưu trữ):

| Object key | Tựa game |
| --- | --- |
| `covers/g001.jpg` | Rồng Lửa Online |
| `covers/g002.jpg` | Pixel Farm |
| `covers/g003.jpg` | Neon Racer |
| `covers/g004.jpg` | Mekong: Delta Guardians |
| `covers/g005.jpg` | Cloud Village: Farm Days |
| `covers/g006.jpg` | Neon Courier |
| `covers/g007.jpg` | Hành Trình Sao Bắc |
| `covers/g008.jpg` | Mê Cung Thủy Tinh |
| `covers/g009.jpg` | Iron Harbor Tactics |
| `covers/g010.jpg` | Bóng Đêm Ở Đồi Sương |
| `covers/g011.jpg` | Skyline Skater |
| `covers/g012.jpg` | Bếp Nhỏ Hội An |
| `covers/g013.jpg` | Redline Delta |
| `covers/g014.jpg` | Lục Địa Cổ Thư |
| `covers/g015.jpg` | Thành Phố Sau Mưa |
| `covers/g016.jpg` | Forest Keeper |
| `covers/g017.jpg` | Pixel Monsoon |
| `covers/g018.jpg` | Lotus Starship |
| `covers/g019.jpg` | Đảo Mộng Mơ |
| `covers/g020.jpg` | Silent Ward |
| `covers/g021.jpg` | Champions of Saigon |
| `covers/g022.jpg` | Tiny Workshop |
| `covers/g023.jpg` | Aurora Circuit |

## Banner trang chủ

Chưa có ảnh/banner mẫu trong bảng `BANNER`. Cần ảnh hero cho các chiến dịch/trang chủ và lưu object key vào `BANNER.ImageUrl`.

## Không có trường lưu trong schema hiện tại

- Gallery/screenshot nhiều ảnh cho một game: chưa có bảng hoặc cột tương ứng.
- Trailer: `GAME.TrailerUrl` là URL video, không phải ảnh.
- Ảnh đại diện: `ACCOUNT.AvatarUrl` có trường lưu, nhưng trang hồ sơ mới chỉ đọc và không sửa.

Định dạng khuyến nghị: WebP hoặc JPEG; ảnh bìa nên cùng một tỷ lệ khung hình, banner nên có tỷ lệ ngang rộng. Sau khi có ảnh, tải chúng lên kho lưu trữ rồi ghi object key tương ứng vào DB.
