import http from './http';

export const notificationApi = {
  layDanhSachThongBao: (params = {}) => http.get('/notifications/layDanhSachThongBao', { params }),
  danhDauTatCaDaDoc: () => http.post('/notifications/danhDauTatCaDaDoc', {}),
  danhDauDaDoc: (notificationId) => http.post('/notifications/danhDauDaDoc', { notificationId }),

  // Aliases for compatibility
};
