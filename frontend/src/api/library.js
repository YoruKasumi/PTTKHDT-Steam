import http from './http';

export const libraryApi = {
  list: () => http.get('/library'),
  redeemKey: (keyCode) => http.post('/library/redeem-key', { keyCode }),
  launch: (gameId, body) =>
    http.post(`/library/${encodeURIComponent(gameId)}/launch`, body), // { deviceFingerprint, deviceName }
  verifyLaunch: (body) => http.post('/library/verify-launch', body),
  listDevices: (gameId) =>
    http.get(`/library/${encodeURIComponent(gameId)}/devices`),
  removeDevice: (gameId, deviceId) =>
    http.delete(`/library/${encodeURIComponent(gameId)}/devices/${encodeURIComponent(deviceId)}`),
};