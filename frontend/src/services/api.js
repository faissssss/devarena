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

function ensureObjectResponse(data, fallbackMessage) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error(fallbackMessage);
  }

  return data;
}

function ensureCompetitionListResponse(data) {
  const parsed = ensureObjectResponse(data, 'Invalid competitions response from server');

  if (parsed.error?.message) {
    throw new Error(parsed.error.message);
  }

  if (!Array.isArray(parsed.competitions)) {
    throw new Error('Invalid competitions response from server');
  }

  return parsed;
}

function ensurePlatformsResponse(data) {
  const parsed = ensureObjectResponse(data, 'Invalid platforms response from server');

  if (parsed.error?.message) {
    throw new Error(parsed.error.message);
  }

  if (!Array.isArray(parsed.platforms)) {
    throw new Error('Invalid platforms response from server');
  }

  return parsed;
}

function ensureBookmarksResponse(data) {
  const parsed = ensureObjectResponse(data, 'Invalid bookmarks response from server');

  if (parsed.error?.message) {
    throw new Error(parsed.error.message);
  }

  if (!Array.isArray(parsed.bookmarks)) {
    throw new Error('Invalid bookmarks response from server');
  }

  return parsed;
}

export const authApi = {
  async login(payload) {
    const response = await api.post('/auth/login', payload);
    return ensureObjectResponse(response.data, 'Invalid login response from server');
  },
  async register(payload) {
    const response = await api.post('/auth/register', payload);
    return ensureObjectResponse(response.data, 'Invalid registration response from server');
  },
  getOAuthUrl(provider, nextPath = '/home') {
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
    return ensureCompetitionListResponse(response.data);
  },
  async getById(id) {
    const response = await api.get(`/competitions/${id}`);
    return ensureObjectResponse(response.data, 'Invalid competition detail response from server');
  },
  async getPlatforms() {
    const response = await api.get('/competitions/platforms');
    return ensurePlatformsResponse(response.data);
  },
};

export const bookmarkApi = {
  async list() {
    const response = await api.get('/bookmarks');
    return ensureBookmarksResponse(response.data);
  },
  async create(competitionId) {
    const response = await api.post('/bookmarks', { competition_id: competitionId });
    return ensureObjectResponse(response.data, 'Invalid bookmark response from server');
  },
  async remove(bookmarkId) {
    await api.delete(`/bookmarks/${bookmarkId}`);
  },
  async findByCompetition(competitionId) {
    const response = await api.get(`/bookmarks/competition/${competitionId}`);
    return ensureObjectResponse(response.data, 'Invalid bookmark lookup response from server');
  },
};

export const userApi = {
  async getMe() {
    const response = await api.get('/users/me');
    return ensureObjectResponse(response.data, 'Invalid user response from server');
  },
  async updateMe(payload) {
    const response = await api.put('/users/me', payload);
    return ensureObjectResponse(response.data, 'Invalid profile update response from server');
  },
};

export const adminApi = {
  async sync() {
    const response = await api.post('/admin/sync');
    return ensureObjectResponse(response.data, 'Invalid sync response from server');
  },
  async getSyncLogs(params) {
    const response = await api.get('/admin/sync-logs', { params });
    return ensureObjectResponse(response.data, 'Invalid sync logs response from server');
  },
  async getStats(params) {
    const response = await api.get('/admin/stats', { params });
    return ensureObjectResponse(response.data, 'Invalid admin stats response from server');
  },
  async updateCompetition(id, payload) {
    const response = await api.put(`/admin/competitions/${id}`, payload);
    return ensureObjectResponse(response.data, 'Invalid competition update response from server');
  },
  async deleteCompetition(id) {
    await api.delete(`/admin/competitions/${id}`);
  },
};

export { api, unwrapError };
