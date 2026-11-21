import http from './http';

export const orderApi = {
  list: () => http.get('/orders'),
  preview: (couponCode = '') => http.post('/orders/preview', { couponCode }),
  checkout: (couponCode = '') => http.post('/orders/checkout', { couponCode }),
};
