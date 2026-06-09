import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || '/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 120000,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('ach_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('ach_token');
      localStorage.removeItem('ach_user');
      window.location.href = '/auth';
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  signup: d => api.post('/signup', d),
  login: d => api.post('/login', d),
  logout: () => api.post('/logout'),
  forgotPassword: e => api.post('/forgot-password', { email: e }),
  resetPassword: d => api.post('/reset-password', d),
  me: () => api.get('/auth/me'),
};

export const aiAPI = {
  explain: d => api.post('/ai/explain', d),
  debug: d => api.post('/ai/debug', d),
  optimize: d => api.post('/ai/optimize', d),
  generateDocs: d => api.post('/ai/generate_docs', d),
  convert: d => api.post('/ai/convert', d),
};

export const sessionAPI = {
  create: () => api.post('/sessions'),
  get: id => api.get(`/sessions/${id}`),
  update: (id, d) => api.put(`/sessions/${id}`, d),
  delete: id => api.delete(`/sessions/${id}`),
  history: params => api.get('/history', { params }),
};

export const userAPI = {
  getProfile: () => api.get('/profile'),
  updateProfile: d => api.put('/profile', d),
  changePassword: d => api.put('/profile/password', d),
  getSettings: () => api.get('/settings'),
  updateSettings: d => api.put('/settings', d),
  uploadFile: d => api.post('/upload', d),
  getAnalytics: () => api.get('/analytics'),
};

export default api;
