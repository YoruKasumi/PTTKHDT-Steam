import http from './http';

export const profileApi = {
  update: (body) => http.put('/profile', body),
  changePassword: (body) => http.put('/profile/password', body),
  updateNotifications: (enabled) => http.patch('/profile/notifications', { enabled }),
};
