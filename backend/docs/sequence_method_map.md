# Bảng đối chiếu: tên hàm trong sơ đồ sequence ↔ mã nguồn backend

Mỗi dòng là một thông điệp trong sơ đồ sequence của use case. Cột "Lớp.hàm" cho biết hàm đó nằm ở đâu trong mã.
Loại thông điệp được xác định từ hướng mũi tên (UI → Service, Service → Database...) và nét liền / nét đứt; xem `needs_review.md` để biết các chỗ cần đối chiếu lại.

## UC1. Đăng ký tài khoản

| # | Hàm trong sơ đồ | Loại | Lớp.hàm |
|---|---|---|---|
| 1 | `chonDangKy` | Frontend |  |
| 2 | `hienThiBieuMauDangKy` | Frontend |  |
| 3 | `nhapThongTinDangKy` | Frontend |  |
| 4 | `guiThongTinDangKy` | Service (public) | AuthService.guiThongTinDangKy |
| 5 | `kiemTraTenTaiKhoan` | DAO | AccountDAO.kiemTraTenTaiKhoan |
| 6 | `traVeKetQuaKiemTra` | Kết quả trả về |  |
| 7 | `thongBaoTaiKhoanDaTonTai` | Kết quả trả về |  |
| 8 | `hienThiThongBaoLoi` | Frontend |  |
| 9 | `kiemTraDinhDangMatKhau` | Service (nội bộ) | AuthService.kiemTraDinhDangMatKhau (nội bộ) |
| 10 | `thongBaoMatKhauKhongHopLe` | Kết quả trả về |  |
| 11 | `hienThiThongBaoLoi` | Frontend |  |
| 12 | `taoTaiKhoanMoi` | DAO | AccountDAO.taoTaiKhoanMoi |
| 13 | `xacNhanTaoTaiKhoanThanhCong` | Kết quả trả về |  |
| 14 | `thongBaoDangKyThanhCong` | Kết quả trả về |  |
| 15 | `hienThiThongBaoDangKyThanhCong` | Frontend |  |

## UC2. Đăng nhập hệ thống

| # | Hàm trong sơ đồ | Loại | Lớp.hàm |
|---|---|---|---|
| 1 | `nhapThongTinDangNhap` | Frontend |  |
| 2 | `guiThongTinDangNhap` | Service (public) | AuthService.guiThongTinDangNhap |
| 3 | `kiemTraTaiKhoan` | DAO | AccountDAO.kiemTraTaiKhoan |
| 4 | `traVeThongTinTaiKhoan` | Kết quả trả về |  |
| 5 | `xacThucThanhCong` | Kết quả trả về |  |
| 6 | `hienThiTrangChu` | Frontend |  |
| 7 | `xacThucThatBai` | Kết quả trả về |  |
| 8 | `hienThiThongBaoDangNhapThatBai` | Frontend |  |

## UC3. Đăng xuất khỏi hệ thống

| # | Hàm trong sơ đồ | Loại | Lớp.hàm |
|---|---|---|---|
| 1 | `chonDangXuat` | Frontend |  |
| 2 | `guiYeuCauDangXuat` (đọc bổ sung) | Service (public) | AuthService.guiYeuCauDangXuat |
| 3 | `huyPhienDangNhap` | Kết quả trả về |  |
| 4 | `thongBaoDangXuatThanhCong` | Kết quả trả về |  |
| 5 | `chuyenVeManHinhDangNhap` | Frontend |  |

## UC4. Cập nhật hồ sơ cá nhân

| # | Hàm trong sơ đồ | Loại | Lớp.hàm |
|---|---|---|---|
| 1 | `chonCapNhatHoSo` | Frontend |  |
| 2 | `nhapTenHienThiMoi` | Frontend |  |
| 3 | `guiTenHienThiMoi` | Service (public) | ProfileService.guiTenHienThiMoi |
| 4 | `capNhatTenHienThi` | DAO | AccountDAO.capNhatTenHienThi |
| 5 | `xacNhanCapNhatThanhCong` | Kết quả trả về |  |
| 6 | `thongBaoCapNhatThanhCong` | Kết quả trả về |  |
| 7 | `hienThiThongBaoThanhCong` | Frontend |  |
| 8 | `chonAnhDaiDienMoi` | Frontend |  |
| 9 | `guiAnhDaiDien` | Service (public) | ProfileService.guiAnhDaiDien |
| 10 | `luuAnhDaiDien` | Client ngoài | StorageClient.luuAnhDaiDien |
| 11 | `traVeDuongDanAnh` | Kết quả trả về |  |
| 12 | `capNhatDuongDanAnh` | DAO | AccountDAO.capNhatDuongDanAnh |
| 13 | `xacNhanCapNhatThanhCong` | Kết quả trả về |  |
| 14 | `thongBaoCapNhatThanhCong` | Kết quả trả về |  |
| 15 | `hienThiThongBaoThanhCong` | Frontend |  |

## UC5. Thay đổi mật khẩu tài khoản

| # | Hàm trong sơ đồ | Loại | Lớp.hàm |
|---|---|---|---|
| 1 | `nhapMatKhauHienTaiVaMoi` | Frontend |  |
| 2 | `guiYeuCauThayDoiMatKhau` | Service (public) | AuthService.guiYeuCauThayDoiMatKhau |
| 3 | `layMatKhauHienTai` | DAO | AccountDAO.layMatKhauHienTai |
| 4 | `traVeMatKhauHienTai` | Kết quả trả về |  |
| 5 | `kiemTraMatKhauHienTai` (đọc bổ sung) | Service (nội bộ) | AuthService.kiemTraMatKhauHienTai (nội bộ) |
| 6 | `kiemTraDinhDangMatKhauMoi` | Service (nội bộ) | AuthService.kiemTraDinhDangMatKhauMoi (nội bộ) |
| 7 | `kiemTraMatKhauMoiKhacMatKhauCu` | Service (nội bộ) | AuthService.kiemTraMatKhauMoiKhacMatKhauCu (nội bộ) |
| 8 | `thongBaoDoiMatKhauThatBai` | Kết quả trả về |  |
| 9 | `hienThiThongBaoLoi` | Frontend |  |
| 10 | `capNhatMatKhauMoi` | DAO | AccountDAO.capNhatMatKhauMoi |
| 11 | `xacNhanCapNhatThanhCong` | Kết quả trả về |  |
| 12 | `thongBaoThayDoiMatKhauThanhCong` | Kết quả trả về |  |
| 13 | `hienThiThongBaoThanhCong` | Frontend |  |

## UC6. Tìm kiếm sản phẩm

| # | Hàm trong sơ đồ | Loại | Lớp.hàm |
|---|---|---|---|
| 1 | `nhapTuKhoaTimKiem` | Frontend |  |
| 2 | `guiYeuCauTimKiem` | Service (public) | CatalogService.guiYeuCauTimKiem |
| 3 | `timKiemSanPhamTheoTuKhoa` | DAO | GameDAO.timKiemSanPhamTheoTuKhoa |
| 4 | `traVeDanhSachSanPham` | Kết quả trả về |  |
| 5 | `traVeKetQuaTimKiem` | Kết quả trả về |  |
| 6 | `hienThiDanhSachSanPham` | Frontend |  |
| 7 | `chonBoLocNangCao` | Frontend |  |
| 8 | `yeuCauLocTheoTheLoai` | Service (public) | CatalogService.yeuCauLocTheoTheLoai |
| 9 | `truyVanSanPhamTheoTheLoai` | DAO | GameDAO.truyVanSanPhamTheoTheLoai |
| 10 | `traVeKetQuaLoc` | Kết quả trả về |  |
| 11 | `yeuCauLocTheoKhoangGia` | Service (public) | CatalogService.yeuCauLocTheoKhoangGia |
| 12 | `truyVanSanPhamTheoKhoangGia` | DAO | GameDAO.truyVanSanPhamTheoKhoangGia |
| 13 | `traVeKetQuaLoc` | Kết quả trả về |  |
| 14 | `yeuCauLocTheoTrangThaiSale` | Service (public) | CatalogService.yeuCauLocTheoTrangThaiSale |
| 15 | `truyVanSanPhamTheoTrangThaiSale` | DAO | GameDAO.truyVanSanPhamTheoTrangThaiSale |
| 16 | `traVeKetQuaLoc` | Kết quả trả về |  |
| 17 | `capNhatDanhSachKetQua` | Kết quả trả về |  |
| 18 | `hienThiKetQuaSauKhiLoc` | Frontend |  |
| 19 | `chonTieuChiSapXep` | Frontend |  |
| 20 | `sapXepTheoNgayPhatHanh` | Service (public) | CatalogService.sapXepTheoNgayPhatHanh |
| 21 | `layDanhSachTheoNgayPhatHanh` | DAO | GameDAO.layDanhSachTheoNgayPhatHanh |
| 22 | `traVeDanhSachSapXep` | Kết quả trả về |  |
| 23 | `sapXepTheoDoPhoBien` | Service (public) | CatalogService.sapXepTheoDoPhoBien |
| 24 | `layDanhSachTheoDoPhoBien` | DAO | GameDAO.layDanhSachTheoDoPhoBien |
| 25 | `traVeDanhSachSapXep` | Kết quả trả về |  |
| 26 | `sapXepTheoGia` | Service (public) | CatalogService.sapXepTheoGia |
| 27 | `layDanhSachTheoGia` | DAO | GameDAO.layDanhSachTheoGia |
| 28 | `traVeDanhSachSapXep` | Kết quả trả về |  |
| 29 | `capNhatDanhSachKetQua` | Kết quả trả về |  |
| 30 | `hienThiDanhSachDaSapXep` | Frontend |  |

## UC7. Xem chi tiết sản phẩm

| # | Hàm trong sơ đồ | Loại | Lớp.hàm |
|---|---|---|---|
| 1 | `chonSanPham` | Frontend |  |
| 2 | `yeuCauXemChiTietSanPham` | Service (public) | CatalogService.yeuCauXemChiTietSanPham |
| 3 | `layThongTinSanPham` | DAO | GameDAO.layThongTinSanPham |
| 4 | `traVeThongTinSanPham` | Kết quả trả về |  |
| 5 | `layThongTinCoBan` | DAO | GameDAO.layThongTinCoBan |
| 6 | `traVeThongTinCoBan` | Kết quả trả về |  |
| 7 | `traVeThongTinCoBan` | Kết quả trả về |  |
| 8 | `layCauHinhYeuCau` | DAO | GameDAO.layCauHinhYeuCau |
| 9 | `traVeCauHinhYeuCau` | Kết quả trả về |  |
| 10 | `traVeCauHinhYeuCau` | Kết quả trả về |  |
| 11 | `layDanhSachDanhGia` | DAO | GameDAO.layDanhSachDanhGia |
| 12 | `traVeDanhSachDanhGia` | Kết quả trả về |  |
| 13 | `traVeDanhSachDanhGia` | Kết quả trả về |  |
| 14 | `hienThiChiTietSanPham` | Frontend |  |

## UC8. Xem giỏ hàng

| # | Hàm trong sơ đồ | Loại | Lớp.hàm |
|---|---|---|---|
| 1 | `chonXemGioHang` | Frontend |  |
| 2 | `yeuCauXemGioHang` | Service (public) | CartService.yeuCauXemGioHang |
| 3 | `layDanhSachSanPhamTrongGio` | DAO | CartDAO.layDanhSachSanPhamTrongGio |
| 4 | `traVeDanhSachSanPham` | Kết quả trả về |  |
| 5 | `layDonGiaTungSanPham` | DAO | CartDAO.layDonGiaTungSanPham |
| 6 | `traVeDonGia` | Kết quả trả về |  |
| 7 | `tinhTongTienGioHang` | Service (nội bộ) | CartService.tinhTongTienGioHang (nội bộ) |
| 8 | `traVeDanhSachVaTongTien` | Kết quả trả về |  |
| 9 | `hienThiGioHang` | Frontend |  |

## UC9. Thêm game vào giỏ hàng

| # | Hàm trong sơ đồ | Loại | Lớp.hàm |
|---|---|---|---|
| 1 | `chonThemVaoGioHang` | Frontend |  |
| 2 | `yeuCauThemSanPham` | Service (public) | CartService.yeuCauThemSanPham |
| 3 | `kiemTraSanPhamTrongGio` | DAO | CartDAO.kiemTraSanPhamTrongGio |
| 4 | `traVeKetQuaKiemTra` | Kết quả trả về |  |
| 5 | `thongBaoSanPhamDaTonTai` | Kết quả trả về |  |
| 6 | `thongBaoSanPhamDaCoTrongGio` | Frontend |  |
| 7 | `kiemTraBanQuyenSanPham` | Service → Service | GameService.kiemTraBanQuyenSanPham |
| 8 | `kiemTraGameDaSoHuu` | DAO | GameDAO.kiemTraGameDaSoHuu |
| 9 | `traVeTrangThaiSoHuu` | Kết quả trả về |  |
| 10 | `traVeKetQuaKiemTra` | Kết quả trả về |  |
| 11 | `thongBaoDaSoHuuGame` | Kết quả trả về |  |
| 12 | `thongBaoKhongTheThemVaoGio` | Frontend |  |
| 13 | `themSanPhamVaoGioHang` | DAO | CartDAO.themSanPhamVaoGioHang |
| 14 | `xacNhanThemThanhCong` | Kết quả trả về |  |
| 15 | `thongBaoThemVaoGioThanhCong` | Kết quả trả về |  |
| 16 | `hienThiThongBaoThanhCong` | Frontend |  |

## UC10. Xóa game khỏi giỏ hàng

| # | Hàm trong sơ đồ | Loại | Lớp.hàm |
|---|---|---|---|
| 1 | `chonXoaKhoiGioHang` | Frontend |  |
| 2 | `yeuCauXoaSanPham` | Service (public) | CartService.yeuCauXoaSanPham |
| 3 | `kiemTraSanPhamTrongGio` | DAO | CartDAO.kiemTraSanPhamTrongGio |
| 4 | `traVeKetQuaKiemTra` | Kết quả trả về |  |
| 5 | `xoaSanPhamKhoiGioHang` | DAO | CartDAO.xoaSanPhamKhoiGioHang |
| 6 | `xacNhanXoaThanhCong` | Kết quả trả về |  |
| 7 | `tinhLaiTongTien` | Service (nội bộ) | CartService.tinhLaiTongTien (nội bộ) |
| 8 | `thongBaoXoaThanhCong` | Kết quả trả về |  |
| 9 | `hienThiGioHangCapNhat` | Frontend |  |
| 10 | `thongBaoSanPhamKhongTonTai` | Kết quả trả về |  |
| 11 | `hienThiThongBaoLoi` | Frontend |  |

## UC11. Quản lý Wishlist

| # | Hàm trong sơ đồ | Loại | Lớp.hàm |
|---|---|---|---|
| 1 | `yeuCauThaoTacWishlist` | Frontend |  |
| 2 | `yeuCauThemWishlist` | Service (public) | WishlistService.yeuCauThemWishlist |
| 3 | `kiemTraBanQuyenSanPham` | Service → Service | GameService.kiemTraBanQuyenSanPham |
| 4 | `kiemTraTrangThaiSoHuu` (đọc bổ sung) | DAO | WishlistDAO.kiemTraTrangThaiSoHuu |
| 5 | `traVeTrangThaiSoHuu` | Kết quả trả về |  |
| 6 | `traVeKetQuaSoHuu` | Kết quả trả về |  |
| 7 | `thongBaoDaSoHuu` | Kết quả trả về |  |
| 8 | `hienThiThongBaoKhongTheThem` | Frontend |  |
| 9 | `themVaoWishlist` | DAO | WishlistDAO.themVaoWishlist |
| 10 | `xacNhanThemThanhCong` | Kết quả trả về |  |
| 11 | `thongBaoThemThanhCong` | Kết quả trả về |  |
| 12 | `hienThiThongBaoThanhCong` | Frontend |  |
| 13 | `yeuCauXoaWishlist` | Service (public) | WishlistService.yeuCauXoaWishlist |
| 14 | `kiemTraTonTaiTrongWishlist` | DAO | WishlistDAO.kiemTraTonTaiTrongWishlist |
| 15 | `traVeKetQuaKiemTra` | Kết quả trả về |  |
| 16 | `xoaKhoiWishlist` | DAO | WishlistDAO.xoaKhoiWishlist |
| 17 | `xacNhanXoaThanhCong` | Kết quả trả về |  |
| 18 | `thongBaoXoaThanhCong` | Kết quả trả về |  |
| 19 | `hienThiCapNhatWishlist` | Frontend |  |
| 20 | `thongBaoKhongTonTai` | Kết quả trả về |  |
| 21 | `hienThiThongBaoLoi` | Frontend |  |

## UC12. Xem số dư ví

| # | Hàm trong sơ đồ | Loại | Lớp.hàm |
|---|---|---|---|
| 1 | `chonXemSoDuVi` | Frontend |  |
| 2 | `yeuCauXemSoDu` | Service (public) | WalletService.yeuCauXemSoDu |
| 3 | `xacThucNguoiDung` | Service → Service | AuthService.xacThucNguoiDung |
| 4 | `xacThucHopLe` | Kết quả trả về |  |
| 5 | `truyVanSoDuVi` | DAO | WalletDAO.truyVanSoDuVi |
| 6 | `traVeSoDuVi` | Kết quả trả về |  |
| 7 | `traVeSoDuKhaDung` | Kết quả trả về |  |
| 8 | `hienThiSoDuVi` | Frontend |  |

## UC13. Nạp tiền vào ví

| # | Hàm trong sơ đồ | Loại | Lớp.hàm |
|---|---|---|---|
| 1 | `nhapSoTienCanNap` | Frontend |  |
| 2 | `guiYeuCauNapTien` | Service (public) | WalletService.guiYeuCauNapTien |
| 3 | `yeuCauXuLyGiaoDich` | Client ngoài | PaymentGatewayClient.yeuCauXuLyGiaoDich |
| 4 | `traVeKetQuaGiaoDich` | Kết quả trả về |  |
| 5 | `congTienVaoVi` | DAO | WalletDAO.congTienVaoVi |
| 6 | `xacNhanCapNhatViThanhCong` | Kết quả trả về |  |
| 7 | `luuLichSuGiaoDich` | DAO | WalletDAO.luuLichSuGiaoDich |
| 8 | `xacNhanLuuLichSuThanhCong` | Kết quả trả về |  |
| 9 | `thongBaoNapTienThanhCong` | Kết quả trả về |  |
| 10 | `hienThiSoTienDaNap` | Frontend |  |
| 11 | `thongBaoNapTienThatBai` | Kết quả trả về |  |
| 12 | `hienThiThongBaoGiaoDichThatBai` | Frontend |  |

## UC14. Rút tiền

| # | Hàm trong sơ đồ | Loại | Lớp.hàm |
|---|---|---|---|
| 1 | `nhapThongTinRutTien` | Frontend |  |
| 2 | `guiYeuCauRutTien` | Service (public) | WalletService.guiYeuCauRutTien |
| 3 | `truyVanSoDuKhaDung` | DAO | WalletDAO.truyVanSoDuKhaDung |
| 4 | `traVeSoDu` | Kết quả trả về |  |
| 5 | `phanHoiSoDuKhongDu` | Kết quả trả về |  |
| 6 | `hienThiThongBaoSoDuKhongDu` | Frontend |  |
| 7 | `yeuCauChuyenTien` | Client ngoài | BankClient.yeuCauChuyenTien |
| 8 | `traVeKetQuaChuyenTien` | Kết quả trả về |  |
| 9 | `truTienTrongVi` | DAO | WalletDAO.truTienTrongVi |
| 10 | `xacNhanCapNhatThanhCong` | Kết quả trả về |  |
| 11 | `luuLichSuGiaoDich` | DAO | WalletDAO.luuLichSuGiaoDich |
| 12 | `xacNhanLuuLichSuThanhCong` | Kết quả trả về |  |
| 13 | `thongBaoRutTienThanhCong` | Kết quả trả về |  |
| 14 | `hienThiThongBaoRutTienThanhCong` | Frontend |  |
| 15 | `thongBaoRutTienThatBai` | Kết quả trả về |  |
| 16 | `hienThiThongBaoGiaoDichThatBai` | Frontend |  |

## UC15. Thanh toán

| # | Hàm trong sơ đồ | Loại | Lớp.hàm |
|---|---|---|---|
| 1 | `chonThanhToan` | Frontend |  |
| 2 | `yeuCauThanhToan` | Service (public) | OrderService.yeuCauThanhToan |
| 3 | `nhapMaGiamGia` | Frontend |  |
| 4 | `kiemTraMaGiamGia` | Service (public) | OrderService.kiemTraMaGiamGia |
| 5 | `truyVanMaGiamGia` | DAO | OrderDAO.truyVanMaGiamGia |
| 6 | `traVeThongTinGiamGia` | Kết quả trả về |  |
| 8 | `kiemTraSoDuKhaDung` | Service → Service | WalletService.kiemTraSoDuKhaDung |
| 9 | `truyVanSoDu` | DAO | WalletDAO.truyVanSoDu |
| 10 | `traVeSoDu` | Kết quả trả về |  |
| 11 | `traVeKetQuaSoDu` | Kết quả trả về |  |
| 12 | `thongBaoSoDuKhongDu` | Kết quả trả về |  |
| 13 | `hienThiThongBaoSoDuKhongDu` | Frontend |  |
| 14 | `chonNapTien` | Frontend |  |
| 15 | `chuyenHuongNapTien` | Service (public) | WalletService.chuyenHuongNapTien |
| 16 | `truTienVi` | Service → Service | WalletService.truTienVi |
| 17 | `capNhatSoDuVi` | DAO | WalletDAO.capNhatSoDuVi |
| 18 | `xacNhanTruTienThanhCong` | Kết quả trả về |  |
| 19 | `capPhatBanQuyen` | Service → Service | GameService.capPhatBanQuyen |
| 20 | `luuBanQuyenGame` | DAO | GameDAO.luuBanQuyenGame |
| 21 | `xacNhanCapPhatThanhCong` | Kết quả trả về |  |
| 22 | `xoaGioHang` | DAO | OrderDAO.xoaGioHang |
| 23 | `xacNhanXoaGioHang` (đọc bổ sung) | Kết quả trả về |  |
| 24 | `thongBaoThanhToanThanhCong` | Kết quả trả về |  |
| 25 | `hienThiHoaDonThanhToan` | Frontend |  |

## UC16. Xem thư viện cá nhân

| # | Hàm trong sơ đồ | Loại | Lớp.hàm |
|---|---|---|---|
| 1 | `chonXemThuVienCaNhan` | Frontend |  |
| 2 | `yeuCauXemThuVien` | Service (public) | LibraryService.yeuCauXemThuVien |
| 3 | `layDanhSachGameDaSoHuu` | DAO | LicenseDAO.layDanhSachGameDaSoHuu |
| 4 | `traVeDanhSachGame` | Kết quả trả về |  |
| 5 | `kiemTraCapNhatGame` | DAO | LicenseDAO.kiemTraCapNhatGame |
| 6 | `traVeDanhSachCapNhat` | Kết quả trả về |  |
| 7 | `traVeThuVienCaNhan` | Kết quả trả về |  |
| 8 | `hienThiDanhSachGameVaCapNhat` | Frontend |  |

## UC17. Khởi chạy game

| # | Hàm trong sơ đồ | Loại | Lớp.hàm |
|---|---|---|---|
| 1 | `chonKhoiChayGame` | Frontend |  |
| 2 | `yeuCauKhoiChay` | Service (public) | LibraryService.yeuCauKhoiChay |
| 3 | `kiemTraTokenBanQuyen` | DAO | LicenseDAO.kiemTraTokenBanQuyen |
| 4 | `traVeTrangThaiToken` | Kết quả trả về |  |
| 5 | `kiemTraPhienBanHienTai` (đọc bổ sung) | Service (nội bộ) | LibraryService.kiemTraPhienBanHienTai (nội bộ) |
| 6 | `traVeTrangThaiPhienBan` | Kết quả trả về |  |
| 7 | `taiBanVaCapNhat` | DAO | LicenseDAO.taiBanVaCapNhat |
| 8 | `xacNhanCapNhatThanhCong` | Kết quả trả về |  |
| 9 | `moKhoaTienTrinhGame` | Kết quả trả về |  |
| 10 | `khoiChayGameThanhCong` | Frontend |  |
| 11 | `tuChoiKhoiChay` | Kết quả trả về |  |
| 12 | `hienThiThongBaoLoiBanQuyen` | Frontend |  |

## UC18. Tải game

| # | Hàm trong sơ đồ | Loại | Lớp.hàm |
|---|---|---|---|
| 1 | `chonTaiGame` | Frontend |  |
| 2 | `yeuCauTaiGame` | Service (public) | LibraryService.yeuCauTaiGame |
| 3 | `kiemTraTokenBanQuyen` | DAO | LicenseDAO.kiemTraTokenBanQuyen |
| 4 | `traVeKetQuaToken` | Kết quả trả về |  |
| 5 | `kiemTraDuongDanLuuTru` | Service (nội bộ) | LibraryService.kiemTraDuongDanLuuTru (nội bộ) |
| 6 | `kiemTraDungLuongODia` (đọc bổ sung) | Service (nội bộ) | LibraryService.kiemTraDungLuongODia (nội bộ) |
| 7 | `layGoiCaiDat` | DAO | LicenseDAO.layGoiCaiDat |
| 8 | `traVeTepCaiDat` | Kết quả trả về |  |
| 9 | `batDauTienTrinhTai` | Kết quả trả về |  |
| 10 | `hienThiThanhTienTrinhTai` (đọc bổ sung) | Frontend |  |
| 11 | `thongBaoTaiGameThatBai` | Kết quả trả về |  |
| 12 | `hienThiThongBaoLoi` | Frontend |  |

## UC19. Gỡ cài đặt game

| # | Hàm trong sơ đồ | Loại | Lớp.hàm |
|---|---|---|---|
| 1 | `chonGoCaiDatGame` | Frontend |  |
| 2 | `yeuCauGoCaiDat` | Kết quả trả về |  |
| 3 | `kiemTraDuongDanLuuTru` | Service (nội bộ) | LibraryService.kiemTraDuongDanLuuTru (nội bộ) |
| 4 | `xoaTepTinCaiDat` | Kết quả trả về |  |
| 5 | `thongBaoGameKhongConLuuTrenThietBi` | Kết quả trả về |  |
| 6 | `hienThiXacNhanDaGoCaiDat` | Frontend |  |

## UC20. Xem lịch sử giao dịch

| # | Hàm trong sơ đồ | Loại | Lớp.hàm |
|---|---|---|---|
| 1 | `chonXemLichSuGiaoDich` | Frontend |  |
| 2 | `yeuCauXemLichSuGiaoDich` | Service (public) | WalletService.yeuCauXemLichSuGiaoDich |
| 3 | `layDanhSachGiaoDich` | DAO | WalletDAO.layDanhSachGiaoDich |
| 4 | `traVeDanhSachGiaoDich` | Kết quả trả về |  |
| 5 | `traVeLichSuGiaoDich` | Kết quả trả về |  |
| 6 | `hienThiLichSuGiaoDich` | Frontend |  |
| 7 | `chonGiaoDich` | Frontend |  |
| 8 | `yeuCauXemChiTiet` | Service (public) | WalletService.yeuCauXemChiTiet |
| 9 | `layChiTietGiaoDich` | DAO | WalletDAO.layChiTietGiaoDich |
| 10 | `traVeChiTietGiaoDich` | Kết quả trả về |  |
| 11 | `traVeChiTietGiaoDich` | Kết quả trả về |  |
| 12 | `hienThiChiTietGiaoDich` | Frontend |  |
| 13 | `chonTimKiemGiaoDich` | Frontend |  |
| 14 | `guiTieuChiTimKiem` | Service (public) | WalletService.guiTieuChiTimKiem |
| 15 | `timGiaoDichTheoTenSanPham` | DAO | WalletDAO.timGiaoDichTheoTenSanPham |
| 16 | `traVeKetQuaTimKiem` | Kết quả trả về |  |
| 17 | `timGiaoDichTheoNgay` | DAO | WalletDAO.timGiaoDichTheoNgay |
| 18 | `traVeKetQuaTimKiem` | Kết quả trả về |  |
| 19 | `traVeKetQuaTimKiem` | Kết quả trả về |  |
| 20 | `hienThiKetQuaTimKiem` | Frontend |  |

## UC21. Yêu cầu hoàn tiền

| # | Hàm trong sơ đồ | Loại | Lớp.hàm |
|---|---|---|---|
| 1 | `chonYeuCauHoanTien` | Frontend |  |
| 2 | `guiYeuCauHoanTien` | Service (public) | OrderService.guiYeuCauHoanTien |
| 3 | `kiemTraTokenBanQuyen` | DAO | OrderDAO.kiemTraTokenBanQuyen |
| 4 | `traVeThongTinBanQuyen` | Kết quả trả về |  |
| 5 | `kiemTraThoiGianThanhToanDuoi24h` | DAO | OrderDAO.kiemTraThoiGianThanhToanDuoi24h |
| 6 | `traVeKetQuaKiemTraThoiGian` | Kết quả trả về |  |
| 7 | `thuHoiBanQuyenGame` | DAO | OrderDAO.thuHoiBanQuyenGame |
| 8 | `xacNhanThuHoiThanhCong` | Kết quả trả về |  |
| 9 | `congTienHoanTraVaoVi` | Service → Service | WalletService.congTienHoanTraVaoVi |
| 10 | `capNhatSoDuVi` | DAO | WalletDAO.capNhatSoDuVi |
| 11 | `xacNhanHoanTien` | Kết quả trả về |  |
| 12 | `thongBaoHoanTienThanhCong` | Kết quả trả về |  |
| 13 | `hienThiKetQuaHoanTienThanhCong` | Frontend |  |
| 14 | `thongBaoHoanTienThatBai` | Kết quả trả về |  |
| 15 | `hienThiLyDoHoanTienThatBai` | Frontend |  |

## UC22. Quản lý thông báo hệ thống

| # | Hàm trong sơ đồ | Loại | Lớp.hàm |
|---|---|---|---|
| 1 | `moCaiDatThongBao` | Frontend |  |
| 2 | `chonBatThongBao` | Frontend |  |
| 3 | `capNhatTrangThaiBat` | Service (public) | NotificationService.capNhatTrangThaiBat |
| 4 | `luuTrangThaiThongBao` | DAO | NotificationDAO.luuTrangThaiThongBao |
| 5 | `xacNhanCapNhatThanhCong` | Kết quả trả về |  |
| 6 | `thongBaoBatThanhCong` | Kết quả trả về |  |
| 7 | `hienThiThongBaoDaBat` | Frontend |  |
| 8 | `chonTatThongBao` | Frontend |  |
| 9 | `capNhatTrangThaiTat` | Service (public) | NotificationService.capNhatTrangThaiTat |
| 10 | `luuTrangThaiThongBao` | DAO | NotificationDAO.luuTrangThaiThongBao |
| 11 | `xacNhanCapNhatThanhCong` | Kết quả trả về |  |
| 12 | `thongBaoTatThanhCong` | Kết quả trả về |  |
| 13 | `hienThiThongBaoDaTat` | Frontend |  |

## UC23. Đăng ký hồ sơ nhà phát hành

| # | Hàm trong sơ đồ | Loại | Lớp.hàm |
|---|---|---|---|
| 1 | `chonDangKyNhaPhatHanh` | Frontend |  |
| 2 | `hienThiBieuMauDangKy` | Frontend |  |
| 3 | `nhapThongTinDinhDanh` | Frontend |  |
| 4 | `guiThongTinDangKy` | Service (public) | DeveloperService.guiThongTinDangKy |
| 5 | `kiemTraThongTinPhapNhan` | DAO | DeveloperDAO.kiemTraThongTinPhapNhan |
| 6 | `traVeKetQuaKiemTra` | Kết quả trả về |  |
| 7 | `thongBaoThongTinKhongHopLe` | Kết quả trả về |  |
| 8 | `hienThiThongBaoLoi` | Frontend |  |
| 9 | `chuyenHuongThanhToanPhi` | Kết quả trả về |  |
| 10 | `xacNhanThanhToanPhiDirect` | Frontend |  |
| 11 | `xuLyThanhToanPhi` | Client ngoài | PaymentGatewayClient.xuLyThanhToanPhi |
| 12 | `capNhatTrangThaiThanhToan` | Kết quả trả về |  |
| 13 | `xacNhanThanhToanThanhCong` | Kết quả trả về |  |
| 14 | `thongBaoThanhToanThanhCong` | Kết quả trả về |  |
| 15 | `nangCapVaiTroDeveloper` | Service (public) | DeveloperService.nangCapVaiTroDeveloper |
| 16 | `capNhatVaiTroTaiKhoan` | DAO | DeveloperDAO.capNhatVaiTroTaiKhoan |
| 17 | `xacNhanNangCapThanhCong` | Kết quả trả về |  |
| 18 | `kichHoatTaiKhoanNPHThanhCong` | Kết quả trả về |  |
| 19 | `hienThiGiaoDienDeveloper` | Frontend |  |

## UC24. Cập nhật Patch & Changelog

| # | Hàm trong sơ đồ | Loại | Lớp.hàm |
|---|---|---|---|
| 1 | `chonCapNhatPatch` | Frontend |  |
| 2 | `kiemTraThongTinGame` | Service (public) | GameService.kiemTraThongTinGame |
| 3 | `truyVanThongTinGame` | DAO | GameDAO.truyVanThongTinGame |
| 4 | `traVeTrangThaiGame` | Kết quả trả về |  |
| 5 | `thongBaoGameKhongHopLe` | Kết quả trả về |  |
| 6 | `hienThiThongBaoLoi` | Frontend |  |
| 7 | `hienThiBieuMauTaiLen` | Frontend |  |
| 8 | `taiLenTepBanVaVaChangelog` | Frontend |  |
| 9 | `guiGoiCapNhat` | Service (public) | GameService.guiGoiCapNhat |
| 10 | `luuTruBanVa` | Client ngoài | StorageClient.luuTruBanVa |
| 11 | `xacNhanLuuTru` | Kết quả trả về |  |
| 12 | `capNhatPhienBanMoi` | DAO | GameDAO.capNhatPhienBanMoi |
| 13 | `xacNhanCapNhatThanhCong` | Kết quả trả về |  |
| 14 | `thongBaoCapNhatThanhCong` | Kết quả trả về |  |
| 15 | `hienThiThongBaoThanhCong` | Frontend |  |

## UC25. Khởi tạo dự án game mới

| # | Hàm trong sơ đồ | Loại | Lớp.hàm |
|---|---|---|---|
| 1 | `chonKhoiTaoDuAn` | Frontend |  |
| 2 | `hienThiBieuMauKhoiTao` | Frontend |  |
| 3 | `nhapThongTinVaTaiLenBuild` | Frontend |  |
| 4 | `kiemTraThongTinGame` | Service (public) | GameService.kiemTraThongTinGame |
| 5 | `kiemTraTenGameTrungLap` | DAO | GameDAO.kiemTraTenGameTrungLap |
| 6 | `traVeKetQuaKiemTraTen` | Kết quả trả về |  |
| 7 | `taiLenTepCaiDatTam` | Client ngoài | StorageClient.taiLenTepCaiDatTam |
| 8 | `traVeDuongDanTam` | Kết quả trả về |  |
| 9 | `guiYeuCauQuetVirus` | Service (public) | GameService.guiYeuCauQuetVirus |
| 10 | `traVeKetQuaQuetVirus` | Kết quả trả về |  |
| 11 | `thongBaoThatBai` | Frontend |  |
| 12 | `luuHoSoDuAnGame` | Service (public) | GameService.luuHoSoDuAnGame |
| 13 | `taoBanGhiDuAnMoi` | DAO | GameDAO.taoBanGhiDuAnMoi |
| 14 | `xacNhanLuuDuAnThanhCong` | Kết quả trả về |  |
| 15 | `thongBaoKhoiTaoThanhCong` | Kết quả trả về |  |
| 16 | `hienThiThongBaoThanhCong` | Frontend |  |

## UC26. Thiết lập giá bán VND

| # | Hàm trong sơ đồ | Loại | Lớp.hàm |
|---|---|---|---|
| 1 | `nhapGiaBanVND` | Frontend |  |
| 2 | `yeuCauThietLapGia` | Service (public) | GameService.yeuCauThietLapGia |
| 3 | `kiemTraGiaBanHopLe` | Service (nội bộ) | GameService.kiemTraGiaBanHopLe (nội bộ) |
| 4 | `yeuCauNhapLaiGiaBan` | Kết quả trả về |  |
| 5 | `hienThiThongBaoNhapLaiGia` | Frontend |  |
| 6 | `capNhatGiaBanVND` | DAO | GameDAO.capNhatGiaBanVND |
| 7 | `xacNhanCapNhatGiaThanhCong` | Kết quả trả về |  |
| 8 | `thongBaoThietLapGiaThanhCong` | Kết quả trả về |  |
| 9 | `hienThiThongBaoThanhCong` | Frontend |  |

## UC27. Lên chiến dịch Sale

| # | Hàm trong sơ đồ | Loại | Lớp.hàm |
|---|---|---|---|
| 1 | `nhapThongTinKhuyenMai` | Frontend |  |
| 2 | `yeuCauLenChienDichSale` (đọc bổ sung) | Service (public) | PromotionService.yeuCauLenChienDichSale |
| 3 | `kiemTraPhanTramGiaSale` | Service (nội bộ) | PromotionService.kiemTraPhanTramGiaSale (nội bộ) |
| 4 | `kiemTraKhungThoiGianSale` | Service (nội bộ) | PromotionService.kiemTraKhungThoiGianSale (nội bộ) |
| 5 | `yeuCauNhapLai` | Kết quả trả về |  |
| 6 | `hienThiThongBaoLoiVaYeuCauNhapLai` | Frontend |  |
| 7 | `luuLichTrinhChienDichSale` | DAO | PromotionDAO.luuLichTrinhChienDichSale |
| 8 | `xacNhanLuuChienDichThanhCong` | Kết quả trả về |  |
| 9 | `thongBaoLenChienDichThanhCong` | Kết quả trả về |  |
| 10 | `hienThiThongBaoThanhCong` | Frontend |  |

## UC28. Tự sinh mã kích hoạt (Key)

| # | Hàm trong sơ đồ | Loại | Lớp.hàm |
|---|---|---|---|
| 1 | `nhapSoLuongKeyCanSinh` | Frontend |  |
| 2 | `yeuCauSinhMaKichHoat` | Service (public) | PromotionService.yeuCauSinhMaKichHoat |
| 3 | `kiemTraGameCoThuPhi` | DAO | PromotionDAO.kiemTraGameCoThuPhi |
| 4 | `traVeTrangThaiThuPhi` | Kết quả trả về |  |
| 5 | `kiemTraSoLuongKeyYeuCauDuoi200` | Service (nội bộ) | PromotionService.kiemTraSoLuongKeyYeuCauDuoi200 (nội bộ) |
| 6 | `kiemTraTongKeyChuaKichHoatDuoi2000` | DAO | PromotionDAO.kiemTraTongKeyChuaKichHoatDuoi2000 |
| 7 | `traVeKetQuaKiemTraTongKey` | Kết quả trả về |  |
| 8 | `thongBaoYeuCauKhongHopLe` | Kết quả trả về |  |
| 9 | `hienThiThongBaoTuChoiSinhKey` | Frontend |  |
| 10 | `sinhDanhSachMaKeyNgauNhien` | Service (nội bộ) | PromotionService.sinhDanhSachMaKeyNgauNhien (nội bộ) |
| 11 | `luuDanhSachMaKeyMoi` | DAO | PromotionDAO.luuDanhSachMaKeyMoi |
| 12 | `xacNhanLuuKeyThanhCong` | Kết quả trả về |  |
| 13 | `traVeDanhSachMaKey` | Kết quả trả về |  |
| 14 | `hienThiDanhSachMaKey` | Frontend |  |

## UC29. Rollback phiên bản Build

| # | Hàm trong sơ đồ | Loại | Lớp.hàm |
|---|---|---|---|
| 1 | `chonRollbackPhienBan` | Frontend |  |
| 2 | `yeuCauRollbackPhienBan` | Service (public) | GameService.yeuCauRollbackPhienBan |
| 3 | `kiemTraDanhSachPhienBanLuuTru` | DAO | GameDAO.kiemTraDanhSachPhienBanLuuTru |
| 4 | `traVeDanhSachPhienBanCu` | Kết quả trả về |  |
| 5 | `thongBaoKhongTheRollback` | Kết quả trả về |  |
| 6 | `hienThiThongBaoLoi` | Frontend |  |
| 7 | `hienThiDanhSachPhienBanCu` | Kết quả trả về |  |
| 8 | `chonPhienBanCanKhoiPhuc` | Frontend |  |
| 9 | `xacNhanKhoiPhucPhienBan` | Service (public) | GameService.xacNhanKhoiPhucPhienBan |
| 10 | `capNhatPhienBanHienTai` | DAO | GameDAO.capNhatPhienBanHienTai |
| 11 | `xacNhanCapNhatThanhCong` | Kết quả trả về |  |
| 12 | `thongBaoRollbackThanhCong` | Kết quả trả về |  |
| 13 | `hienThiThongBaoThanhCong` | Frontend |  |

## UC30. Báo cáo doanh thu real-time

| # | Hàm trong sơ đồ | Loại | Lớp.hàm |
|---|---|---|---|
| 1 | `chonXemBaoCaoDoanhThu` | Frontend |  |
| 2 | `yeuCauBaoCaoDoanhThuRealTime` | Service (public) | ReportService.yeuCauBaoCaoDoanhThuRealTime |
| 3 | `truyVanGiaoDichThanhCong` | DAO | ReportDAO.truyVanGiaoDichThanhCong |
| 4 | `traVeDuLieuGiaoDich` | Kết quả trả về |  |
| 5 | `tinhTongDoanhThuVaSoLuongBan` | Service (nội bộ) | ReportService.tinhTongDoanhThuVaSoLuongBan (nội bộ) |
| 6 | `traVeSoLieuBaoCao` | Kết quả trả về |  |
| 7 | `hienThiBaoCaoDoanhThuRealTime` | Frontend |  |

## UC31. Kết xuất bảng kê đối soát

| # | Hàm trong sơ đồ | Loại | Lớp.hàm |
|---|---|---|---|
| 1 | `chonKetXuatBangKeDoiSoat` | Frontend |  |
| 2 | `yeuCauKetXuatBangKe` | Service (public) | ReportService.yeuCauKetXuatBangKe |
| 3 | `truyVanDuLieuDoiSoatKyNay` | DAO | ReportDAO.truyVanDuLieuDoiSoatKyNay |
| 4 | `traVeDuLieuTaiChinh` | Kết quả trả về |  |
| 5 | `tinhDoanhThuPhiSanHoanTienThucNhan` | Service (nội bộ) | ReportService.tinhDoanhThuPhiSanHoanTienThucNhan (nội bộ) |
| 6 | `taoTepBangKeDoiSoat` | Service (nội bộ) | ReportService.taoTepBangKeDoiSoat (nội bộ) |
| 7 | `traVeTepDoiSoat` | Kết quả trả về |  |
| 8 | `taiXuongTepBangKeDoiSoat` | Frontend |  |

## UC32. Thống kê Wishlist & Refund

| # | Hàm trong sơ đồ | Loại | Lớp.hàm |
|---|---|---|---|
| 1 | `chonXemThongKeWishlistVaRefund` | Frontend |  |
| 2 | `yeuCauThongKeTuongTac` | Service (public) | ReportService.yeuCauThongKeTuongTac |
| 3 | `truyVanLuotWishlistVaRefund` | DAO | ReportDAO.truyVanLuotWishlistVaRefund |
| 4 | `traVeDuLieuWishlistVaRefund` | Kết quả trả về |  |
| 5 | `tinhTyLeChuyenDoiVaTyLeHoanTien` | Service (nội bộ) | ReportService.tinhTyLeChuyenDoiVaTyLeHoanTien (nội bộ) |
| 6 | `traVeKetQuaThongKe` | Kết quả trả về |  |
| 7 | `hienThiBieuDoWishlistVaRefund` | Frontend |  |

## UC33. Rút doanh thu về ngân hàng

| # | Hàm trong sơ đồ | Loại | Lớp.hàm |
|---|---|---|---|
| 1 | `nhapSoTienVaTaiKhoanNganHang` | Frontend |  |
| 2 | `guiYeuCauRutDoanhThu` | Service (public) | WithdrawalService.guiYeuCauRutDoanhThu |
| 3 | `kiemTraSoTienKhaDung` | DAO | WithdrawalDAO.kiemTraSoTienKhaDung |
| 4 | `traVeSoDuDoanhThu` | Kết quả trả về |  |
| 5 | `kiemTraHanMucRutToiThieu` (đọc bổ sung) | Service (nội bộ) | WithdrawalService.kiemTraHanMucRutToiThieu (nội bộ) |
| 6 | `thongBaoThatBai` | Kết quả trả về |  |
| 7 | `hienThiThongBaoGiaoDichThatBai` | Frontend |  |
| 8 | `taoLenhRutTienVaTamGiuSoDu` | DAO | WithdrawalDAO.taoLenhRutTienVaTamGiuSoDu |
| 9 | `xacNhanTaoLenhRutThanhCong` | Kết quả trả về |  |
| 10 | `thongBaoGuiYeuCauRutThanhCong` | Kết quả trả về |  |
| 11 | `hienThiThongBaoTiepNhanYeuCau` | Frontend |  |

## UC34. Cập nhật trạng thái Game

| # | Hàm trong sơ đồ | Loại | Lớp.hàm |
|---|---|---|---|
| 1 | `chonTrangThaiGameMoi` | Frontend |  |
| 2 | `yeuCauCapNhatTrangThaiGame` | Service (public) | GameService.yeuCauCapNhatTrangThaiGame |
| 3 | `kiemTraTrangThaiGameHienTai` | DAO | GameDAO.kiemTraTrangThaiGameHienTai |
| 4 | `traVeTrangThaiHienTai` | Kết quả trả về |  |
| 5 | `kiemTraChuyenDoiHopLe` (đọc bổ sung) | Service (nội bộ) | GameService.kiemTraChuyenDoiHopLe (nội bộ) |
| 6 | `thongBaoTrangThaiKhongHopLe` | Kết quả trả về |  |
| 7 | `hienThiThongBaoLoi` | Frontend |  |
| 8 | `capNhatTrangThaiGameMoi` | DAO | GameDAO.capNhatTrangThaiGameMoi |
| 9 | `xacNhanCapNhatThanhCong` | Kết quả trả về |  |
| 10 | `thongBaoCapNhatTrangThaiThanhCong` | Kết quả trả về |  |
| 11 | `hienThiThongBaoThanhCong` | Frontend |  |

## UC35. Gỡ game khỏi hệ thống

| # | Hàm trong sơ đồ | Loại | Lớp.hàm |
|---|---|---|---|
| 1 | `chonGoGameKhoiHeThong` | Frontend |  |
| 2 | `yeuCauGoGame` | Service (public) | GameService.yeuCauGoGame |
| 3 | `kiemTraSoLuongNguoiChoiSoHuu` | DAO | GameDAO.kiemTraSoLuongNguoiChoiSoHuu |
| 4 | `traVeSoLuongNguoiChoi` | Kết quả trả về |  |
| 5 | `hienThiCanhBaoVaXacNhanGoGame` | Kết quả trả về |  |
| 6 | `xacNhanDongYGoGame` | Frontend |  |
| 7 | `thucHienGoGameKhoiHeThong` | Service (public) | GameService.thucHienGoGameKhoiHeThong |
| 8 | `capNhatTrangThaiDelisted` | DAO | GameDAO.capNhatTrangThaiDelisted |
| 9 | `xacNhanDelistedThanhCong` | Kết quả trả về |  |
| 10 | `thongBaoGoGameThanhCong` | Kết quả trả về |  |
| 11 | `hienThiThongBaoThanhCong` | Frontend |  |

## UC36. Ẩn game

| # | Hàm trong sơ đồ | Loại | Lớp.hàm |
|---|---|---|---|
| 1 | `chonAnGame` | Frontend |  |
| 2 | `yeuCauAnGame` | Service (public) | GameService.yeuCauAnGame |
| 3 | `capNhatTrangThaiAnGame` | DAO | GameDAO.capNhatTrangThaiAnGame |
| 4 | `xacNhanCapNhatThanhCong` | Kết quả trả về |  |
| 5 | `thongBaoAnGameThanhCong` | Kết quả trả về |  |
| 6 | `hienThiThongBaoThanhCong` | Frontend |  |

## UC37. Xóa tài khoản Nhà phát hành và gỡ toàn bộ sản phẩm

| # | Hàm trong sơ đồ | Loại | Lớp.hàm |
|---|---|---|---|
| 1 | `chonXoaTaiKhoanVaGoToanBoSanPham` | Frontend |  |
| 2 | `hienThiYeuCauXacThuc` | Frontend |  |
| 3 | `nhapThongTinXacThuc` | Frontend |  |
| 4 | `guiYeuCauXoaTaiKhoan` | Frontend |  |
| 5 | `xacThucDanhTinhNhaPhatHanh` | Kết quả trả về |  |
| 6 | `traVeKetQuaXacThuc` | Kết quả trả về |  |
| 7 | `kiemTraSoDuDoanhThu` | Frontend |  |
| 9 | `traVeSoDu` | Kết quả trả về |  |
| 10 | `traVeTrangThaiSoDu` | Frontend |  |
| 11 | `kiemTraDonHangTrongThoiHanHoanTien` | Frontend |  |
| 12 | `truyVanGiaoDichGanNhat` | Kết quả trả về |  |
| 13 | `traVeKetQuaGiaoDich` | Kết quả trả về |  |
| 14 | `traVeTrangThaiHoanTien` | Frontend |  |
| 15 | `thongBaoTuChoiXoa` | Frontend |  |
| 16 | `hienThiLyDoTuChoiXoaTaiKhoan` | Frontend |  |
| 17 | `baoLuuQuyenTaiLaiNguoiChoiCu` | Kết quả trả về |  |
| 18 | `capNhatQuyenBanQuyenNguoiChoi` | Kết quả trả về |  |
| 19 | `xacNhanCapNhatBanQuyen` | Kết quả trả về |  |
| 20 | `goToanBoSanPhamKhoiCuaHang` | Kết quả trả về |  |
| 21 | `capNhatTrangThaiToanBoGameDelisted` | Kết quả trả về |  |
| 22 | `xacNhanGoToanBoGame` | Kết quả trả về |  |
| 23 | `khoaVinhVienTaiKhoanDeveloper` | Kết quả trả về |  |
| 24 | `xacNhanKhoaTaiKhoan` | Kết quả trả về |  |
| 25 | `thongBaoXoaTaiKhoanThanhCong` | Frontend |  |
| 26 | `chuyenHuongVeTrangDangNhap` | Frontend |  |

## UC38. Kiểm tra thông tin game mới

| # | Hàm trong sơ đồ | Loại | Lớp.hàm |
|---|---|---|---|
| 1 | `chonKiemTraThongTinGameMoi` | Frontend |  |
| 2 | `yeuCauLayHoSoGameChoDuyet` | Service (public) | ModerationService.yeuCauLayHoSoGameChoDuyet |
| 3 | `truyVanDanhSachGameChoDuyet` | DAO | ModerationDAO.truyVanDanhSachGameChoDuyet |
| 4 | `traVeDanhSachGameChoDuyet` | Kết quả trả về |  |
| 5 | `hienThiDanhSachGame` | Kết quả trả về |  |
| 6 | `chonGameCanKiemTra` | Frontend |  |
| 7 | `layChiTietHoSoGame` | Service (public) | ModerationService.layChiTietHoSoGame |
| 8 | `truyVanChiTietGame` | DAO | ModerationDAO.truyVanChiTietGame |
| 9 | `traVeChiTietGame` | Kết quả trả về |  |
| 10 | `hienThiHoSoChiTiet` | Kết quả trả về |  |
| 11 | `xacNhanHoanTatKiemTraThongTin` | Frontend |  |
| 12 | `capNhatTrangThaiDaKiemTra` | Service (public) | ModerationService.capNhatTrangThaiDaKiemTra |
| 13 | `ghiNhanNhatKyKiemTraGame` | Service → Service | AuditLogService.recordLog |
| 14 | `xacNhanLuuThanhCong` | Kết quả trả về |  |
| 15 | `thongBaoKiemTraHoanTat` | Kết quả trả về |  |
| 16 | `hienThiThongBaoHoanTat` | Frontend |  |

## UC39. Phê duyệt phát hành game

| # | Hàm trong sơ đồ | Loại | Lớp.hàm |
|---|---|---|---|
| 1 | `chonPheDuyetPhatHanhGame` | Frontend |  |
| 2 | `yeuCauPheDuyetGame` | Service (public) | ModerationService.yeuCauPheDuyetGame |
| 3 | `kiemTraTrangThaiGameVaFile` | DAO | ModerationDAO.kiemTraTrangThaiGameVaFile |
| 4 | `traVeKetQuaKiemTra` | Kết quả trả về |  |
| 5 | `thongBaoGameKhongDuDieuKien` | Kết quả trả về |  |
| 6 | `hienThiThongBaoTuChoiPheDuyet` | Frontend |  |
| 7 | `capNhatTrangThaiPhatHanhStore` | DAO | ModerationDAO.capNhatTrangThaiPhatHanhStore |
| 8 | `xacNhanCapNhatThanhCong` | Kết quả trả về |  |
| 9 | `ghiNhanNhatKyQuanTri` | Service → Service | AuditLogService.ghiNhanNhatKyQuanTri |
| 10 | `luuNhatKyPheDuyet` | DAO | AuditLogDAO.luuNhatKyPheDuyet |
| 11 | `xacNhanLuuNhatKyThanhCong` | Kết quả trả về |  |
| 12 | `hoanTatGhiNhatKy` | Kết quả trả về |  |
| 13 | `thongBaoPheDuyetThanhCong` | Kết quả trả về |  |
| 14 | `hienThiThongBaoPheDuyetThanhCong` | Frontend |  |

## UC40. Từ chối phát hành game

| # | Hàm trong sơ đồ | Loại | Lớp.hàm |
|---|---|---|---|
| 1 | `chonTuChoiPhatHanhGame` | Frontend |  |
| 2 | `hienThiBieuMauNhapLyDo` | Frontend |  |
| 3 | `nhapLyDoTuChoi` | Frontend |  |
| 4 | `guiYeuCauTuChoiKemLyDo` | Service (public) | ModerationService.guiYeuCauTuChoiKemLyDo |
| 5 | `kiemTraLyDoKhongDuocDeTrong` | Service (nội bộ) | ModerationService.kiemTraLyDoKhongDuocDeTrong (nội bộ) |
| 6 | `thongBaoChuaDienLyDo` | Kết quả trả về |  |
| 7 | `hienThiCanhBaoNhapLyDo` | Frontend |  |
| 8 | `capNhatTrangThaiRejected` | DAO | ModerationDAO.capNhatTrangThaiRejected |
| 9 | `xacNhanCapNhatThanhCong` | Kết quả trả về |  |
| 10 | `ghiNhanNhatKyQuanTri` | Service → Service | AuditLogService.ghiNhanNhatKyQuanTri |
| 11 | `luuNhatKyTuChoi` | DAO | AuditLogDAO.luuNhatKyTuChoi |
| 12 | `xacNhanLuuNhatKyThanhCong` | Kết quả trả về |  |
| 13 | `hoanTatGhiNhatKy` | Kết quả trả về |  |
| 14 | `thongBaoTuChoiThanhCong` | Kết quả trả về |  |
| 15 | `hienThiThongBaoDaTuChoi` | Frontend |  |

## UC41. Gỡ bỏ game khẩn cấp

| # | Hàm trong sơ đồ | Loại | Lớp.hàm |
|---|---|---|---|
| 1 | `chonGoBoGameKhanCap` | Frontend |  |
| 2 | `hienThiXacNhanVaNhapLyDo` | Frontend |  |
| 3 | `xacNhanGoBoGameKhanCap` | Frontend |  |
| 4 | `yeuCauGoBoGameKhanCap` | Service (public) | ModerationService.yeuCauGoBoGameKhanCap |
| 5 | `capNhatTrangThaiDelisted` | DAO | ModerationDAO.capNhatTrangThaiDelisted |
| 6 | `xacNhanCapNhatThanhCong` | Kết quả trả về |  |
| 7 | `ghiNhanNhatKyQuanTri` | Service → Service | AuditLogService.ghiNhanNhatKyQuanTri |
| 8 | `luuNhatKyGoBoKhanCap` | DAO | AuditLogDAO.luuNhatKyGoBoKhanCap |
| 9 | `xacNhanLuuNhatKyThanhCong` | Kết quả trả về |  |
| 10 | `hoanTatGhiNhatKy` | Kết quả trả về |  |
| 11 | `thongBaoGoBoGameThanhCong` | Kết quả trả về |  |
| 12 | `hienThiThongBaoDaGoBoGame` | Frontend |  |

## UC42. Tra cứu lịch sử tài khoản

| # | Hàm trong sơ đồ | Loại | Lớp.hàm |
|---|---|---|---|
| 1 | `nhapThongTinTraCuuTaiKhoan` | Frontend |  |
| 2 | `guiYeuCauTraCuu` | Service (public) | AccountService.guiYeuCauTraCuu |
| 3 | `truyVanThongTinVaLichSuTaiKhoan` | DAO | AccountDAO.truyVanThongTinVaLichSuTaiKhoan |
| 4 | `traVeThongTinVaLichSu` | Kết quả trả về |  |
| 5 | `thongBaoKhongTimThayTaiKhoan` | Kết quả trả về |  |
| 6 | `hienThiThongBaoLoi` | Frontend |  |
| 7 | `traVeDuLieuLichSuTaiKhoan` | Kết quả trả về |  |
| 8 | `hienThiChiTietLichSuTaiKhoan` | Frontend |  |

## UC43. Xử lý đánh giá vi phạm

| # | Hàm trong sơ đồ | Loại | Lớp.hàm |
|---|---|---|---|
| 1 | `chonDanhGiaViPham` | Frontend |  |
| 2 | `hienThiTuyChonXuLy` | Frontend |  |
| 3 | `xacNhanAnHoacXoaDanhGia` | Frontend |  |
| 4 | `yeuCauXuLyDanhGiaViPham` | Service (public) | ModerationService.yeuCauXuLyDanhGiaViPham |
| 5 | `capNhatTrangThaiAnHoacXoaDanhGia` | DAO | ModerationDAO.capNhatTrangThaiAnHoacXoaDanhGia |
| 6 | `xacNhanCapNhatThanhCong` | Kết quả trả về |  |
| 7 | `ghiNhanNhatKyQuanTri` | Service → Service | AuditLogService.ghiNhanNhatKyQuanTri |
| 8 | `luuNhatKyXuLyDanhGia` | DAO | AuditLogDAO.luuNhatKyXuLyDanhGia |
| 9 | `xacNhanLuuNhatKyThanhCong` | Kết quả trả về |  |
| 10 | `hoanTatGhiNhatKy` | Kết quả trả về |  |
| 11 | `thongBaoXuLyDanhGiaThanhCong` | Kết quả trả về |  |
| 12 | `hienThiThongBaoXuLyThanhCong` | Frontend |  |

## UC44. Tạm khóa tài khoản vi phạm

| # | Hàm trong sơ đồ | Loại | Lớp.hàm |
|---|---|---|---|
| 1 | `chonTamKhoaTaiKhoan` | Frontend |  |
| 2 | `hienThiBieuMauChonThoiGianVaLyDo` | Frontend |  |
| 3 | `nhapThoiGianVaLyDoTamKhoa` | Frontend |  |
| 4 | `yeuCauTamKhoaTaiKhoan` | Service (public) | AccountService.yeuCauTamKhoaTaiKhoan |
| 5 | `capNhatTrangThaiTamKhoaTaiKhoan` | DAO | AccountDAO.capNhatTrangThaiTamKhoaTaiKhoan |
| 6 | `xacNhanCapNhatThanhCong` | Kết quả trả về |  |
| 7 | `ghiNhanNhatKyQuanTri` | Service → Service | AuditLogService.ghiNhanNhatKyQuanTri |
| 8 | `luuNhatKyTamKhoa` | DAO | AuditLogDAO.luuNhatKyTamKhoa |
| 9 | `xacNhanLuuNhatKyThanhCong` | Kết quả trả về |  |
| 10 | `hoanTatGhiNhatKy` | Kết quả trả về |  |
| 11 | `thongBaoTamKhoaThanhCong` | Kết quả trả về |  |
| 12 | `hienThiThongBaoTamKhoaThanhCong` | Frontend |  |

## UC45. Khóa vĩnh viễn tài khoản

| # | Hàm trong sơ đồ | Loại | Lớp.hàm |
|---|---|---|---|
| 1 | `chonKhoaVinhVienTaiKhoan` | Frontend |  |
| 2 | `hienThiBieuMauNhapLyDoVaBangChung` | Frontend |  |
| 3 | `nhapLyDoVaXacNhanKhoa` | Frontend |  |
| 4 | `yeuCauKhoaVinhVien` | Service (public) | AccountService.yeuCauKhoaVinhVien |
| 5 | `capNhatTrangThaiBanned` | DAO | AccountDAO.capNhatTrangThaiBanned |
| 6 | `xacNhanCapNhatThanhCong` | Kết quả trả về |  |
| 7 | `ghiNhanNhatKyQuanTri` | Service → Service | AuditLogService.ghiNhanNhatKyQuanTri |
| 8 | `luuNhatKyKhoaVinhVien` | DAO | AuditLogDAO.luuNhatKyKhoaVinhVien |
| 9 | `xacNhanLuuNhatKyThanhCong` | Kết quả trả về |  |
| 10 | `hoanTatGhiNhatKy` | Kết quả trả về |  |
| 11 | `thongBaoKhoaVinhVienThanhCong` | Kết quả trả về |  |
| 12 | `hienThiThongBaoKhoaVinhVienThanhCong` | Frontend |  |

## UC47. Giám sát nội dung cộng đồng

| # | Hàm trong sơ đồ | Loại | Lớp.hàm |
|---|---|---|---|
| 1 | `chonGiamSatNoiDungCongDong` | Frontend |  |
| 2 | `yeuCauDanhSachNoiDungGanCo` | Service (public) | ModerationService.yeuCauDanhSachNoiDungGanCo |
| 3 | `truyVanNoiDungBiGanCo` | DAO | ModerationDAO.truyVanNoiDungBiGanCo |
| 4 | `traVeDanhSachNoiDungGanCo` | Kết quả trả về |  |
| 5 | `hienThiDanhSachNoiDung` | Kết quả trả về |  |
| 6 | `kiemTraNoiDungVaDanhDauXuLy` | Frontend |  |
| 7 | `capNhatTrangThaiKiemDuyet` | Service (public) | ModerationService.capNhatTrangThaiKiemDuyet |
| 8 | `luuTrangThaiKiemDuyet` | DAO | ModerationDAO.luuTrangThaiKiemDuyet |
| 9 | `xacNhanLuuThanhCong` | Kết quả trả về |  |
| 10 | `thongBaoCapNhatThanhCong` | Kết quả trả về |  |
| 11 | `hienThiThongBaoHoanTat` | Frontend |  |

## UC48. Quản lý danh mục thể loại

| # | Hàm trong sơ đồ | Loại | Lớp.hàm |
|---|---|---|---|
| 1 | `chonThaoTacDanhMucTheLoai` | Frontend |  |
| 2 | `nhapThongTinTheLoaiMoi` | Frontend |  |
| 3 | `yeuCauThemTheLoai` | Service (public) | GenreService.yeuCauThemTheLoai |
| 4 | `kiemTraTrungLapTenTheLoai` | DAO | GenreDAO.kiemTraTrungLapTenTheLoai |
| 5 | `traVeKetQuaKiemTra` | Kết quả trả về |  |
| 6 | `khongTheThem` | Kết quả trả về |  |
| 7 | `hienThiThongBaoKhongTheThem` | Frontend |  |
| 8 | `taoTheLoaiMoi` | DAO | GenreDAO.taoTheLoaiMoi |
| 9 | `xacNhanTaoThanhCong` | Kết quả trả về |  |
| 10 | `thongBaoThemThanhCong` | Kết quả trả về |  |
| 11 | `hienThiThongBaoThanhCong` | Frontend |  |
| 12 | `nhapThongTinTheLoaiCanSua` | Frontend |  |
| 13 | `yeuCauSuaTheLoai` | Service (public) | GenreService.yeuCauSuaTheLoai |
| 14 | `kiemTraTrungLapTenMoi` | DAO | GenreDAO.kiemTraTrungLapTenMoi |
| 15 | `traVeKetQuaKiemTra` | Kết quả trả về |  |
| 16 | `khongTheSua` | Kết quả trả về |  |
| 17 | `hienThiThongBaoKhongTheSua` | Frontend |  |
| 18 | `capNhatTheLoai` | DAO | GenreDAO.capNhatTheLoai |
| 19 | `xacNhanCapNhatThanhCong` | Kết quả trả về |  |
| 20 | `thongBaoSuaThanhCong` | Kết quả trả về |  |
| 21 | `hienThiThongBaoThanhCong` | Frontend |  |
| 22 | `chonTheLoaiCanXoa` | Frontend |  |
| 23 | `yeuCauXoaTheLoai` | Service (public) | GenreService.yeuCauXoaTheLoai |
| 24 | `kiemTraRangBuocGameDangDung` | DAO | GenreDAO.kiemTraRangBuocGameDangDung |
| 25 | `traVeKetQuaRangBuoc` | Kết quả trả về |  |
| 26 | `khongDuocXoa` | Kết quả trả về |  |
| 27 | `hienThiThongBaoKhongDuocXoa` | Frontend |  |
| 28 | `xoaTheLoai` | DAO | GenreDAO.xoaTheLoai |
| 29 | `xacNhanXoaThanhCong` | Kết quả trả về |  |
| 30 | `thongBaoXoaThanhCong` | Kết quả trả về |  |
| 31 | `hienThiThongBaoThanhCong` | Frontend |  |

## UC49. Cấu hình banner trang chủ

| # | Hàm trong sơ đồ | Loại | Lớp.hàm |
|---|---|---|---|
| 1 | `chonCauHinhBannerTrangChu` | Frontend |  |
| 2 | `hienThiDanhSachBannerHienTai` | Frontend |  |
| 3 | `taiLenBannerMoiVaThietLapLich` | Frontend |  |
| 4 | `guiThongTinBannerMoi` | Service (public) | BannerService.guiThongTinBannerMoi |
| 5 | `kiemTraKichThuocVaDinhDang` | Service (nội bộ) | BannerService.kiemTraKichThuocVaDinhDang (nội bộ) |
| 6 | `luuTepAnhBanner` | Client ngoài | StorageClient.luuTepAnhBanner |
| 7 | `traVeDuongDanAnh` | Kết quả trả về |  |
| 8 | `luuCauHinhBannerVaLichHienThi` | DAO | BannerDAO.luuCauHinhBannerVaLichHienThi |
| 9 | `xacNhanLuuThanhCong` | Kết quả trả về |  |
| 10 | `thongBaoCauHinhThanhCong` | Kết quả trả về |  |
| 11 | `hienThiThongBaoCauHinhThanhCong` | Frontend |  |

## UC50. Dashboard tài chính tổng quan

| # | Hàm trong sơ đồ | Loại | Lớp.hàm |
|---|---|---|---|
| 1 | `chonDashboardTaiChinhTongQuan` | Frontend |  |
| 2 | `yeuCauLayDuLieuTongQuan` | Service (public) | FinanceService.yeuCauLayDuLieuTongQuan |
| 3 | `truyVanDuLieuTaiChinhRealTime` | DAO | ReportDAO.truyVanDuLieuTaiChinhRealTime |
| 4 | `traVeDuLieuTaiChinh` | Kết quả trả về |  |
| 5 | `tinhToanCacChiSoTaiChinh` | Service (nội bộ) | FinanceService.tinhToanCacChiSoTaiChinh (nội bộ) |
| 6 | `traVeDuLieuDashboard` | Kết quả trả về |  |
| 7 | `hienThiDashboardTaiChinh` | Frontend |  |

## UC51. Thống kê doanh số toàn sàn

| # | Hàm trong sơ đồ | Loại | Lớp.hàm |
|---|---|---|---|
| 1 | `chonThongKeDoanhSoToanSan` | Frontend |  |
| 2 | `hienThiBoLocThoiGian` | Frontend |  |
| 3 | `thietLapKhoangThoiGian` | Frontend |  |
| 4 | `guiYeuCauThongKeDoanhSo` | Service (public) | FinanceService.guiYeuCauThongKeDoanhSo |
| 5 | `truyVanDonHangThanhCongTheoThoiGian` | DAO | ReportDAO.truyVanDonHangThanhCongTheoThoiGian |
| 6 | `traVeDanhSachDonHang` | Kết quả trả về |  |
| 7 | `tongHopTongDoanhSo` | Service (nội bộ) | FinanceService.tongHopTongDoanhSo (nội bộ) |
| 8 | `traVeKetQuaThongKeDoanhSo` | Kết quả trả về |  |
| 9 | `hienThiBaoCaoDoanhSo` | Frontend |  |

## UC52. Thống kê hoa hồng nền tảng

| # | Hàm trong sơ đồ | Loại | Lớp.hàm |
|---|---|---|---|
| 1 | `chonThongKeHoaHongNenTang` | Frontend |  |
| 2 | `yeuCauThongKeHoaHong` | Service (public) | FinanceService.yeuCauThongKeHoaHong |
| 3 | `truyVanDoanhThuDonHangVaTyLeChietKhau` | DAO | ReportDAO.truyVanDoanhThuDonHangVaTyLeChietKhau |
| 4 | `traVeDuLieuDoanhThuVaChietKhau` | Kết quả trả về |  |
| 5 | `tinhTongHoaHongNenTangThuVe` | Service (nội bộ) | FinanceService.tinhTongHoaHongNenTangThuVe (nội bộ) |
| 6 | `traVeSoLieuHoaHong` | Kết quả trả về |  |
| 7 | `hienThiBaoCaoHoaHongNenTang` | Frontend |  |

## UC53. Xuất báo cáo tài chính định kỳ

| # | Hàm trong sơ đồ | Loại | Lớp.hàm |
|---|---|---|---|
| 1 | `chonXuatBaoCaoTaiChinhDinhKy` | Frontend |  |
| 2 | `hienThiTuyChonKyBaoCaoVaDinhDang` | Frontend |  |
| 3 | `chonKyBaoCaoVaDinhDangTep` | Frontend |  |
| 4 | `yeuCauXuatBaoCaoTaiChinh` | Service (public) | FinanceService.yeuCauXuatBaoCaoTaiChinh |
| 5 | `truyVanDuLieuTaiChinhTheoKy` | DAO | ReportDAO.truyVanDuLieuTaiChinhTheoKy |
| 6 | `traVeDuLieuTaiChinhKy` | Kết quả trả về |  |
| 7 | `ketXuatTepBaoCaoTaiChinh` | Service (nội bộ) | FinanceService.ketXuatTepBaoCaoTaiChinh (nội bộ) |
| 8 | `traVeTepBaoCao` | Kết quả trả về |  |
| 9 | `taiXuongTepBaoCaoTaiChinh` | Frontend |  |

## UC54. Theo dõi dòng tiền chờ rút

| # | Hàm trong sơ đồ | Loại | Lớp.hàm |
|---|---|---|---|
| 1 | `chonTheoDoiDongTienChoRut` | Frontend |  |
| 2 | `yeuCauDuLieuDongTienChoRut` | Service (public) | FinanceService.yeuCauDuLieuDongTienChoRut |
| 3 | `truyVanSoDuDoanhThuCacNhaPhatHanh` | DAO | ReportDAO.truyVanSoDuDoanhThuCacNhaPhatHanh |
| 4 | `traVeSoDuDoanhThuCacNhaPhatHanh` | Kết quả trả về |  |
| 5 | `phanLoaiSoDuKhaDungVaTamGiu` | Service (nội bộ) | FinanceService.phanLoaiSoDuKhaDungVaTamGiu (nội bộ) |
| 6 | `traVeDanhSachDongTienChoRut` | Kết quả trả về |  |
| 7 | `hienThiDanhSachDongTienChoRut` | Frontend |  |

## UC55. Thống kê giá trị hoàn tiền

| # | Hàm trong sơ đồ | Loại | Lớp.hàm |
|---|---|---|---|
| 1 | `chonThongKeGiaTriHoanTien` | Frontend |  |
| 2 | `yeuCauThongKeHoanTien` | Service (public) | FinanceService.yeuCauThongKeHoanTien |
| 3 | `truyVanCacDonHangHoanTienThanhCong` | DAO | ReportDAO.truyVanCacDonHangHoanTienThanhCong |
| 4 | `traVeDanhSachDonHangHoanTien` | Kết quả trả về |  |
| 5 | `tinhTongGiaTriVaTyLeHoanTien` | Service (nội bộ) | FinanceService.tinhTongGiaTriVaTyLeHoanTien (nội bộ) |
| 6 | `traVeKetQuaThongKeHoanTien` | Kết quả trả về |  |
| 7 | `hienThiBaoCaoGiaTriHoanTien` | Frontend |  |

## UC56. Theo dõi biến động số dư ví

| # | Hàm trong sơ đồ | Loại | Lớp.hàm |
|---|---|---|---|
| 1 | `chonTheoDoiBienDongSoDuVi` | Frontend |  |
| 2 | `yeuCauNhatKyBienDongSoDu` | Service (public) | FinanceService.yeuCauNhatKyBienDongSoDu |
| 3 | `truyVanNhatKyGiaoDichViToanSan` | DAO | ReportDAO.truyVanNhatKyGiaoDichViToanSan |
| 4 | `traVeNhatKyGiaoDichVi` | Kết quả trả về |  |
| 5 | `kiemTraDoiSoatCanBangSoDu` | Service (nội bộ) | FinanceService.kiemTraDoiSoatCanBangSoDu (nội bộ) |
| 6 | `traVeDuLieuNhatKyBienDong` | Kết quả trả về |  |
| 7 | `hienThiNhatKyBienDongSoDuVi` | Frontend |  |

## UC57. Phê duyệt rút doanh thu

| # | Hàm trong sơ đồ | Loại | Lớp.hàm |
|---|---|---|---|
| 1 | `chonLenhRutTienCanDuyet` | Frontend |  |
| 2 | `layChiTietLenhRutTien` | Service (public) | WithdrawalService.layChiTietLenhRutTien |
| 3 | `truyVanChiTietLenhRutVaThongTinNganHang` | DAO | WithdrawalDAO.truyVanChiTietLenhRutVaThongTinNganHang |
| 4 | `traVeChiTietLenhRut` | Kết quả trả về |  |
| 5 | `hienThiChiTietLenhRutTien` | Kết quả trả về |  |
| 6 | `tuChoiLenhRutTien` | Frontend |  |
| 7 | `guiYeuCauTuChoi` | Service (public) | WithdrawalService.guiYeuCauTuChoi |
| 8 | `hoanLaiSoDuTamGiuVaoViNPH` | DAO | WithdrawalDAO.hoanLaiSoDuTamGiuVaoViNPH |
| 9 | `xacNhanHoanLaiThanhCong` | Kết quả trả về |  |
| 10 | `thongBaoTuChoiThanhCong` | Kết quả trả về |  |
| 11 | `hienThiThongBaoDaTuChoi` | Frontend |  |
| 12 | `xacNhanPheDuyetLenhRutTien` | Frontend |  |
| 13 | `guiYeuCauChuyenKhoan` | Service (public) | WithdrawalService.guiYeuCauChuyenKhoan |
| 14 | `yeuCauChuyenKhoanNganHang` | Client ngoài | BankClient.yeuCauChuyenKhoanNganHang |
| 15 | `traVeKetQuaGiaoDich` | Kết quả trả về |  |
| 16 | `capNhatTrangThaiRutTienThanhCong` | DAO | WithdrawalDAO.capNhatTrangThaiRutTienThanhCong |
| 17 | `xacNhanCapNhatThanhCong` | Kết quả trả về |  |
| 18 | `thongBaoPheDuyetThanhCong` | Kết quả trả về |  |
| 19 | `hienThiThongBaoPheDuyetThanhCong` | Frontend |  |
| 20 | `thongBaoChuyenKhoanThatBai` | Kết quả trả về |  |
| 21 | `hienThiThongBaoGiaoDichNganHangLoi` | Frontend |  |

## UC58. Cấu hình tham số hệ thống

| # | Hàm trong sơ đồ | Loại | Lớp.hàm |
|---|---|---|---|
| 1 | `chonCauHinhThamSoHeThong` | Frontend |  |
| 2 | `yeuCauLayDanhSachThamSo` | Service (public) | SystemConfigService.yeuCauLayDanhSachThamSo |
| 3 | `truyVanThamSoToanCuc` | DAO | SystemConfigDAO.truyVanThamSoToanCuc |
| 4 | `traVeDanhSachThamSo` | Kết quả trả về |  |
| 5 | `traVeDuLieuThamSo` | Kết quả trả về |  |
| 6 | `hienThiDanhSachThamSo` | Frontend |  |
| 7 | `nhapGiaTriCauHinhMoi` | Frontend |  |
| 8 | `guiYeuCauCapNhatThamSo` | Service (public) | SystemConfigService.guiYeuCauCapNhatThamSo |
| 9 | `kiemTraTinhHopLeCuaThamSo` | Service (nội bộ) | SystemConfigService.kiemTraTinhHopLeCuaThamSo (nội bộ) |
| 10 | `thongBaoThamSoKhongHopLe` | Kết quả trả về |  |
| 11 | `hienThiThongBaoLoi` | Frontend |  |
| 12 | `capNhatThamSoMoi` | DAO | SystemConfigDAO.capNhatThamSoMoi |
| 13 | `xacNhanCapNhatThanhCong` | Kết quả trả về |  |
| 14 | `xoaBoNhoDemToanCuc` | Service (nội bộ) | SystemConfigService.xoaBoNhoDemToanCuc (nội bộ) |
| 15 | `ghiNhanNhatKyQuanTri` | Service → Service | AuditLogService.ghiNhanNhatKyQuanTri |
| 16 | `luuNhatKyCapNhatThamSo` | DAO | AuditLogDAO.luuNhatKyCapNhatThamSo |
| 17 | `xacNhanLuuNhatKyThanhCong` | Kết quả trả về |  |
| 18 | `hoanTatGhiNhatKy` | Kết quả trả về |  |
| 19 | `thongBaoCapNhatThanhCong` | Kết quả trả về |  |
| 20 | `hienThiThongBaoLuuThanhCong` | Frontend |  |

## UC59. Phân quyền truy cập (RBAC)

| # | Hàm trong sơ đồ | Loại | Lớp.hàm |
|---|---|---|---|
| 1 | `chonPhanQuyenTruyCap` | Frontend |  |
| 2 | `yeuCauLayMaTranPhanQuyen` | Service (public) | RbacService.yeuCauLayMaTranPhanQuyen |
| 3 | `truyVanDanhSachVaiTroVaQuyen` | DAO | RoleDAO.truyVanDanhSachVaiTroVaQuyen |
| 4 | `traVeDanhSachVaiTroVaQuyen` | Kết quả trả về |  |
| 5 | `traVeMaTranPhanQuyen` | Kết quả trả về |  |
| 6 | `hienThiMaTranPhanQuyen` | Frontend |  |
| 7 | `dieuChinhQuyenHanCuaVaiTro` | Frontend |  |
| 8 | `guiYeuCauCapNhatPhanQuyen` | Service (public) | RbacService.guiYeuCauCapNhatPhanQuyen |
| 9 | `kiemTraXungDotQuyenHan` | Service (nội bộ) | RbacService.kiemTraXungDotQuyenHan (nội bộ) |
| 10 | `thongBaoXungDotQuyenHan` | Kết quả trả về |  |
| 11 | `hienThiCanhBaoPhuThuocQuyen` | Frontend |  |
| 12 | `capNhatChinhSachQuyenMoi` | DAO | RoleDAO.capNhatChinhSachQuyenMoi |
| 13 | `xacNhanCapNhatThanhCong` | Kết quả trả về |  |
| 14 | `lamMoiTokenQuyenCacTaiKhoan` | Service (nội bộ) | RbacService.lamMoiTokenQuyenCacTaiKhoan (nội bộ) |
| 15 | `ghiNhanNhatKyQuanTri` | Service → Service | AuditLogService.ghiNhanNhatKyQuanTri |
| 16 | `luuNhatKyPhanQuyen` | DAO | AuditLogDAO.luuNhatKyPhanQuyen |
| 17 | `xacNhanLuuNhatKyThanhCong` | Kết quả trả về |  |
| 18 | `hoanTatGhiNhatKy` | Kết quả trả về |  |
| 19 | `thongBaoCapNhatQuyenThanhCong` | Kết quả trả về |  |
| 20 | `hienThiThongBaoThanhCong` | Frontend |  |

## UC60. Truy xuất nhật ký toàn cục

| # | Hàm trong sơ đồ | Loại | Lớp.hàm |
|---|---|---|---|
| 1 | `truyCapNhatKyToanCuc` | Frontend |  |
| 2 | `yeuCauLayNhatKyGanNhat` | Service (public) | AuditLogService.yeuCauLayNhatKyGanNhat |
| 3 | `truyVanNhatKyGanNhat` | DAO | AuditLogDAO.truyVanNhatKyGanNhat |
| 4 | `traVeDanhSachNhatKyGanNhat` | Kết quả trả về |  |
| 5 | `traVeDuLieuNhatKyGanNhat` | Kết quả trả về |  |
| 6 | `hienThiDanhSachNhatKyGanNhat` | Frontend |  |
| 7 | `thietLapDieuKienLocNangCao` | Frontend |  |
| 8 | `guiYeuCauLocNhatKy` | Service (public) | AuditLogService.guiYeuCauLocNhatKy |
| 9 | `truyVanNhatKyTheoDieuKienLoc` | DAO | AuditLogDAO.truyVanNhatKyTheoDieuKienLoc |
| 10 | `traVeKetQuaLocNhatKy` | Kết quả trả về |  |
| 11 | `thongBaoKhongCoBanGhiPhuHop` | Kết quả trả về |  |
| 12 | `hienThiThongBaoKhongTimThayKetQua` | Frontend |  |
| 13 | `traVeDanhSachKetQuaLoc` | Kết quả trả về |  |
| 14 | `hienThiDanhSachKetQuaLoc` | Frontend |  |
| 15 | `chonXemChiTietBanGhi` | Frontend |  |
| 16 | `yeuCauChiTietBanGhiLog` | Service (public) | AuditLogService.yeuCauChiTietBanGhiLog |
| 17 | `truyVanChiTietBanGhiLog` | DAO | AuditLogDAO.truyVanChiTietBanGhiLog |
| 18 | `traVeChiTietBanGhiLog` | Kết quả trả về |  |
| 19 | `traVeChiTietBanGhiLog` | Kết quả trả về |  |
| 20 | `hienThiChiTietBanGhiLog` | Frontend |  |
| 21 | `chonXuatNhatKy` | Frontend |  |
| 22 | `yeuCauKetXuatTepNhatKy` | Service (public) | AuditLogService.yeuCauKetXuatTepNhatKy |
| 23 | `truyVanDuLieuXuatNhatKy` | DAO | AuditLogDAO.truyVanDuLieuXuatNhatKy |
| 24 | `traVeDuLieuXuatNhatKy` | Kết quả trả về |  |
| 25 | `chuyenCheDoNenTepNgam` (đọc bổ sung) | Service (nội bộ) | AuditLogService.chuyenCheDoNenTepNgam (nội bộ) |
| 26 | `thongBaoDangXuLyNenTep` | Kết quả trả về |  |
| 27 | `hienThiThongBaoNenTepVaGuiSau` | Frontend |  |
| 28 | `taoTepTinBaoCaoNhatKy` | Service (nội bộ) | AuditLogService.taoTepTinBaoCaoNhatKy (nội bộ) |
| 29 | `traVeTepNhatKySanSang` | Kết quả trả về |  |
| 30 | `taiXuongTepNhatKyThanhCong` | Frontend |  |

## UC61. Tạo tài khoản nhân sự mới

| # | Hàm trong sơ đồ | Loại | Lớp.hàm |
|---|---|---|---|
| 1 | `chonTaoTaiKhoanNhanSuMoi` | Frontend |  |
| 2 | `hienThiBieuMauNhapThongTin` | Frontend |  |
| 3 | `nhapThongTinNhanSuMoi` | Frontend |  |
| 4 | `guiYeuCauTaoTaiKhoan` | Service (public) | StaffService.guiYeuCauTaoTaiKhoan |
| 5 | `kiemTraTrungLapEmailVaUsername` | DAO | StaffDAO.kiemTraTrungLapEmailVaUsername |
| 6 | `traVeKetQuaKiemTra` | Kết quả trả về |  |
| 7 | `thongBaoTrungLapThongTin` | Kết quả trả về |  |
| 8 | `hienThiThongBaoLoi` | Frontend |  |
| 9 | `luuTaiKhoanNhanSuMoi` | DAO | StaffDAO.luuTaiKhoanNhanSuMoi |
| 10 | `xacNhanTaoThanhCong` | Kết quả trả về |  |
| 11 | `ghiNhanNhatKyQuanTri` | Service → Service | AuditLogService.ghiNhanNhatKyQuanTri |
| 12 | `luuNhatKyTaoTaiKhoan` | DAO | AuditLogDAO.luuNhatKyTaoTaiKhoan |
| 13 | `xacNhanLuuNhatKyThanhCong` | Kết quả trả về |  |
| 14 | `hoanTatGhiNhatKy` | Kết quả trả về |  |
| 15 | `thongBaoTaoThanhCong` | Kết quả trả về |  |
| 16 | `hienThiThongBaoTaoThanhCong` | Frontend |  |

## UC62. Cập nhật thông tin nhân sự

| # | Hàm trong sơ đồ | Loại | Lớp.hàm |
|---|---|---|---|
| 1 | `chonNhanSuCanChinhSua` | Frontend |  |
| 2 | `layChiTietNhanSu` | Service (public) | StaffService.layChiTietNhanSu |
| 3 | `truyVanChiTietNhanSu` | DAO | StaffDAO.truyVanChiTietNhanSu |
| 4 | `traVeChiTietNhanSu` | Kết quả trả về |  |
| 5 | `hienThiThongTinChiTiet` | Kết quả trả về |  |
| 6 | `nhapThongTinChinhSua` | Frontend |  |
| 7 | `guiYeuCauCapNhatThongTin` | Service (public) | StaffService.guiYeuCauCapNhatThongTin |
| 8 | `kiemTraDinhDangDuLieu` (đọc bổ sung) | Service (nội bộ) | StaffService.kiemTraDinhDangDuLieu (nội bộ) |
| 9 | `thongBaoDuLieuKhongHopLe` | Kết quả trả về |  |
| 10 | `hienThiThongBaoLoi` | Frontend |  |
| 11 | `capNhatThongTinNhanSu` | DAO | StaffDAO.capNhatThongTinNhanSu |
| 12 | `xacNhanCapNhatThanhCong` | Kết quả trả về |  |
| 13 | `ghiNhanNhatKyQuanTri` | Service → Service | AuditLogService.ghiNhanNhatKyQuanTri |
| 14 | `luuNhatKyCapNhatNhanSu` | DAO | AuditLogDAO.luuNhatKyCapNhatNhanSu |
| 15 | `xacNhanLuuNhatKyThanhCong` | Kết quả trả về |  |
| 16 | `hoanTatGhiNhatKy` | Kết quả trả về |  |
| 17 | `thongBaoCapNhatThanhCong` | Kết quả trả về |  |
| 18 | `hienThiThongBaoCapNhatThanhCong` | Frontend |  |
