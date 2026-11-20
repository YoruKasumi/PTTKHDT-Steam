# Những điểm cần đối chiếu lại

## Trạng thái audit backend

- Các API mới dùng envelope `{ success, message, data, meta? }`; lỗi dùng `{ success: false, code, message, details? }`. `requestContext.js` ưu tiên path params hơn body và luôn giữ danh tính từ middleware.
- Đã triển khai nền RBAC động từ `ROLE_PERMISSION`, CRUD vai trò, quản lý trạng thái/lịch sử tài khoản, nhân sự, kiểm duyệt review, thể loại/banner, system config và audit log. Các luồng ghi nhiều bảng ghi audit cùng transaction.
- `npm test` có kiểm thử hợp đồng API, middleware quyền và validation; frontend được build bằng Vite.
- **Các luồng nghiệp vụ ngoài phạm vi Admin này vẫn chưa được kiểm chứng:** nhiều service/DAO cho thanh toán, refund, tồn kho, giá, license, wallet, withdrawal và developer còn stub. Cần kiểm tra theo schema trước khi tuyên bố các luồng đó hoàn tất.
- Chi tiết phát hiện baseline, các sửa đã áp dụng và tiêu chí còn chặn được ghi trong [`audit_report.md`](./audit_report.md).

Tên hàm được đọc trực tiếp từ ảnh sequence (không dùng OCR cho chính tả); hướng mũi tên và nét đứt được đo tự động. Nhóm nên rà các mục dưới đây.

## 1. Nhãn chưa đọc được

- UC15. Thanh toán (ảnh image17): thiếu thông điệp #7, nằm giữa `traVeThongTinGiamGia` (#6) và `kiemTraSoDuKhaDung` (#8).
- UC37. Xóa tài khoản Nhà phát hành (ảnh image40): thiếu thông điệp #8, nằm giữa `kiemTraSoDuDoanhThu` (#7) và `traVeSoDu` (#9).

## 2. Nhãn đọc bổ sung từ ảnh cắt (12 nhãn)

- image5 #2: `guiYeuCauDangXuat`
- image7 #5: `kiemTraMatKhauHienTai`
- image13 #4: `kiemTraTrangThaiSoHuu`
- image17 #23: `xacNhanXoaGioHang`
- image19 #5: `kiemTraPhienBanHienTai`
- image20 #6: `kiemTraDungLuongODia`
- image20 #10: `hienThiThanhTienTrinhTai`
- image30 #2: `yeuCauLenChienDichSale`
- image36 #5: `kiemTraHanMucRutToiThieu`
- image37 #5: `kiemTraChuyenDoiHopLe`
- image66 #25: `chuyenCheDoNenTepNgam`
- image68 #8: `kiemTraDinhDangDuLieu`

## 3. Service được gán theo thiết kế

Một số lifeline trong sơ đồ mang tên khác với service đã chốt. Mã gộp chúng vào service theo thiết kế của nhóm:

- image17: lifeline 3 gán Cart -> Order theo thiết kế
- image23: lifeline 3 gán Library -> Order theo thiết kế
- image26: lifeline 3 gán Auth -> Developer theo thiết kế
- image30: lifeline 3 gán Game -> Promotion theo thiết kế
- image34: lifeline 2 gán Finance -> Report theo thiết kế
- image36: lifeline 3 gán Wallet -> Withdrawal theo thiết kế
- image61: lifeline 2 gán Wallet -> Finance theo thiết kế
- image62: lifeline 3 gán Finance -> Withdrawal theo thiết kế

## 4. Phân loại tự động

- Lời gọi nội bộ (self-call) được nhận diện theo tên bắt đầu bằng `kiemTra`, `tinh`, `sinh`, `tongHop`, `phanLoai`, `ketXuat`, `taoTep`, `xoaBoNhoDem`, `lamMoi` khi mũi tên không rõ.
- Hai thông điệp được ép loại: UC23 #11 `xuLyThanhToanPhi` (Service → Cổng thanh toán) và UC25 #7 `taiLenTepCaiDatTam` (Service → Storage).
- Nên mở `sequence_method_map.md` và so từng dòng với ảnh sơ đồ cho các use case quan trọng (UC1, 2, 15, 17, 21, 25, 39).

## 5. Phạm vi

- Không sinh mã cho UC46 (Kháng cáo) theo yêu cầu của nhóm.
- Các ảnh dùng chung là sơ đồ use case (không phải sequence) nên được bỏ qua.
- Vai trò gọi mỗi use case (`authorize(...)` trong routes) được suy ra từ nhóm use case: Customer (UC8-23), Developer (UC24-37), Manager/Admin (UC38-57), Admin (UC58-63). Hãy chỉnh khi nhóm chốt ma trận quyền.

## 6. Bảng CSDL bổ sung

- `BANNER` và `SYSTEM_PARAMETER` nằm trong `sql/steam_store_schema.sql`; `sql/extra_tables.sql` bổ sung các tham số mới cho database đã khởi tạo.
- UC56 và UC61-63 làm việc với nhân sự nội bộ (MANAGER, ADMIN, ROLE) - dùng `StaffDAO` và `RoleDAO`.
