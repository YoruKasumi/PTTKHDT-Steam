import http from './http';

export const profileApi = {
  layThongTinHoSo: () => http.get('/profile/layThongTinHoSo'),
  guiTenHienThiMoi: (displayName) => http.post('/profile/guiTenHienThiMoi', { displayName }),
  guiAnhDaiDien: (body) => http.post('/profile/guiAnhDaiDien', body),
  capNhatHoSo: (body) => http.post('/profile/capNhatHoSo', body),
  guiYeuCauThayDoiMatKhau: (body) => http.post('/profile/guiYeuCauThayDoiMatKhau', body),
  capNhatTrangThaiThongBao: (enabled) => http.post('/profile/capNhatTrangThaiThongBao', { enabled }),

  // Aliases for compatibility
  get: () => http.get('/profile/layThongTinHoSo'),
  updateDisplayName: (displayName) => http.post('/profile/guiTenHienThiMoi', { displayName }),
  update: (body) => http.post('/profile/capNhatHoSo', body),
  changePassword: (body) => http.post('/profile/guiYeuCauThayDoiMatKhau', body),
  updateNotifications: (enabled) => http.post('/profile/capNhatTrangThaiThongBao', { enabled }),
};
