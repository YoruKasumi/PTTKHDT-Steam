// src/api/wallet.js
import http from './http';

export const walletApi = {
  yeuCauXemSoDu: () => http.get('/wallet/yeuCauXemSoDu'),
  guiYeuCauNapTien: (body) => http.post('/wallet/guiYeuCauNapTien', body),
  guiYeuCauRutTien: (body) => http.post('/wallet/guiYeuCauRutTien', body),
  yeuCauXemLichSuGiaoDich: (params = {}) => http.get('/wallet/yeuCauXemLichSuGiaoDich', { params }),

  // Aliases for compatibility
};
