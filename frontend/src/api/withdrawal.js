import http from './http';

export const withdrawalApi = {
  createWithdrawal: (body) => http.post('/withdrawal/guiYeuCauRutDoanhThu', body),
  getMyRequests: () => http.get('/withdrawal/myRequests'),
  listRequests: (params) => http.post('/withdrawal/layChiTietLenhRutTien', params),
  rejectRequest: (requestId, reason) => (
    http.post('/withdrawal/guiYeuCauTuChoi', { requestId, reason })
  ),
  approveRequest: (requestId) => (
    http.post('/withdrawal/guiYeuCauChuyenKhoan', { requestId })
  ),
};
