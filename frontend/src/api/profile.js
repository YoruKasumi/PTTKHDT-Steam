import http from './http';

export const profileApi = {
  get: () => http.get('/profile'),
  updateDisplayName: (displayName) => http.post('/profile/guiTenHienThiMoi', { displayName }),
  update: (body) => http.put('/profile', body),
  changePassword: (body) => http.put('/profile/password', body),
  updateNotifications: (enabled) => http.patch('/profile/notifications', { enabled }),
};
