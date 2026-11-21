import http from './http';

export const notificationApi = {
  list: () => http.get('/notifications'),
  markRead: (id) => http.patch(`/notifications/${encodeURIComponent(id)}/read`),
  markAllRead: () => http.patch('/notifications/read-all'),
};