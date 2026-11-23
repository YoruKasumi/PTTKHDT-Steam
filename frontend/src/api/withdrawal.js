import http from './http';

export const withdrawalApi = {
  guiYeuCauRutDoanhThu: (body) => http.post('/withdrawal/guiYeuCauRutDoanhThu', body),
  layDanhSachYeuCauRutTien: () => http.get('/withdrawal/layDanhSachYeuCauRutTien'),
  layChiTietLenhRutTien: (params) => http.post('/withdrawal/layChiTietLenhRutTien', params),
  guiYeuCauTuChoi: (requestId, reason) =>
    http.post('/withdrawal/guiYeuCauTuChoi', { requestId, reason }),
  guiYeuCauChuyenKhoan: (requestId) =>
    http.post('/withdrawal/guiYeuCauChuyenKhoan', { requestId }),

  // Aliases for compatibility
  createWithdrawal: (body) => http.post('/withdrawal/guiYeuCauRutDoanhThu', body),
  getMyRequests: () => http.get('/withdrawal/layDanhSachYeuCauRutTien'),
  listRequests: (params) => http.post('/withdrawal/layChiTietLenhRutTien', params),
  rejectRequest: (requestId, reason) =>
    http.post('/withdrawal/guiYeuCauTuChoi', { requestId, reason }),
  approveRequest: (requestId) =>
    http.post('/withdrawal/guiYeuCauChuyenKhoan', { requestId }),
};
