import http from './http';

export const wishlistApi = {
  list: () => http.get('/wishlist'),
  add: (gameId) => http.post('/wishlist', { gameId }),
  remove: (gameId) => http.delete(`/wishlist/${encodeURIComponent(gameId)}`),
};
