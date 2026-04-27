import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true, // Enable sending cookies
});

// Helper to get CSRF token from cookie
function getCsrfToken() {
  const match = document.cookie.match(/devarena_csrf=([^;]+)/);
  return match ? match[1] : null;
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('devarena_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Add CSRF token for non-GET requests
  if (config.method && !['get', 'head', 'options'].includes(config.method.toLowerCase())) {
    const csrfToken = getCsrfToken();
    if (csrfToken) {
      config.headers['X-CSRF-Token'] = csrfToken;
    }
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.log('[API] 401 Unauthorized - clearing auth and redirecting to login');
      localStorage.removeItem('devarena_token');
      localStorage.removeItem('devarena_user');
      
      // Only redirect if not already on login/register pages
      const currentPath = window.location.pathname;
      if (!currentPath.startsWith('/login') && !currentPath.startsWith('/register') && !currentPath.startsWith('/auth/callback')) {
        window.location.href = `/login?from=${encodeURIComponent(currentPath)}`;
      }
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
  getOAuthUrl(provider, nextPath = '/') {
    const params = new URLSearchParams({ next: nextPath });
    return `/api/auth/oauth/${provider}?${params.toString()}`;
  },
};

export const competitionApi = {
  async list(params) {
    // Convert date objects to ISO strings if present
    const queryParams = { ...params };
    if (queryParams.startDate instanceof Date) {
      queryParams.startDate = queryParams.startDate.toISOString().split('T')[0];
    }
    if (queryParams.endDate instanceof Date) {
      queryParams.endDate = queryParams.endDate.toISOString().split('T')[0];
    }
    if (queryParams.singleDate instanceof Date) {
      queryParams.singleDate = queryParams.singleDate.toISOString().split('T')[0];
    }
    // Convert platforms array to comma-separated string
    if (Array.isArray(queryParams.platforms) && queryParams.platforms.length > 0) {
      queryParams.platforms = queryParams.platforms.join(',');
    } else if (Array.isArray(queryParams.platforms)) {
      delete queryParams.platforms;
    }
    
    const response = await api.get('/competitions', { params: queryParams });
    return response.data;
  },
  async getById(id) {
    const response = await api.get(`/competitions/${id}`);
    return response.data;
  },
  async getPlatforms() {
    const response = await api.get('/competitions/platforms');
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
