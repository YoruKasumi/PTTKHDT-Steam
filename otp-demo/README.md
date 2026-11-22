# Demo OTP — Đăng ký tài khoản bằng mã OTP (Node.js + Express + MailDev)

Demo flow đăng ký **2 bước**: người dùng nhập thông tin → server gửi mã OTP qua email → người dùng nhập OTP đúng → lúc đó tài khoản mới **thật sự được tạo**. Không tạo tài khoản ngay ở bước đăng ký như trước, và **không có bất kỳ logic xác thực OTP nào ở phía client** (mọi kiểm tra đều nằm ở backend).

## 1. Tính năng đã cài đặt (đúng yêu cầu)

| Yêu cầu | Cài đặt ở đâu | Cách hoạt động |
|---|---|---|
| **OTP lưu dạng hash** | `src/services/otpStore.js` | OTP chỉ được lưu dưới dạng hash SHA-256 (hoặc HMAC-SHA256 nếu đặt `OTP_SECRET` trong `.env`), không bao giờ lưu OTP dạng plain |
| OTP trong RAM, không cần DB | `src/services/otpStore.js` | Dùng `Map` trong bộ nhớ — không cần thêm bảng/migration. Đổi lại: **restart server là mất các đăng ký đang chờ** (chấp nhận cho demo) |
| Sai OTP quá **5 lần** → khóa email | `otpStore.verify()` + controller | Lần sai thứ 5 record bị đánh dấu `locked: true`; từ đó nhập đúng mã cũng bị từ chối (HTTP 429) — **bắt buộc bấm "Gửi lại mã"** để nhận mã mới và được mở khóa |
| **Cooldown 10 giây** khi gửi lại | `otpStore.save()` + `canResend()` | Record lưu `resendAfter = thời điểm gửi + 10s`; cả `/auth/resend-otp` lẫn submit lại `/auth/register` đều bị từ chối (HTTP 429) nếu chưa đủ 10 giây — chống spam mail |
| OTP hết hạn 5 phút | `otpStore.get()` / `verify()` | Quá `expiresAt` thì record tự xóa, phải gửi lại mã |
| OTP dùng đúng 1 lần | `otpStore.verify()` | Đúng mã → record bị xóa ngay, nhập lại mã cũ nhận `NOT_FOUND` |
| Chống timing attack | `otpStore.verify()` | So hash bằng `crypto.timingSafeEqual` |
| Mật khẩu không nằm dạng thô trong dữ liệu chờ | `authController.register()` | Bcrypt hash mật khẩu **ngay ở bước register**, trước khi lưu vào `pendingData` |
| OTP ngẫu nhiên an toàn | `authController.generateOtp()` | `crypto.randomInt(100000, 1000000)` — không dùng `Math.random` |

## 2. Cấu trúc thư mục

```
otp-demo/
├── package.json
├── .env                  # cấu hình đã đặt sẵn cho chạy local
├── .env.example          # giải thích từng biến cấu hình
├── public/
│   └── index.html        # trang test 3 bước: đăng ký → nhập OTP → thành công
├── src/
│   ├── server.js         # Express app, mount routes, trang static
│   ├── routes/auth.js    # /auth/register, /auth/verify-otp, /auth/resend-otp
│   ├── controllers/
│   │   └── authController.js   # ← LOGIC CHÍNH của flow OTP
│   ├── services/
│   │   ├── otpStore.js   # ← lưu OTP dạng hash, khóa 5 lần sai, cooldown 10s
│   │   └── mailer.js     # Nodemailer -> MailDev (hoặc in OTP ra console)
│   └── models/
│       └── userModel.js  # lưu user demo ra data/users.json (thay bằng Model của bạn)
└── test/
    └── e2e-test.mjs      # test tự động 15 bước (kịch bản đầy đủ)
```

## 3. Yêu cầu môi trường

- **Node.js ≥ 18** (cần `fetch` cho test tự động). Kiểm tra: `node -v`

## 4. Hướng dẫn cài đặt chi tiết

### Bước 1 — Cài thư viện

Mở terminal tại thư mục project (nơi có `package.json`):

```bash
npm install
```

### Bước 2 — Cấu hình `.env`

File `.env` đã có sẵn giá trị chạy local, không cần sửa gì:

| Biến | Giá trị mặc định | Ý nghĩa |
|---|---|---|
| `PORT` | `3000` | Cổng server Express |
| `SMTP_HOST` | `127.0.0.1` | Máy chủ SMTP giả lập. **Để trống nếu chưa cài MailDev** — khi đó OTP sẽ được in ra console của server để vẫn test được |
| `SMTP_PORT` | `1025` | Cổng SMTP của MailDev |
| `MAIL_FROM` | `Demo OTP <no-reply@demo.local>` | Địa chỉ người gửi hiển thị trong mail |
| `OTP_SECRET` | (không đặt) | Tuỳ chọn: đặt giá trị bất kỳ để OTP được băm bằng HMAC-SHA256 với khóa riêng thay vì SHA-256 thuần |

### Bước 3 — Chạy MailDev (SMTP giả lập có giao diện web)

Mở **một terminal thứ hai**:

```bash
npm run maildev
```

Lệnh này tương đương `npx maildev -s 1025 -w 1080`: nghe SMTP ở cổng **1025** và mở Web UI xem mail ở **http://localhost:1080**. Khi chạy xong sẽ thấy dòng `[maildev] MailDev SMTP Server running at 127.0.0.1:1025`.

> MailDev là chương trình giả lập mail server: mọi email backend gửi ra đều **không đi ra ngoài internet**, mà chỉ hiển thị trong hộp thư web tại `localhost:1080` — an toàn để demo và chấm điểm.

### Bước 4 — Chạy backend

Quay lại **terminal thứ nhất**:

```bash
npm start
```

Server chạy tại **http://localhost:3000**. Console sẽ in ra:

```
Server chạy tại http://localhost:3000
Chế độ gửi mail: SMTP 127.0.0.1:1025 (MailDev Web UI: http://localhost:1080)
```

### Bước 5 — Dùng thử

Mở **http://localhost:3000** trong trình duyệt:

1. Nhập họ tên, email, mật khẩu → bấm **Gửi mã OTP**.
2. Mở **http://localhost:1080** → thấy email mới có tiêu đề *“Mã OTP xác thực đăng ký: XXXXXX”* → mở mail, đọc mã 6 số.
3. Nhập mã vào trang ở bước 2 → bấm **Xác thực** → hiện *“✅ Xác thực thành công”*.
4. Kiểm tra tài khoản thật sự được tạo: mở **http://localhost:3000/api/users**.

## 5. Gọi API trực tiếp (curl)

```bash
# Bước 1: đăng ký (trả 202, mail OTP xuất hiện trong http://localhost:1080)
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"sinhvien@example.com","password":"matkhau123","fullName":"Nguyen Van A"}'

# Gửi lại mã (chỉ thành công nếu đã qua 10 giây kể từ lần gửi trước)
curl -X POST http://localhost:3000/auth/resend-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"sinhvien@example.com"}'

# Bước 2: xác thực OTP (thay 123456 bằng mã trong mail)
curl -X POST http://localhost:3000/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"sinhvien@example.com","otp":"123456"}'
```

## 6. Tài liệu API

### `POST /auth/register`
| | |
|---|---|
| Body | `{ "email", "password", "fullName" }` — mật khẩu tối thiểu 6 ký tự |
| 202 | Đã gửi OTP — **chưa tạo tài khoản** |
| 400 | Email/mật khẩu không hợp lệ |
| 409 | Email đã có tài khoản |
| 429 | Đang trong cooldown 10 giây (`retryAfterSeconds` cho biết còn mấy giây) |

### `POST /auth/verify-otp`
| | |
|---|---|
| Body | `{ "email", "otp" }` |
| 201 | Tạo tài khoản thành công, trả `{ user }` (đã bỏ `passwordHash`) |
| 400 | Sai mã (`WRONG`, kèm `attemptsLeft`) / hết hạn (`EXPIRED`) / không có yêu cầu chờ (`NOT_FOUND`) |
| 429 | Sai quá 5 lần — email bị khóa (`LOCKED`), phải gửi lại mã |

### `POST /auth/resend-otp`
| | |
|---|---|
| Body | `{ "email" }` |
| 200 | Đã gửi mã mới (mã cũ vô hiệu, reset số lần thử và trạng thái khóa) |
| 404 | Không có đăng ký nào đang chờ cho email này |
| 429 | Chưa đủ 10 giây cooldown |

### `GET /api/users` *(chỉ để demo)*
Danh sách tài khoản đã tạo (không có `passwordHash`).

## 7. Các kịch bản test

### Chạy tự động (khuyên dùng)

Khi server và MailDev đang chạy, ở **terminal thứ ba**:

```bash
node test/e2e-test.mjs
```

Script tự chạy đủ 17 lần kiểm tra: đăng ký → mail đến MailDev → cooldown chặn resend → sai 5 lần bị khóa → nhập đúng mã vẫn bị chặn khi đang khóa → chờ 10 giây gửi lại → xác thực mã mới thành công → OTP dùng lại bị từ chối → trùng email → email lạ → `/api/users`. Kết quả mong đợi: **17 PASS / 0 FAIL**.

### Test thủ công nhanh

1. **Sai 5 lần:** đăng ký, nhập mã sai 5 lần → lần 5 hiện thông báo khóa → nhập mã ĐÚNG từ mail cũng không được nhận → phải bấm *Gửi lại mã*.
2. **Cooldown:** ngay sau khi nhận mail, bấm *Gửi lại mã* → nút đếm ngược 10s, server trả 429 nếu gọi API thủ công trong lúc đó.
3. **Hết hạn:** để mã quá 5 phút rồi nhập đúng → nhận “Mã OTP đã hết hạn”.
4. **Dùng một lần:** verify thành công rồi nhập lại cùng mã → “Không tìm thấy yêu cầu xác thực”.
5. **Không có MailDev:** bỏ trống `SMTP_HOST` trong `.env`, chạy lại `npm start` → mã OTP in thẳng ra console server.

## 8. Tích hợp vào project backend có sẵn của bạn

1. **Copy 2 file service:** `src/services/otpStore.js` và `src/services/mailer.js` vào project (không sửa gì, chỉ cần `npm i nodemailer`).
2. **Sửa handler `POST /register` hiện có:** giữ nguyên phần validate, thay phần `User.create(...)` bằng đoạn sinh OTP + lưu chờ + gửi mail (xem `authController.js` — hàm `register`). Nhớ bcrypt mật khẩu **trước** khi đưa vào `pendingData`.
3. **Thêm 2 route mới** `/auth/verify-otp` và `/auth/resend-otp` (copy hàm `verifyOtp`, `resendOtp` trong `authController.js`).
4. **Thay `userModel`** bằng Model thật của bạn: `userModel.findByEmail()` → `User.findOne({ email })`, `userModel.create()` → `User.create(...).` Nếu email có cột unique thì lỗi trùng email đã tự xử lý được.
5. Frontend chỉ thêm **1 form nhập OTP** hiện ra sau khi submit đăng ký (gọi `/auth/verify-otp`) và nút *Gửi lại mã* (gọi `/auth/resend-otp`) — xem `public/index.html`.

## 9. Bảo mật — mức hiện tại và hướng nâng cấp

- **Đã có:** OTP hash + dùng một lần + TTL 5 phút + khóa sau 5 lần sai + cooldown 10s + so sánh timing-safe + bcrypt mật khẩu trong dữ liệu chờ.
- **Giới hạn demo:** OTP nằm trong RAM của 1 process — restart mất đăng ký chờ; không chạy được nhiều instance (pm2/cluster) vì các process không thấy Map của nhau.
- **Hướng nâng cấp cho production:** lưu record OTP vào Redis (đặt TTL tự hết hạn) hoặc DB (vẫn hash OTP, thêm index email); gửi mail bằng dịch vụ thật (Gmail SMTP/App Password, Resend, SendGrid…); không trả `attemptsLeft` chi tiết cho client nếu muốn khó dò hơn; trả message chung chung cho email lạ để chống dò địa chỉ email (anti-enumeration).

## 10. Xử lý sự cố thường gặp

| Hiện tượng | Nguyên nhân & cách xử lý |
|---|---|
| Nhận lỗi 502 “Không gửi được email” | MailDev chưa chạy → chạy `npm run maildev` trước, kiểm tra `SMTP_HOST=127.0.0.1`, `SMTP_PORT=1025` trong `.env` |
| Mail không xuất hiện trong MailDev | Refresh lại trang `localhost:1080`; kiểm tra đúng hộp thư, đúng địa chỉ email vừa đăng ký |
| `EADDRINUSE :3000` / `:1025` / `:1080` | Cổng bị chiếm — đổi `PORT` trong `.env`, hoặc tắt tiến trình cũ; MailDev đổi cổng bằng `npm run maildev` sửa trong `package.json` |
| `npx maildev` tải chậm lần đầu | Bình thường — lần đầu npx tải gói về; hoặc đã cài sẵn qua `npm install` (devDependencies) nên chạy `npm run maildev` là dùng ngay |
| Restart server xong nhập OTP bị “Không tìm thấy yêu cầu xác thực” | Đúng thiết kế: OTP nằm trong RAM, restart là mất → đăng ký lại |
| Muốn test ngay không cài MailDev | Để trống `SMTP_HOST` trong `.env` → OTP in ra console server |
