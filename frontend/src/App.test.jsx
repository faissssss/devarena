import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import App from './App';
import {
  adminApi,
  authApi,
  bookmarkApi,
  competitionApi,
  unwrapError,
  userApi,
} from './services/api';

vi.mock('./services/api', () => ({
  authApi: {
    login: vi.fn(),
    register: vi.fn(),
  },
  competitionApi: {
    list: vi.fn(),
    getById: vi.fn(),
  },
  bookmarkApi: {
    list: vi.fn(),
    create: vi.fn(),
    remove: vi.fn(),
    findByCompetition: vi.fn(),
  },
  userApi: {
    getMe: vi.fn(),
    updateMe: vi.fn(),
  },
  adminApi: {
    sync: vi.fn(),
    getSyncLogs: vi.fn(),
    getStats: vi.fn(),
    updateCompetition: vi.fn(),
    deleteCompetition: vi.fn(),
  },
  unwrapError: vi.fn((error, fallbackMessage) => error?.message || fallbackMessage),
}));

function setSession(user, overrides = {}) {
  const payload = {
    userId: user.id,
    role: user.role,
    exp: Math.floor(Date.now() / 1000) + 3600,
    ...overrides,
  };
  const encodedPayload = btoa(JSON.stringify(payload));
  const token = `header.${encodedPayload}.signature`;

  localStorage.setItem('devarena_token', token);
  localStorage.setItem('devarena_user', JSON.stringify(user));
}

function renderAt(pathname) {
  window.history.pushState({}, '', pathname);
  return render(<App />);
}

const competition = {
  id: 'comp-1',
  title: 'Kaggle Vision Challenge',
  description: 'Build something sharp with satellite imagery.',
  category: 'AI/Data Science',
  platform: 'Kaggle',
  url: 'https://example.com/challenge',
  start_date: '2026-05-01T00:00:00.000Z',
  end_date: '2026-05-10T00:00:00.000Z',
  status: 'upcoming',
  location: 'Online',
  source: 'kaggle',
};

describe('App', () => {
  beforeEach(() => {
    localStorage.clear();
    window.history.pushState({}, '', '/');
    vi.clearAllMocks();

    bookmarkApi.list.mockResolvedValue({ bookmarks: [] });
    bookmarkApi.findByCompetition.mockResolvedValue({ bookmark: null });
    bookmarkApi.create.mockResolvedValue({ bookmark: { id: 'bookmark-1' } });
    bookmarkApi.remove.mockResolvedValue({});
    competitionApi.list.mockResolvedValue({
      competitions: [competition],
      totalPages: 1,
      page: 1,
    });
    competitionApi.getById.mockResolvedValue({ competition });
    userApi.getMe.mockResolvedValue({
      user: {
        id: 'user-1',
        username: 'devuser',
        email: 'dev@example.com',
        role: 'user',
        created_at: '2026-04-25T00:00:00.000Z',
      },
      stats: { bookmarkCount: 1 },
    });
    userApi.updateMe.mockResolvedValue({
      user: {
        id: 'user-1',
        username: 'updated-user',
        email: 'updated@example.com',
        role: 'user',
        created_at: '2026-04-25T00:00:00.000Z',
      },
    });
    adminApi.getStats.mockResolvedValue({
      stats: {
        userCount: 2,
        competitionCount: 1,
        bookmarkCount: 1,
      },
      competitions: { competitions: [competition] },
    });
    adminApi.getSyncLogs.mockResolvedValue({
      logs: [
        {
          id: 'log-1',
          source: 'kaggle',
          status: 'success',
          record_count: 1,
          synced_at: '2026-04-25T00:00:00.000Z',
        },
      ],
    });
    adminApi.sync.mockResolvedValue({ totalProcessed: 1 });
    adminApi.updateCompetition.mockResolvedValue({
      competition: { ...competition, title: 'Edited title' },
    });
    adminApi.deleteCompetition.mockResolvedValue({});
  });

  test('renders the landing page by default', async () => {
    renderAt('/');

    expect(
      await screen.findByRole('heading', {
        name: /a calmer way to hunt for your next big build/i,
      })
    ).toBeInTheDocument();
  });

  test('redirects unauthenticated users away from protected routes', async () => {
    renderAt('/dashboard');

    expect(await screen.findByRole('heading', { name: 'Login' })).toBeInTheDocument();
  });

  test('submits login and redirects to the dashboard', async () => {
    authApi.login.mockResolvedValue({
      token: 'header.eyJleHAiOjQ3MDAwMDAwMDAsInJvbGUiOiJ1c2VyIn0=.signature',
      user: {
        id: 'user-1',
        username: 'devuser',
        email: 'dev@example.com',
        role: 'user',
        created_at: '2026-04-25T00:00:00.000Z',
      },
    });

    renderAt('/login');
    fireEvent.change(screen.getByPlaceholderText('Email'), {
      target: { value: 'dev@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'super-secret-password' },
    });
    fireEvent.click(screen.getByRole('button', { name: /^login$/i }));

    expect(await screen.findByText(/your active watchlist/i)).toBeInTheDocument();
    expect(authApi.login).toHaveBeenCalledWith({
      email: 'dev@example.com',
      password: 'super-secret-password',
    });
  });

  test('registers and logs in a new user', async () => {
    authApi.register.mockResolvedValue({
      user: { id: 'user-2', username: 'newbie', email: 'newbie@example.com' },
    });
    authApi.login.mockResolvedValue({
      token: 'header.eyJleHAiOjQ3MDAwMDAwMDAsInJvbGUiOiJ1c2VyIn0=.signature',
      user: {
        id: 'user-2',
        username: 'newbie',
        email: 'newbie@example.com',
        role: 'user',
        created_at: '2026-04-25T00:00:00.000Z',
      },
    });

    renderAt('/register');
    fireEvent.change(screen.getByPlaceholderText('Username'), {
      target: { value: 'newbie' },
    });
    fireEvent.change(screen.getByPlaceholderText('Email'), {
      target: { value: 'newbie@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'super-secret-password' },
    });
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    expect(await screen.findByText(/your active watchlist/i)).toBeInTheDocument();
    expect(authApi.register).toHaveBeenCalled();
    expect(authApi.login).toHaveBeenCalledWith({
      email: 'newbie@example.com',
      password: 'super-secret-password',
    });
  });

  test('loads explore results and redirects unauthenticated bookmark attempts to login', async () => {
    renderAt('/explore');

    expect(await screen.findByText('Kaggle Vision Challenge')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /^save$/i }));

    expect(await screen.findByRole('heading', { name: 'Login' })).toBeInTheDocument();
  });

  test('loads competition detail and toggles bookmark for authenticated users', async () => {
    setSession({
      id: 'user-1',
      username: 'devuser',
      email: 'dev@example.com',
      role: 'user',
      created_at: '2026-04-25T00:00:00.000Z',
    });

    renderAt('/competitions/comp-1');

    expect(await screen.findByRole('heading', { name: 'Kaggle Vision Challenge' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /save bookmark/i }));

    await waitFor(() => {
      expect(bookmarkApi.create).toHaveBeenCalledWith('comp-1');
    });
    expect(await screen.findByRole('button', { name: /remove bookmark/i })).toBeInTheDocument();
  });

  test('filters and removes bookmarks from the dashboard', async () => {
    setSession({
      id: 'user-1',
      username: 'devuser',
      email: 'dev@example.com',
      role: 'user',
      created_at: '2026-04-25T00:00:00.000Z',
    });
    bookmarkApi.list.mockResolvedValue({
      bookmarks: [
        {
          id: 'bookmark-1',
          competition_id: 'comp-1',
          competition,
        },
      ],
    });

    renderAt('/dashboard');

    expect(await screen.findByText('Kaggle Vision Challenge')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /upcoming/i }));
    fireEvent.click(screen.getByRole('button', { name: /saved/i }));

    await waitFor(() => {
      expect(bookmarkApi.remove).toHaveBeenCalledWith('bookmark-1');
    });
    expect(await screen.findByText(/no bookmarks yet/i)).toBeInTheDocument();
  });

  test('loads admin tools, triggers sync, edits, and deletes competitions for admins', async () => {
    setSession({
      id: 'admin-1',
      username: 'arenaadmin',
      email: 'admin@example.com',
      role: 'admin',
      created_at: '2026-04-25T00:00:00.000Z',
    });

    const promptSpy = vi.spyOn(window, 'prompt').mockReturnValue('Edited title');
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    renderAt('/admin');

    expect(await screen.findByText(/platform controls/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /run manual sync/i }));
    expect(await screen.findByText(/sync finished\. processed 1 competitions\./i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /edit/i }));
    await waitFor(() => {
      expect(adminApi.updateCompetition).toHaveBeenCalledWith('comp-1', {
        title: 'Edited title',
      });
    });

    fireEvent.click(screen.getByRole('button', { name: /delete/i }));
    await waitFor(() => {
      expect(adminApi.deleteCompetition).toHaveBeenCalledWith('comp-1');
    });

    promptSpy.mockRestore();
    confirmSpy.mockRestore();
  });

  test('loads and updates profile details for authenticated users', async () => {
    setSession({
      id: 'user-1',
      username: 'devuser',
      email: 'dev@example.com',
      role: 'user',
      created_at: '2026-04-25T00:00:00.000Z',
    });

    renderAt('/profile');

    expect(await screen.findByText(/account details and control/i)).toBeInTheDocument();
    const usernameInput = screen.getByLabelText('Profile username');
    const emailInput = screen.getByLabelText('Profile email');

    fireEvent.change(usernameInput, { target: { value: 'updated-user' } });
    fireEvent.change(emailInput, { target: { value: 'updated@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /save profile/i }));

    await waitFor(() => {
      expect(userApi.updateMe).toHaveBeenCalledWith({
        username: 'updated-user',
        email: 'updated@example.com',
      });
    });

    fireEvent.change(screen.getByPlaceholderText('Current password'), {
      target: { value: 'old-password' },
    });
    fireEvent.change(screen.getByPlaceholderText('New password'), {
      target: { value: 'new-password-123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /update password/i }));

    await waitFor(() => {
      expect(userApi.updateMe).toHaveBeenCalledWith({
        currentPassword: 'old-password',
        newPassword: 'new-password-123',
      });
    });
    expect(screen.getByText(/password updated\./i)).toBeInTheDocument();
  });

  test('uses unwrapError on failed login attempts', async () => {
    authApi.login.mockRejectedValue(new Error('Bad login'));

    renderAt('/login');
    fireEvent.change(screen.getByPlaceholderText('Email'), {
      target: { value: 'dev@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'wrong-password' },
    });
    fireEvent.click(screen.getByRole('button', { name: /^login$/i }));

    expect(await screen.findByText('Bad login')).toBeInTheDocument();
    expect(unwrapError).toHaveBeenCalled();
  });
});
