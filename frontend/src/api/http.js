import axios from 'axios';

const http = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api' });

http.interceptors.request.use((config) => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Backend trả { success, message, data } hoặc { success: false, code, message, details? }.
http.interceptors.response.use(
  (res) => res.data.data,
  (err) => {
    const apiError = new Error(err.response?.data?.message || err.message);
    apiError.code = err.response?.data?.code;
    apiError.details = err.response?.data?.details;
    apiError.status = err.response?.status;
    return Promise.reject(apiError);
  },
);

export default http;
