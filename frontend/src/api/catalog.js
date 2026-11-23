import http from './http';

// UC6 (tìm kiếm), UC7 (chi tiết) và gửi đánh giá.
export const catalogApi = {
  layDanhSachGame: (params = {}) => http.get('/catalog/layDanhSachGame', { params }),
  yeuCauXemChiTietSanPham: (params) => http.get('/catalog/yeuCauXemChiTietSanPham', { params }),
  guiYeuCauTimKiem: (body) => http.post('/catalog/guiYeuCauTimKiem', body),
  yeuCauLocTheoTheLoai: (body) => http.post('/catalog/yeuCauLocTheoTheLoai', body),
  yeuCauLocTheoKhoangGia: (body) => http.post('/catalog/yeuCauLocTheoKhoangGia', body),
  yeuCauLocTheoTrangThaiSale: (body) => http.post('/catalog/yeuCauLocTheoTrangThaiSale', body),
  sapXepTheoNgayPhatHanh: (body) => http.post('/catalog/sapXepTheoNgayPhatHanh', body),
  sapXepTheoDoPhoBien: (body) => http.post('/catalog/sapXepTheoDoPhoBien', body),
  sapXepTheoGia: (body) => http.post('/catalog/sapXepTheoGia', body),
  taoDanhGia: (body) => http.post('/catalog/taoDanhGia', body),

  // Aliases for compatibility
  listGames: (params = {}) => http.get('/catalog/layDanhSachGame', { params }),
  getGame: (gameId) => http.get('/catalog/yeuCauXemChiTietSanPham', { params: { gameId } }),
  createReview: (gameId, body) => http.post('/catalog/taoDanhGia', { gameId, ...body }),
  listGenres: () => http.get('/genres/layDanhSachTheLoaiCongKhai'),
};
