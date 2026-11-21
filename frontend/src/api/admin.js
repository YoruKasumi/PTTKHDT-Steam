import http from './http';

export const adminApi = {
  listRoles: () => http.get('/admin/roles'),
  listPermissions: () => http.get('/admin/permissions'),
  createRole: (body) => http.post('/admin/roles', body),
  updateRole: (roleId, body) => http.put(`/admin/roles/${roleId}`, body),
  deleteRole: (roleId) => http.delete(`/admin/roles/${roleId}`),
  updateRolePermissions: (roleId, permissions) => (
    http.put(`/admin/roles/${roleId}/permissions`, { permissions })
  ),

  listAccounts: (params) => http.get('/admin/accounts', { params }),
  getAccountHistory: (accountId) => http.get(`/admin/accounts/${accountId}/history`),
  setAccountStatus: (accountId, status, reason) => {
    const operation = { Active: 'unban', Suspended: 'suspend', Banned: 'ban' }[status];
    return http.patch(`/admin/accounts/${accountId}/${operation}`, { reason });
  },
  changeAccountStatus: (accountId, status, reason) => {
    const operation = { Active: 'unban', Suspended: 'suspend', Banned: 'ban' }[status];
    return http.patch(`/admin/accounts/${accountId}/${operation}`, { reason });
  },

  listStaff: () => http.get('/admin/staff'),
  createStaff: (body) => http.post('/admin/staff', body),
  updateStaff: (accountId, body) => http.put(`/admin/staff/${accountId}`, body),
  setStaffStatus: (accountId, status) => (
    http.patch(`/admin/staff/${accountId}/status`, { status })
  ),
  changeStaffStatus: (accountId, status) => (
    http.patch(`/admin/staff/${accountId}/status`, { status })
  ),

  listReviews: () => http.get('/moderation/reviews'),
  moderateReview: (reviewId, status, reason) => (
    http.patch(`/moderation/reviews/${reviewId}/status`, { status, reason })
  ),

  listPendingGames: () => http.get('/moderation/games'),
  getGameDetail: (gameId) => http.get(`/moderation/games/${encodeURIComponent(gameId)}`),
  reviewGame: (gameId, decision, reason) =>
    http.post(`/moderation/games/${encodeURIComponent(gameId)}/review`, { decision, reason }),

  listGenres: () => http.get('/genres'),
  createGenre: (body) => http.post('/admin/genres', body),
  updateGenre: (genreId, body) => http.put(`/admin/genres/${genreId}`, body),
  deleteGenre: (genreId) => http.delete(`/admin/genres/${genreId}`),

  listBanners: () => http.get('/admin/banners'),
  createBanner: (body) => http.post('/admin/banners', body),
  updateBanner: (bannerId, body) => http.put(`/admin/banners/${bannerId}`, body),
  deleteBanner: (bannerId) => http.delete(`/admin/banners/${bannerId}`),

  getSystemConfig: () => http.get('/admin/system-config'),
  updateSystemConfig: (parameters) => http.put('/admin/system-config', { parameters }),
  listAuditLogs: (params) => http.get('/admin/audit-logs', { params }),
  getAuditLogDetail: (logId) => http.get(`/admin/audit-logs/${encodeURIComponent(logId)}`),
};
