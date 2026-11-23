import http from './http';

export const promotionApi = {
  yeuCauLenChienDichSale: (body) => http.post('/promotion/yeuCauLenChienDichSale', body),
  yeuCauSinhMaKichHoat: (body) => http.post('/promotion/yeuCauSinhMaKichHoat', body),

  // Aliases for compatibility
  createSale: (body) => http.post('/promotion/yeuCauLenChienDichSale', body),
  generateKeys: (body) => http.post('/promotion/yeuCauSinhMaKichHoat', body),
};
