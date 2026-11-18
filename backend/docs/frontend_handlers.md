# Hàm phía giao diện (dùng cho bước frontend)

Các thông điệp giữa tác nhân và Giao diện (UI/App), cùng các hàm hiển thị, lấy từ sơ đồ sequence. Backend không cài các hàm này.

## UC1. Đăng ký tài khoản

- #1 `chonDangKy()`
- #2 `hienThiBieuMauDangKy()`
- #3 `nhapThongTinDangKy()`
- #8 `hienThiThongBaoLoi()`
- #11 `hienThiThongBaoLoi()`
- #15 `hienThiThongBaoDangKyThanhCong()`

## UC2. Đăng nhập hệ thống

- #1 `nhapThongTinDangNhap()`
- #6 `hienThiTrangChu()`
- #8 `hienThiThongBaoDangNhapThatBai()`

## UC3. Đăng xuất khỏi hệ thống

- #1 `chonDangXuat()`
- #5 `chuyenVeManHinhDangNhap()`

## UC4. Cập nhật hồ sơ cá nhân

- #1 `chonCapNhatHoSo()`
- #2 `nhapTenHienThiMoi()`
- #7 `hienThiThongBaoThanhCong()`
- #8 `chonAnhDaiDienMoi()`
- #15 `hienThiThongBaoThanhCong()`

## UC5. Thay đổi mật khẩu tài khoản

- #1 `nhapMatKhauHienTaiVaMoi()`
- #9 `hienThiThongBaoLoi()`
- #13 `hienThiThongBaoThanhCong()`

## UC6. Tìm kiếm sản phẩm

- #1 `nhapTuKhoaTimKiem()`
- #6 `hienThiDanhSachSanPham()`
- #7 `chonBoLocNangCao()`
- #18 `hienThiKetQuaSauKhiLoc()`
- #19 `chonTieuChiSapXep()`
- #30 `hienThiDanhSachDaSapXep()`

## UC7. Xem chi tiết sản phẩm

- #1 `chonSanPham()`
- #14 `hienThiChiTietSanPham()`

## UC8. Xem giỏ hàng

- #1 `chonXemGioHang()`
- #9 `hienThiGioHang()`

## UC9. Thêm game vào giỏ hàng

- #1 `chonThemVaoGioHang()`
- #6 `thongBaoSanPhamDaCoTrongGio()`
- #12 `thongBaoKhongTheThemVaoGio()`
- #16 `hienThiThongBaoThanhCong()`

## UC10. Xóa game khỏi giỏ hàng

- #1 `chonXoaKhoiGioHang()`
- #9 `hienThiGioHangCapNhat()`
- #11 `hienThiThongBaoLoi()`

## UC11. Quản lý Wishlist

- #1 `yeuCauThaoTacWishlist()`
- #8 `hienThiThongBaoKhongTheThem()`
- #12 `hienThiThongBaoThanhCong()`
- #19 `hienThiCapNhatWishlist()`
- #21 `hienThiThongBaoLoi()`

## UC12. Xem số dư ví

- #1 `chonXemSoDuVi()`
- #8 `hienThiSoDuVi()`

## UC13. Nạp tiền vào ví

- #1 `nhapSoTienCanNap()`
- #10 `hienThiSoTienDaNap()`
- #12 `hienThiThongBaoGiaoDichThatBai()`

## UC14. Rút tiền

- #1 `nhapThongTinRutTien()`
- #6 `hienThiThongBaoSoDuKhongDu()`
- #14 `hienThiThongBaoRutTienThanhCong()`
- #16 `hienThiThongBaoGiaoDichThatBai()`

## UC15. Thanh toán

- #1 `chonThanhToan()`
- #3 `nhapMaGiamGia()`
- #13 `hienThiThongBaoSoDuKhongDu()`
- #14 `chonNapTien()`
- #25 `hienThiHoaDonThanhToan()`

## UC16. Xem thư viện cá nhân

- #1 `chonXemThuVienCaNhan()`
- #8 `hienThiDanhSachGameVaCapNhat()`

## UC17. Khởi chạy game

- #1 `chonKhoiChayGame()`
- #10 `khoiChayGameThanhCong()`
- #12 `hienThiThongBaoLoiBanQuyen()`

## UC18. Tải game

- #1 `chonTaiGame()`
- #10 `hienThiThanhTienTrinhTai()`
- #12 `hienThiThongBaoLoi()`

## UC19. Gỡ cài đặt game

- #1 `chonGoCaiDatGame()`
- #6 `hienThiXacNhanDaGoCaiDat()`

## UC20. Xem lịch sử giao dịch

- #1 `chonXemLichSuGiaoDich()`
- #6 `hienThiLichSuGiaoDich()`
- #7 `chonGiaoDich()`
- #12 `hienThiChiTietGiaoDich()`
- #13 `chonTimKiemGiaoDich()`
- #20 `hienThiKetQuaTimKiem()`

## UC21. Yêu cầu hoàn tiền

- #1 `chonYeuCauHoanTien()`
- #13 `hienThiKetQuaHoanTienThanhCong()`
- #15 `hienThiLyDoHoanTienThatBai()`

## UC22. Quản lý thông báo hệ thống

- #1 `moCaiDatThongBao()`
- #2 `chonBatThongBao()`
- #7 `hienThiThongBaoDaBat()`
- #8 `chonTatThongBao()`
- #13 `hienThiThongBaoDaTat()`

## UC23. Đăng ký hồ sơ nhà phát hành

- #1 `chonDangKyNhaPhatHanh()`
- #2 `hienThiBieuMauDangKy()`
- #3 `nhapThongTinDinhDanh()`
- #8 `hienThiThongBaoLoi()`
- #10 `xacNhanThanhToanPhiDirect()`
- #19 `hienThiGiaoDienDeveloper()`

## UC24. Cập nhật Patch & Changelog

- #1 `chonCapNhatPatch()`
- #6 `hienThiThongBaoLoi()`
- #7 `hienThiBieuMauTaiLen()`
- #8 `taiLenTepBanVaVaChangelog()`
- #15 `hienThiThongBaoThanhCong()`

## UC25. Khởi tạo dự án game mới

- #1 `chonKhoiTaoDuAn()`
- #2 `hienThiBieuMauKhoiTao()`
- #3 `nhapThongTinVaTaiLenBuild()`
- #11 `thongBaoThatBai()`
- #16 `hienThiThongBaoThanhCong()`

## UC26. Thiết lập giá bán VND

- #1 `nhapGiaBanVND()`
- #5 `hienThiThongBaoNhapLaiGia()`
- #9 `hienThiThongBaoThanhCong()`

## UC27. Lên chiến dịch Sale

- #1 `nhapThongTinKhuyenMai()`
- #6 `hienThiThongBaoLoiVaYeuCauNhapLai()`
- #10 `hienThiThongBaoThanhCong()`

## UC28. Tự sinh mã kích hoạt (Key)

- #1 `nhapSoLuongKeyCanSinh()`
- #9 `hienThiThongBaoTuChoiSinhKey()`
- #14 `hienThiDanhSachMaKey()`

## UC29. Rollback phiên bản Build

- #1 `chonRollbackPhienBan()`
- #6 `hienThiThongBaoLoi()`
- #8 `chonPhienBanCanKhoiPhuc()`
- #13 `hienThiThongBaoThanhCong()`

## UC30. Báo cáo doanh thu real-time

- #1 `chonXemBaoCaoDoanhThu()`
- #7 `hienThiBaoCaoDoanhThuRealTime()`

## UC31. Kết xuất bảng kê đối soát

- #1 `chonKetXuatBangKeDoiSoat()`
- #8 `taiXuongTepBangKeDoiSoat()`

## UC32. Thống kê Wishlist & Refund

- #1 `chonXemThongKeWishlistVaRefund()`
- #7 `hienThiBieuDoWishlistVaRefund()`

## UC33. Rút doanh thu về ngân hàng

- #1 `nhapSoTienVaTaiKhoanNganHang()`
- #7 `hienThiThongBaoGiaoDichThatBai()`
- #11 `hienThiThongBaoTiepNhanYeuCau()`

## UC34. Cập nhật trạng thái Game

- #1 `chonTrangThaiGameMoi()`
- #7 `hienThiThongBaoLoi()`
- #11 `hienThiThongBaoThanhCong()`

## UC35. Gỡ game khỏi hệ thống

- #1 `chonGoGameKhoiHeThong()`
- #6 `xacNhanDongYGoGame()`
- #11 `hienThiThongBaoThanhCong()`

## UC36. Ẩn game

- #1 `chonAnGame()`
- #6 `hienThiThongBaoThanhCong()`

## UC37. Xóa tài khoản Nhà phát hành và gỡ toàn bộ sản phẩm

- #1 `chonXoaTaiKhoanVaGoToanBoSanPham()`
- #2 `hienThiYeuCauXacThuc()`
- #3 `nhapThongTinXacThuc()`
- #4 `guiYeuCauXoaTaiKhoan()`
- #7 `kiemTraSoDuDoanhThu()`
- #10 `traVeTrangThaiSoDu()`
- #11 `kiemTraDonHangTrongThoiHanHoanTien()`
- #14 `traVeTrangThaiHoanTien()`
- #15 `thongBaoTuChoiXoa()`
- #16 `hienThiLyDoTuChoiXoaTaiKhoan()`
- #25 `thongBaoXoaTaiKhoanThanhCong()`
- #26 `chuyenHuongVeTrangDangNhap()`

## UC38. Kiểm tra thông tin game mới

- #1 `chonKiemTraThongTinGameMoi()`
- #6 `chonGameCanKiemTra()`
- #11 `xacNhanHoanTatKiemTraThongTin()`
- #16 `hienThiThongBaoHoanTat()`

## UC39. Phê duyệt phát hành game

- #1 `chonPheDuyetPhatHanhGame()`
- #6 `hienThiThongBaoTuChoiPheDuyet()`
- #14 `hienThiThongBaoPheDuyetThanhCong()`

## UC40. Từ chối phát hành game

- #1 `chonTuChoiPhatHanhGame()`
- #2 `hienThiBieuMauNhapLyDo()`
- #3 `nhapLyDoTuChoi()`
- #7 `hienThiCanhBaoNhapLyDo()`
- #15 `hienThiThongBaoDaTuChoi()`

## UC41. Gỡ bỏ game khẩn cấp

- #1 `chonGoBoGameKhanCap()`
- #2 `hienThiXacNhanVaNhapLyDo()`
- #3 `xacNhanGoBoGameKhanCap()`
- #12 `hienThiThongBaoDaGoBoGame()`

## UC42. Tra cứu lịch sử tài khoản

- #1 `nhapThongTinTraCuuTaiKhoan()`
- #6 `hienThiThongBaoLoi()`
- #8 `hienThiChiTietLichSuTaiKhoan()`

## UC43. Xử lý đánh giá vi phạm

- #1 `chonDanhGiaViPham()`
- #2 `hienThiTuyChonXuLy()`
- #3 `xacNhanAnHoacXoaDanhGia()`
- #12 `hienThiThongBaoXuLyThanhCong()`

## UC44. Tạm khóa tài khoản vi phạm

- #1 `chonTamKhoaTaiKhoan()`
- #2 `hienThiBieuMauChonThoiGianVaLyDo()`
- #3 `nhapThoiGianVaLyDoTamKhoa()`
- #12 `hienThiThongBaoTamKhoaThanhCong()`

## UC45. Khóa vĩnh viễn tài khoản

- #1 `chonKhoaVinhVienTaiKhoan()`
- #2 `hienThiBieuMauNhapLyDoVaBangChung()`
- #3 `nhapLyDoVaXacNhanKhoa()`
- #12 `hienThiThongBaoKhoaVinhVienThanhCong()`

## UC47. Giám sát nội dung cộng đồng

- #1 `chonGiamSatNoiDungCongDong()`
- #6 `kiemTraNoiDungVaDanhDauXuLy()`
- #11 `hienThiThongBaoHoanTat()`

## UC48. Quản lý danh mục thể loại

- #1 `chonThaoTacDanhMucTheLoai()`
- #2 `nhapThongTinTheLoaiMoi()`
- #7 `hienThiThongBaoKhongTheThem()`
- #11 `hienThiThongBaoThanhCong()`
- #12 `nhapThongTinTheLoaiCanSua()`
- #17 `hienThiThongBaoKhongTheSua()`
- #21 `hienThiThongBaoThanhCong()`
- #22 `chonTheLoaiCanXoa()`
- #27 `hienThiThongBaoKhongDuocXoa()`
- #31 `hienThiThongBaoThanhCong()`

## UC49. Cấu hình banner trang chủ

- #1 `chonCauHinhBannerTrangChu()`
- #2 `hienThiDanhSachBannerHienTai()`
- #3 `taiLenBannerMoiVaThietLapLich()`
- #11 `hienThiThongBaoCauHinhThanhCong()`

## UC50. Dashboard tài chính tổng quan

- #1 `chonDashboardTaiChinhTongQuan()`
- #7 `hienThiDashboardTaiChinh()`

## UC51. Thống kê doanh số toàn sàn

- #1 `chonThongKeDoanhSoToanSan()`
- #2 `hienThiBoLocThoiGian()`
- #3 `thietLapKhoangThoiGian()`
- #9 `hienThiBaoCaoDoanhSo()`

## UC52. Thống kê hoa hồng nền tảng

- #1 `chonThongKeHoaHongNenTang()`
- #7 `hienThiBaoCaoHoaHongNenTang()`

## UC53. Xuất báo cáo tài chính định kỳ

- #1 `chonXuatBaoCaoTaiChinhDinhKy()`
- #2 `hienThiTuyChonKyBaoCaoVaDinhDang()`
- #3 `chonKyBaoCaoVaDinhDangTep()`
- #9 `taiXuongTepBaoCaoTaiChinh()`

## UC54. Theo dõi dòng tiền chờ rút

- #1 `chonTheoDoiDongTienChoRut()`
- #7 `hienThiDanhSachDongTienChoRut()`

## UC55. Thống kê giá trị hoàn tiền

- #1 `chonThongKeGiaTriHoanTien()`
- #7 `hienThiBaoCaoGiaTriHoanTien()`

## UC56. Theo dõi biến động số dư ví

- #1 `chonTheoDoiBienDongSoDuVi()`
- #7 `hienThiNhatKyBienDongSoDuVi()`

## UC57. Phê duyệt rút doanh thu

- #1 `chonLenhRutTienCanDuyet()`
- #6 `tuChoiLenhRutTien()`
- #11 `hienThiThongBaoDaTuChoi()`
- #12 `xacNhanPheDuyetLenhRutTien()`
- #19 `hienThiThongBaoPheDuyetThanhCong()`
- #21 `hienThiThongBaoGiaoDichNganHangLoi()`

## UC58. Cấu hình tham số hệ thống

- #1 `chonCauHinhThamSoHeThong()`
- #6 `hienThiDanhSachThamSo()`
- #7 `nhapGiaTriCauHinhMoi()`
- #11 `hienThiThongBaoLoi()`
- #20 `hienThiThongBaoLuuThanhCong()`

## UC59. Phân quyền truy cập (RBAC)

- #1 `chonPhanQuyenTruyCap()`
- #6 `hienThiMaTranPhanQuyen()`
- #7 `dieuChinhQuyenHanCuaVaiTro()`
- #11 `hienThiCanhBaoPhuThuocQuyen()`
- #20 `hienThiThongBaoThanhCong()`

## UC60. Truy xuất nhật ký toàn cục

- #1 `truyCapNhatKyToanCuc()`
- #6 `hienThiDanhSachNhatKyGanNhat()`
- #7 `thietLapDieuKienLocNangCao()`
- #12 `hienThiThongBaoKhongTimThayKetQua()`
- #14 `hienThiDanhSachKetQuaLoc()`
- #15 `chonXemChiTietBanGhi()`
- #20 `hienThiChiTietBanGhiLog()`
- #21 `chonXuatNhatKy()`
- #27 `hienThiThongBaoNenTepVaGuiSau()`
- #30 `taiXuongTepNhatKyThanhCong()`

## UC61. Tạo tài khoản nhân sự mới

- #1 `chonTaoTaiKhoanNhanSuMoi()`
- #2 `hienThiBieuMauNhapThongTin()`
- #3 `nhapThongTinNhanSuMoi()`
- #8 `hienThiThongBaoLoi()`
- #16 `hienThiThongBaoTaoThanhCong()`

## UC62. Cập nhật thông tin nhân sự

- #1 `chonNhanSuCanChinhSua()`
- #6 `nhapThongTinChinhSua()`
- #10 `hienThiThongBaoLoi()`
- #18 `hienThiThongBaoCapNhatThanhCong()`
