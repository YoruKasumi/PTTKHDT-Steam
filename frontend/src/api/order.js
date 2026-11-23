import http from './http';

export const orderApi = {
  layDanhSachDonHang: () => http.get('/orders/layDanhSachDonHang'),
  kiemTraMaGiamGia: (couponCode = '') => http.post('/orders/kiemTraMaGiamGia', { couponCode }),
  yeuCauThanhToan: (couponCode = '') => http.post('/orders/yeuCauThanhToan', { couponCode }),
  guiYeuCauHoanTien: (orderId, reason, gameIds) =>
    http.post('/orders/guiYeuCauHoanTien', { orderId, reason, gameIds }),
};
