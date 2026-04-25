import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('devarena_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('devarena_token');
      localStorage.removeItem('devarena_user');
    }

    return Promise.reject(error);
  }
);

function unwrapError(error, fallbackMessage) {
  return error.response?.data?.error?.message || error.message || fallbackMessage;
}

export const authApi = {
  async login(payload) {
    const response = await api.post('/auth/login', payload);
    return response.data;
  },
  async register(payload) {
    const response = await api.post('/auth/register', payload);
    return response.data;
  },
};

export const competitionApi = {
  async list(params) {
    const response = await api.get('/competitions', { params });
    return response.data;
  },
  async getById(id) {
    const response = await api.get(`/competitions/${id}`);
    return response.data;
  },
};

export const bookmarkApi = {
  async list() {
    const response = await api.get('/bookmarks');
    return response.data;
  },
  async create(competitionId) {
    const response = await api.post('/bookmarks', { competition_id: competitionId });
    return response.data;
  },
  async remove(bookmarkId) {
    await api.delete(`/bookmarks/${bookmarkId}`);
  },
  async findByCompetition(competitionId) {
    const response = await api.get(`/bookmarks/competition/${competitionId}`);
    return response.data;
  },
};

export const userApi = {
  async getMe() {
    const response = await api.get('/users/me');
    return response.data;
  },
  async updateMe(payload) {
    const response = await api.put('/users/me', payload);
    return response.data;
  },
};

export const adminApi = {
  async sync() {
    const response = await api.post('/admin/sync');
    return response.data;
  },
  async getSyncLogs(params) {
    const response = await api.get('/admin/sync-logs', { params });
    return response.data;
  },
  async getStats(params) {
    const response = await api.get('/admin/stats', { params });
    return response.data;
  },
  async updateCompetition(id, payload) {
    const response = await api.put(`/admin/competitions/${id}`, payload);
    return response.data;
  },
  async deleteCompetition(id) {
    await api.delete(`/admin/competitions/${id}`);
  },
};

export { api, unwrapError };
