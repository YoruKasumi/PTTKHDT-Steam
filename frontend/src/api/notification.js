import http from './http';

export const notificationApi = {
  layDanhSachThongBao: (params = {}) => http.get('/notifications/layDanhSachThongBao', { params }),
  danhDauTatCaDaDoc: () => http.post('/notifications/danhDauTatCaDaDoc', {}),
  danhDauDaDoc: (notificationId) => http.post('/notifications/danhDauDaDoc', { notificationId }),

  // Aliases for compatibility
  list: (params = {}) => http.get('/notifications/layDanhSachThongBao', { params }),
  markRead: (id) => http.post('/notifications/danhDauDaDoc', { notificationId: id }),
  markAllRead: () => http.post('/notifications/danhDauTatCaDaDoc', {}),
};
