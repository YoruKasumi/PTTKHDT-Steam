import http from './http';

export const moderationApi = {
  yeuCauLayHoSoGameChoDuyet: (params) => http.get('/moderation/yeuCauLayHoSoGameChoDuyet', { params }),
  layChiTietHoSoGame: (gameId) => http.post('/moderation/layChiTietHoSoGame', { gameId }),
  pheDuyetHoacTuChoiGame: (gameId, decision, reason) =>
    http.post('/moderation/pheDuyetHoacTuChoiGame', { gameId, decision, reason }),

  // Aliases for compatibility
  listPendingGames: (params) => http.get('/moderation/yeuCauLayHoSoGameChoDuyet', { params }),
  getGameProfile: (gameId) => http.post('/moderation/layChiTietHoSoGame', { gameId }),
  reviewGame: (gameId, decision, reason) =>
    http.post('/moderation/pheDuyetHoacTuChoiGame', { gameId, decision, reason }),
};
