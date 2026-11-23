import http from './http';

export const orderApi = {
  layDanhSachDonHang: () => http.get('/orders/layDanhSachDonHang'),
  kiemTraMaGiamGia: (couponCode = '') => http.post('/orders/kiemTraMaGiamGia', { couponCode }),
  yeuCauThanhToan: (couponCode = '') => http.post('/orders/yeuCauThanhToan', { couponCode }),
  guiYeuCauHoanTien: (orderId, reason, gameIds) =>
    http.post('/orders/guiYeuCauHoanTien', { orderId, reason, gameIds }),

  // Aliases for compatibility
  list: () => http.get('/orders/layDanhSachDonHang'),
  preview: (couponCode = '') => http.post('/orders/kiemTraMaGiamGia', { couponCode }),
  checkout: (couponCode = '') => http.post('/orders/yeuCauThanhToan', { couponCode }),
  refund: (orderId, reason, gameIds) =>
    http.post('/orders/guiYeuCauHoanTien', { orderId, reason, gameIds }),
};
