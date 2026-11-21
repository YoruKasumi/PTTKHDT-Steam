// src/api/wallet.js
import http from './http';

export const walletApi = {
  get: () => http.get('/wallet'),
  deposit: (body) => http.post('/wallet/deposit', body),   // { amount, ... }
  withdraw: (body) => http.post('/wallet/withdraw', body), // { amount, ... }
  transactions: (params = {}) => http.get('/wallet/transactions', { params }), // type, from, to, keyword
};