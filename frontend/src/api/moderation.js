import http from './http';

export const moderationApi = {
  listPendingGames: (params) => http.get('/moderation/games', { params }),
  getGameProfile: (gameId) => http.get(`/moderation/games/${encodeURIComponent(gameId)}`),
  reviewGame: (gameId, decision, reason) => (
    http.post(`/moderation/games/${encodeURIComponent(gameId)}/review`, { decision, reason })
  ),
};
