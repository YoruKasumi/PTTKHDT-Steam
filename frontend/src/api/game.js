import http from './http';

export const gameApi = {
  /**
   * Khởi tạo dự án game mới — multipart/form-data.
   * @param {FormData} formData
   */
  createProject: (formData) =>
    http.post('/games/createProject', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  /**
   * Upload patch mới — multipart/form-data.
   * @param {FormData} formData
   */
  uploadPatch: (formData) =>
    http.post('/games/uploadPatch', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  /**
   * Lấy danh sách phiên bản để rollback.
   * @param {string} gameId
   */
  listVersions: (gameId) => http.get(`/games/${gameId}/versions`),

  /**
   * Thực hiện rollback.
   * @param {string} gameId
   * @param {string} versionId
   */
  rollback: (gameId, versionId) => http.post(`/games/${gameId}/rollback`, { versionId }),
};
