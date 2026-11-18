import http from './http';

// Tên hàm khớp sơ đồ sequence UC1, UC2, UC3; đường dẫn khớp backend: /api/auth/<tenHam>.
export const authApi = {
  guiThongTinDangKy: (body) => http.post('/auth/guiThongTinDangKy', body),
  guiThongTinDangNhap: (body) => http.post('/auth/guiThongTinDangNhap', body),
  guiYeuCauDangXuat: () => http.post('/auth/guiYeuCauDangXuat'),
};
