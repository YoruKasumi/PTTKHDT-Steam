import http from './http';

export const libraryApi = {
  list: () => http.get('/library'),
};
