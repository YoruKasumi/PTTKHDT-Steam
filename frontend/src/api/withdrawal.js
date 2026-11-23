import http from './http';

export const withdrawalApi = {
  guiYeuCauRutDoanhThu: (body) => http.post('/withdrawal/guiYeuCauRutDoanhThu', body),
  layDanhSachYeuCauRutTien: () => http.get('/withdrawal/layDanhSachYeuCauRutTien'),

  // Aliases for compatibility
  createWithdrawal: (body) => http.post('/withdrawal/guiYeuCauRutDoanhThu', body),
  getMyRequests: () => http.get('/withdrawal/layDanhSachYeuCauRutTien'),
};
