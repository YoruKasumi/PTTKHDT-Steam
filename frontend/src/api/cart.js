import http from './http';

export const cartApi = {
  list: () => http.get('/cart/items'),
  add: (gameId) => http.post('/cart/items', { gameId }),
  remove: (gameId) => http.delete(`/cart/items/${encodeURIComponent(gameId)}`),
};
