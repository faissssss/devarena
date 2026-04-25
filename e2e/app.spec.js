import { expect, test } from '@playwright/test';

function createJwt(payload) {
  const encode = (value) =>
    Buffer.from(JSON.stringify(value))
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/g, '');

  return `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode(payload)}.signature`;
}

async function mockApi(page, options = {}) {
  const state = {
    users: options.users ?? [],
    competitions:
      options.competitions ??
      [
        {
          id: 'comp-1',
          title: 'Kaggle Vision Challenge',
          description: 'Build a computer vision model for satellite imagery.',
          category: 'AI/Data Science',
          platform: 'Kaggle',
          url: 'https://example.com/kaggle-vision',
          start_date: '2026-05-01T00:00:00.000Z',
          end_date: '2026-05-10T00:00:00.000Z',
          status: 'upcoming',
          location: 'Online',
          prize: '$10,000',
          difficulty: 'Advanced',
          source: 'kaggle',
        },
        {
          id: 'comp-2',
          title: 'Codeforces Round',
          description: 'Algorithmic contest for competitive programmers.',
          category: 'Competitive Programming',
          platform: 'CodeForces',
          url: 'https://example.com/codeforces-round',
          start_date: '2026-05-03T00:00:00.000Z',
          end_date: '2026-05-03T03:00:00.000Z',
          status: 'upcoming',
          location: 'Online',
          prize: null,
          difficulty: 'Intermediate',
          source: 'kontests',
        },
      ],
    bookmarks: options.bookmarks ?? [],
    syncLogs: options.syncLogs ?? [],
  };

  let bookmarkIdCounter = state.bookmarks.length + 1;

  await page.route('**/api/**', async (route) => {
    const request = route.request();
    const method = request.method();
    const url = new URL(request.url());
    const path = url.pathname;
    const authHeader = request.headers().authorization;
    const isAuthed = Boolean(authHeader);
    const activeUser =
      state.users.find((user) =>
        authHeader?.includes(user.role === 'admin' ? 'admin-token' : 'user-token')
      ) ?? null;

    const json = (status, body) =>
      route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify(body),
      });

    if (path === '/api/auth/register' && method === 'POST') {
      const payload = request.postDataJSON();
      const user = {
        id: `user-${state.users.length + 1}`,
        username: payload.username,
        email: payload.email,
        role: 'user',
        created_at: '2026-04-25T00:00:00.000Z',
        password: payload.password,
      };
      state.users.push(user);
      return json(201, { user });
    }

    if (path === '/api/auth/login' && method === 'POST') {
      const payload = request.postDataJSON();
      const user = state.users.find(
        (entry) => entry.email === payload.email && entry.password === payload.password
      );
      if (!user) {
        return json(401, {
          error: { code: 'INVALID_CREDENTIALS', message: 'Invalid credentials' },
        });
      }

      const tokenName = user.role === 'admin' ? 'admin-token' : 'user-token';
      const token = createJwt({
        userId: user.id,
        role: user.role,
        exp: Math.floor(Date.now() / 1000) + 3600,
        tokenName,
      });
      return json(200, {
        token: `${token}.${tokenName}`,
        user,
      });
    }

    if (path === '/api/competitions' && method === 'GET') {
      let competitions = [...state.competitions];
      const search = url.searchParams.get('search');
      const category = url.searchParams.get('category');
      const status = url.searchParams.get('status');

      if (search) {
        competitions = competitions.filter(
          (item) =>
            item.title.toLowerCase().includes(search.toLowerCase()) ||
            item.description.toLowerCase().includes(search.toLowerCase())
        );
      }
      if (category) {
        competitions = competitions.filter((item) => item.category === category);
      }
      if (status) {
        competitions = competitions.filter((item) => item.status === status);
      }

      return json(200, {
        competitions,
        totalCount: competitions.length,
        totalPages: 1,
        page: 1,
        limit: 9,
      });
    }

    if (path.startsWith('/api/competitions/') && method === 'GET') {
      const competitionId = path.split('/').pop();
      const competition = state.competitions.find((item) => item.id === competitionId);
      if (!competition) {
        return json(404, { error: { code: 'NOT_FOUND', message: 'Competition not found' } });
      }
      return json(200, { competition });
    }

    if (path === '/api/bookmarks' && method === 'GET') {
      if (!isAuthed || !activeUser) {
        return json(401, { error: { message: 'Unauthorized' } });
      }

      const bookmarks = state.bookmarks
        .filter((bookmark) => bookmark.user_id === activeUser.id)
        .map((bookmark) => ({
          ...bookmark,
          competition: state.competitions.find(
            (competition) => competition.id === bookmark.competition_id
          ),
        }));
      return json(200, { bookmarks });
    }

    if (path === '/api/bookmarks' && method === 'POST') {
      if (!isAuthed || !activeUser) {
        return json(401, { error: { message: 'Unauthorized' } });
      }

      const payload = request.postDataJSON();
      const existing = state.bookmarks.find(
        (bookmark) =>
          bookmark.user_id === activeUser.id &&
          bookmark.competition_id === payload.competition_id
      );
      if (existing) {
        return json(409, { error: { message: 'Bookmark already exists' } });
      }

      const bookmark = {
        id: `bookmark-${bookmarkIdCounter++}`,
        user_id: activeUser.id,
        competition_id: payload.competition_id,
        created_at: '2026-04-25T00:00:00.000Z',
      };
      state.bookmarks.push(bookmark);
      return json(201, { bookmark });
    }

    if (path.startsWith('/api/bookmarks/competition/') && method === 'GET') {
      if (!isAuthed || !activeUser) {
        return json(401, { error: { message: 'Unauthorized' } });
      }

      const competitionId = path.split('/').pop();
      const bookmark = state.bookmarks.find(
        (item) =>
          item.user_id === activeUser.id && item.competition_id === competitionId
      );
      return json(200, { bookmark: bookmark ?? null });
    }

    if (path.startsWith('/api/bookmarks/') && method === 'DELETE') {
      if (!isAuthed || !activeUser) {
        return json(401, { error: { message: 'Unauthorized' } });
      }

      const bookmarkId = path.split('/').pop();
      state.bookmarks = state.bookmarks.filter(
        (bookmark) => !(bookmark.id === bookmarkId && bookmark.user_id === activeUser.id)
      );
      return route.fulfill({ status: 204, body: '' });
    }

    if (path === '/api/users/me' && method === 'GET') {
      if (!isAuthed || !activeUser) {
        return json(401, { error: { message: 'Unauthorized' } });
      }

      return json(200, {
        user: activeUser,
        stats: {
          bookmarkCount: state.bookmarks.filter((bookmark) => bookmark.user_id === activeUser.id)
            .length,
        },
      });
    }

    if (path === '/api/users/me' && method === 'PUT') {
      if (!isAuthed || !activeUser) {
        return json(401, { error: { message: 'Unauthorized' } });
      }

      const payload = request.postDataJSON();
      Object.assign(activeUser, {
        username: payload.username ?? activeUser.username,
        email: payload.email ?? activeUser.email,
      });
      return json(200, { user: activeUser });
    }

    if (path === '/api/admin/sync' && method === 'POST') {
      if (!isAuthed || activeUser?.role !== 'admin') {
        return json(403, { error: { message: 'Admin access required' } });
      }

      state.syncLogs.unshift({
        id: `log-${state.syncLogs.length + 1}`,
        source: 'kontests',
        status: 'success',
        record_count: state.competitions.length,
        synced_at: '2026-04-25T00:00:00.000Z',
      });
      return json(200, {
        results: [],
        successCount: 3,
        failureCount: 0,
        totalProcessed: state.competitions.length,
      });
    }

    if (path === '/api/admin/sync-logs' && method === 'GET') {
      if (!isAuthed || activeUser?.role !== 'admin') {
        return json(403, { error: { message: 'Admin access required' } });
      }
      return json(200, {
        logs: state.syncLogs,
        totalCount: state.syncLogs.length,
        totalPages: 1,
        page: 1,
        limit: 20,
      });
    }

    if (path === '/api/admin/stats' && method === 'GET') {
      if (!isAuthed || activeUser?.role !== 'admin') {
        return json(403, { error: { message: 'Admin access required' } });
      }
      return json(200, {
        stats: {
          userCount: state.users.length,
          competitionCount: state.competitions.length,
          bookmarkCount: state.bookmarks.length,
        },
        competitions: {
          competitions: state.competitions,
          totalCount: state.competitions.length,
          totalPages: 1,
          page: 1,
          limit: 10,
        },
      });
    }

    if (path.startsWith('/api/admin/competitions/') && method === 'PUT') {
      if (!isAuthed || activeUser?.role !== 'admin') {
        return json(403, { error: { message: 'Admin access required' } });
      }
      const competitionId = path.split('/').pop();
      const payload = request.postDataJSON();
      const competition = state.competitions.find((item) => item.id === competitionId);
      Object.assign(competition, payload);
      return json(200, { competition });
    }

    if (path.startsWith('/api/admin/competitions/') && method === 'DELETE') {
      if (!isAuthed || activeUser?.role !== 'admin') {
        return json(403, { error: { message: 'Admin access required' } });
      }
      const competitionId = path.split('/').pop();
      state.competitions = state.competitions.filter((item) => item.id !== competitionId);
      return route.fulfill({ status: 204, body: '' });
    }

    return json(404, { error: { message: `Unhandled route: ${method} ${path}` } });
  });

  return state;
}

test('25.2 user registration and login flow', async ({ page }) => {
  await mockApi(page, { users: [] });

  await page.goto('/');
  await page.getByRole('link', { name: /create account/i }).click();

  await page.getByPlaceholder('Username').fill('devuser');
  await page.getByPlaceholder('Email').fill('devuser@example.com');
  await page.getByPlaceholder('Password').fill('super-secret-password');
  await page.getByRole('button', { name: /create account/i }).click();

  await expect(page).toHaveURL(/\/dashboard$/);

  await page.getByRole('button', { name: /logout/i }).click();
  await expect(page).toHaveURL(/\/login$/);

  await page.getByPlaceholder('Email').fill('devuser@example.com');
  await page.getByPlaceholder('Password').fill('super-secret-password');
  await page.getByRole('button', { name: /^login$/i }).click();

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByText(/your active watchlist/i)).toBeVisible();
});

test('25.3 competition discovery flow', async ({ page }) => {
  await mockApi(page);

  await page.goto('/explore');
  await page.getByPlaceholder(/search titles or descriptions/i).fill('vision');
  await page.selectOption('select', 'AI/Data Science');

  await expect(page.getByText('Kaggle Vision Challenge')).toBeVisible();
  await page.getByRole('link', { name: /view details/i }).first().click();

  await expect(page).toHaveURL(/\/competitions\/comp-1$/);
  await expect(page.getByRole('heading', { name: 'Kaggle Vision Challenge' })).toBeVisible();
});

test('25.4 bookmark management flow', async ({ page }) => {
  await mockApi(page, {
    users: [
      {
        id: 'user-1',
        username: 'devuser',
        email: 'devuser@example.com',
        role: 'user',
        created_at: '2026-04-25T00:00:00.000Z',
        password: 'super-secret-password',
      },
    ],
  });

  await page.goto('/login');
  await page.getByPlaceholder('Email').fill('devuser@example.com');
  await page.getByPlaceholder('Password').fill('super-secret-password');
  await page.getByRole('button', { name: /^login$/i }).click();

  await page.goto('/competitions/comp-1');
  await page.getByRole('button', { name: /save bookmark/i }).click();
  await expect(page.getByRole('button', { name: /remove bookmark/i })).toBeVisible({
    timeout: 10000,
  });

  await page.goto('/dashboard');
  await expect(page.getByText('Kaggle Vision Challenge')).toBeVisible();
  await page.getByRole('button', { name: /saved/i }).click();

  await expect(page.getByText(/no bookmarks yet/i)).toBeVisible();
});

test('25.5 admin workflow', async ({ page }) => {
  await mockApi(page, {
    users: [
      {
        id: 'admin-1',
        username: 'arenaadmin',
        email: 'admin@example.com',
        role: 'admin',
        created_at: '2026-04-25T00:00:00.000Z',
        password: 'super-secret-password',
      },
    ],
    syncLogs: [],
  });

  await page.goto('/login');
  await page.getByPlaceholder('Email').fill('admin@example.com');
  await page.getByPlaceholder('Password').fill('super-secret-password');
  await page.getByRole('button', { name: /^login$/i }).click();

  await page.goto('/admin');
  await expect(page.getByRole('button', { name: /run manual sync/i })).toBeVisible({
    timeout: 10000,
  });
  await page.getByRole('button', { name: /run manual sync/i }).click();
  await expect(page.getByText(/sync finished/i)).toBeVisible();

  page.once('dialog', (dialog) => dialog.accept('Updated Admin Title'));
  await page.getByRole('button', { name: /edit/i }).first().click();
  await expect(page.getByText('Updated Admin Title')).toBeVisible();

  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: /delete/i }).first().click();
  await expect(page.getByText('Updated Admin Title')).toHaveCount(0);
});
