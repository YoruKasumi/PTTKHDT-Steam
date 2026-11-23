import http from './http';

export const gameApi = {
  /**
   * Khởi tạo dự án game mới — multipart/form-data.
   * @param {FormData} formData
   */
  luuHoSoDuAnGame: (formData) =>
    http.post('/game/luuHoSoDuAnGame', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  /**
   * Upload patch mới — multipart/form-data.
   * @param {FormData} formData
   */
  guiGoiCapNhat: (formData) =>
    http.post('/game/guiGoiCapNhat', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  /**
   * Lấy danh sách phiên bản để rollback.
   * @param {string} gameId
   */
  layDanhSachPhienBan: (gameId) => http.get('/game/layDanhSachPhienBan', { params: { gameId } }),

  /**
   * Thực hiện rollback.
   * @param {string} gameId
   * @param {string} versionId
   */
  xacNhanKhoiPhucPhienBan: (gameId, versionId) =>
    http.post('/game/xacNhanKhoiPhucPhienBan', { gameId, versionId }),

  layDanhSachDuAnCuaToi: () => http.get('/game/layDanhSachDuAnCuaToi'),

  // Aliases for compatibility
  createProject: (formData) =>
    http.post('/game/luuHoSoDuAnGame', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  uploadPatch: (formData) =>
    http.post('/game/guiGoiCapNhat', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  listVersions: (gameId) => http.get('/game/layDanhSachPhienBan', { params: { gameId } }),

  rollback: (gameId, versionId) =>
    http.post('/game/xacNhanKhoiPhucPhienBan', { gameId, versionId }),

  listMyGames: () => http.get('/game/layDanhSachDuAnCuaToi'),
};
