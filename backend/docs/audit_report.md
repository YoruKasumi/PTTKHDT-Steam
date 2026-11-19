# Backend audit report

## Phạm vi và giới hạn

Đối chiếu 3 schema SQL, 3 tài liệu tham chiếu và các tệp lõi được chỉ định; sau đó kiểm tra route/service/DAO, cấu hình, middleware, frontend API adapter và test script.

Bảng dưới đây ghi nhận các phát hiện baseline trước khi sửa. Các phương thức nghiệp vụ hiện chưa được triển khai: 132 phương thức service, 126 phương thức DAO và 8 integration method ném `NotImplementedException`. Vì vậy các luồng dữ liệu, SQL, phân quyền ở service, transaction, giá và quyền sở hữu chỉ có thể ghi nhận là chưa thể xác minh.

## Bảng lỗi

| STT | File / Endpoint | Loại lỗi (API / Return Type / SQL / Nghiệp vụ / Bảo mật) | Mô tả chi tiết | Mức độ (Critical / High / Medium) | Phương án sửa |
|---:|---|---|---|---|---|
| 1 | `src/services/*.js`, `src/dao/*.js`, `src/integrations/*.js`; toàn bộ `/api/*` | Nghiệp vụ / SQL / API | 132 service method, 126 DAO method và 8 integration method đều ném `NotImplementedException`; các endpoint hiện trả 501 thay vì thực hiện nghiệp vụ. Chưa có SQL để đối chiếu schema, chưa có payment/refund/wallet/version/key flow hoặc transaction tại service. | Critical | Cần triển khai theo use case, sau đó thêm test MySQL cho contract, ownership, business rule và transaction. Không thể đánh dấu các tiêu chí này đã đạt chỉ bằng sửa middleware. |
| 2 | `src/routes/auth.routes.js` (`guiThongTinDangKy`, `guiThongTinDangNhap`) | API / Bảo mật | Baseline: cả hai endpoint Guest yêu cầu JWT trước khi phân quyền. | High | Đã bỏ `authenticate` tại hai endpoint; logout/đổi mật khẩu vẫn yêu cầu JWT. |
| 3 | `src/utils/requestContext.js` | Bảo mật | Baseline: input client có thể ghi đè danh tính đã xác thực trong context truyền xuống service. | High | Đã spread query/params/body trước, sau đó lấy `user` và `files` từ request đã xác thực/upload. |
| 4 | `src/config/env.js` | Bảo mật | Baseline: thiếu secret production có thể dùng secret mặc định yếu. | High | Đã yêu cầu `JWT_SECRET` tối thiểu 32 bytes trong production; fallback chỉ còn tên secret local-development rõ ràng ngoài production. |
| 5 | `src/middlewares/errorHandler.js` | API | Baseline: lỗi parse JSON của Express bị ánh xạ thành 500 thay vì lỗi đầu vào. | Medium | Đã trả 400 cho JSON sai định dạng và 413 cho payload vượt giới hạn trong error handler tập trung. |
| 6 | `package.json`, `tests/` | API / Nghiệp vụ | Baseline: `npm test` thoát 0 mà không chạy test và không có test thực tế. | High | Đã chuyển sang `node --test` và thêm unit/API contract tests; xem kết quả xác minh bên dưới. |
| 7 | `src/routes/*.routes.js`, `src/middlewares/auth.js` | Bảo mật / Nghiệp vụ | Route manager/admin chủ yếu chỉ kiểm tra role; không có kiểm tra `ROLE_PERMISSION.PermissionCode` ở middleware. Không thể xác minh service-level authorization hoặc IDOR vì service còn là stub. | High | Sau khi hoàn tất auth/RBAC, nạp permission theo vai trò và kiểm tra permission cụ thể ở từng thao tác; service/DAO vẫn phải ràng buộc account/game owner. |
| 8 | `src/app.js` (`GET /health`) | Return Type / API | Baseline: health endpoint trả `{ ok: true }` trực tiếp, khác wrapper `{ ok: true, data }` frontend đang dùng. | Medium | Đã đổi qua `utils/response.js`; kiểm tra cấu trúc trong API test. |
| 9 | Các route POST tạo tài nguyên | API | Wrapper mặc định status 200; chưa có route tạo tài nguyên nào khai báo 201. Do service đang là stub, success path chưa chạy để thấy lỗi runtime nhưng contract sẽ sai khi các service được triển khai. | Medium | Đặt 201 tường minh cho route tạo tài nguyên; không đổi status các POST hành động như validate/search/update nếu không tạo tài nguyên. |

## Tiêu chí chưa thể xác nhận

- Tên cột, placeholder, enum, `DECIMAL`, boolean `TINYINT`, danh sách rỗng và bảo vệ dữ liệu nhạy cảm trong kết quả DAO: chưa có truy vấn DAO thực thi.
- Transaction đa bảng, giới hạn refund 24h, zero-total, coupon allocation, quyền mua lại license, hash `AccessToken`, `LICENSE_DEVICE`, `GAMEVERSION.CurrentGameID`, điều kiện sinh key, số dư ví và doanh thu khả dụng: chưa có implementation để kiểm thử.
- `needs_review.md` và method map còn các điểm đối chiếu sơ đồ được ghi nhận; không thể xác nhận chính xác sơ đồ nghiệp vụ chỉ từ mã khung.

## Trạng thái sau sửa và xác minh

- Đã sửa các phát hiện 2–6 và 8 như mô tả trong bảng. `/health` giữ hợp đồng `{ ok, data }` tương thích adapter hiện tại; không đổi cấu trúc response các API khác.
- Test bổ sung bao phủ health/404, JSON sai/payload quá lớn, truy cập Guest tới login, chặn route Customer khi thiếu/sai JWT, bảo vệ identity/files trong request context và kiểm tra điều kiện JWT secret production.
- Endpoint login trong kiểm thử hiện trả 501 sau khi vượt qua middleware, vì `AuthService` vẫn là stub. Đây không phải luồng đăng nhập đã triển khai.
- Phát hiện 1 và 7, kiểm tra status 201 cho các POST tạo tài nguyên, cùng các tiêu chí schema/transaction/IDOR/nghiệp vụ vẫn chưa được giải quyết hoặc xác minh do thiếu implementation. Không có thay đổi nào tuyên bố các luồng này đã đạt.
