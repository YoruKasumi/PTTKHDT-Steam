import http from './http';

export const financeApi = {
  // Chuẩn endpoint tiếng Việt
  yeuCauLayDuLieuTongQuan: (params) => http.get('/finance/yeuCauLayDuLieuTongQuan', { params }),
  guiYeuCauThongKeDoanhSo: (body = {}) => http.post('/finance/guiYeuCauThongKeDoanhSo', body),
  yeuCauThongKeHoaHong: (params) => http.get('/finance/yeuCauThongKeHoaHong', { params }),
  yeuCauXuatBaoCaoTaiChinh: (body = {}) => http.post('/finance/yeuCauXuatBaoCaoTaiChinh', body),
  yeuCauDuLieuDongTienChoRut: (params) => http.get('/finance/yeuCauDuLieuDongTienChoRut', { params }),
  yeuCauThongKeHoanTien: (params) => http.get('/finance/yeuCauThongKeHoanTien', { params }),
  yeuCauNhatKyBienDongSoDu: (params) => http.get('/finance/yeuCauNhatKyBienDongSoDu', { params }),

  // Aliases cho frontend
  overview: (params) => http.get('/finance/yeuCauLayDuLieuTongQuan', { params }),
  sales: (body = {}) => http.post('/finance/guiYeuCauThongKeDoanhSo', body),
  commission: (params) => http.get('/finance/yeuCauThongKeHoaHong', { params }),
  exportReport: (body = {}) => http.post('/finance/yeuCauXuatBaoCaoTaiChinh', body),
  pendingPayouts: (params) => http.get('/finance/yeuCauDuLieuDongTienChoRut', { params }),
  refunds: (params) => http.get('/finance/yeuCauThongKeHoanTien', { params }),
  walletMovements: (params) => http.get('/finance/yeuCauNhatKyBienDongSoDu', { params }),
};
