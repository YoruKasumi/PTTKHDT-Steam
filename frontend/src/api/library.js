import http from './http';

export const libraryApi = {
  list: () => http.get('/library'),
  redeemKey: (keyCode) => http.post('/library/redeem-key', { keyCode }),
  launch: (gameId) =>
    http.post(`/library/${encodeURIComponent(gameId)}/launch`),
  verifyLaunch: (body) => http.post('/library/verify-launch', body),
};
