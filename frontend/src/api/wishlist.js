import http from './http';

export const wishlistApi = {
  layDanhSachWishlist: () => http.get('/wishlist/layDanhSachWishlist'),
  yeuCauThemWishlist: (gameId) => http.post('/wishlist/yeuCauThemWishlist', { gameId }),
  yeuCauXoaWishlist: (gameId) => http.post('/wishlist/yeuCauXoaWishlist', { gameId }),

  // Aliases for compatibility
};
