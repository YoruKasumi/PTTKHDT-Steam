import http from './http';

export const cartApi = {
  yeuCauXemGioHang: () => http.get('/cart/yeuCauXemGioHang'),
  yeuCauThemSanPham: (gameId) => http.post('/cart/yeuCauThemSanPham', { gameId }),
  yeuCauXoaSanPham: (gameId) => http.post('/cart/yeuCauXoaSanPham', { gameId }),

  // Aliases for compatibility
  list: () => http.get('/cart/yeuCauXemGioHang'),
  add: (gameId) => http.post('/cart/yeuCauThemSanPham', { gameId }),
  remove: (gameId) => http.post('/cart/yeuCauXoaSanPham', { gameId }),
};
