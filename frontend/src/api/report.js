import http from './http';

export const reportApi = {
  getRevenueReport: (params) => http.get('/report/yeuCauBaoCaoDoanhThuRealTime', { params }),
  getStatement: (params) => http.get('/report/yeuCauKetXuatBangKe', { params }),
  getEngagementStats: () => http.get('/report/yeuCauThongKeTuongTac'),
};
