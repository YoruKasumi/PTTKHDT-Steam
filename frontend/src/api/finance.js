import http from './http';

export const financeApi = {
  overview: () => http.get('/finance/yeuCauLayDuLieuTongQuan'),
  sales: () => http.post('/finance/guiYeuCauThongKeDoanhSo', {}),
  commission: () => http.get('/finance/yeuCauThongKeHoaHong'),
  exportReport: () => http.post('/finance/yeuCauXuatBaoCaoTaiChinh', {}),
  pendingPayouts: () => http.get('/finance/yeuCauDuLieuDongTienChoRut'),
  refunds: () => http.get('/finance/yeuCauThongKeHoanTien'),
  walletMovements: () => http.get('/finance/yeuCauNhatKyBienDongSoDu'),
};
