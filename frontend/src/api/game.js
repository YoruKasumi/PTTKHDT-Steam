import http from './http';

export const gameApi = {
  /**
   * Khởi tạo dự án game mới — multipart/form-data.
   * @param {FormData} formData
   */
  createProject: (formData) =>
    http.post('/game/createProject', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  /**
   * Upload patch mới — multipart/form-data.
   * @param {FormData} formData
   */
  uploadPatch: (formData) =>
    http.post('/game/uploadPatch', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  /**
   * Lấy danh sách phiên bản để rollback.
   * @param {string} gameId
   */
  listVersions: (gameId) => http.get(`/game/${gameId}/versions`),

  /**
   * Thực hiện rollback.
   * @param {string} gameId
   * @param {string} versionId
   */
  rollback: (gameId, versionId) => http.post(`/game/${gameId}/rollback`, { versionId }),
};
