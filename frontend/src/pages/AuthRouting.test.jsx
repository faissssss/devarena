import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { AuthProvider } from '../context/AuthContext';
import LoginPage from './LoginPage';
import RegisterPage from './RegisterPage';
import AuthCallbackPage from './AuthCallbackPage';
import { authApi, userApi } from '../services/api';

vi.mock('../services/api', () => ({
  authApi: {
    login: vi.fn(),
    register: vi.fn(),
    getOAuthUrl: vi.fn((provider, nextPath) => `/api/auth/oauth/${provider}?next=${encodeURIComponent(nextPath)}`),
  },
  userApi: {
    getMe: vi.fn(),
  },
  unwrapError: vi.fn((error, fallbackMessage) => error?.message || fallbackMessage),
}));

describe('auth routing flows', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  test('login redirects to query-string return path after success', async () => {
    authApi.login.mockResolvedValueOnce({
      token: 'login-token',
      user: { id: 'user-1', email: 'user@example.com', role: 'user' },
    });

    render(
      <MemoryRouter initialEntries={['/login?from=%2Fdashboard']}>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/dashboard" element={<div data-testid="dashboard-page">Dashboard</div>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('you@example.com'), {
      target: { value: 'user@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /^login$/i }));

    await waitFor(() => {
      expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
    });
  });

  test('register redirects to query-string return path after success', async () => {
    authApi.register.mockResolvedValueOnce({
      user: { id: 'user-2', email: 'new@example.com', role: 'user' },
    });
    authApi.login.mockResolvedValueOnce({
      token: 'register-token',
      user: { id: 'user-2', email: 'new@example.com', role: 'user' },
    });

    render(
      <MemoryRouter initialEntries={['/register?from=%2Fdashboard']}>
        <AuthProvider>
          <Routes>
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/dashboard" element={<div data-testid="dashboard-page">Dashboard</div>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('devuser'), {
      target: { value: 'newuser' },
    });
    fireEvent.change(screen.getByPlaceholderText('you@example.com'), {
      target: { value: 'new@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Min. 8 characters'), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
    });
  });

  test('oauth callback failure preserves return path when sending user back to login', async () => {
    userApi.getMe.mockRejectedValue(new Error('OAuth login failed'));

    function LoginProbe() {
      const location = useLocation();
      return <div data-testid="login-page">{location.search}</div>;
    }

    render(
      <MemoryRouter initialEntries={['/auth/callback?token=bad-token&next=%2Fdashboard']}>
        <AuthProvider>
          <Routes>
            <Route path="/auth/callback" element={<AuthCallbackPage />} />
            <Route path="/login" element={<LoginProbe />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(
      () => {
        expect(screen.getByTestId('login-page')).toBeInTheDocument();
      },
      { timeout: 2500 }
    );

    expect(screen.getByTestId('login-page')).toHaveTextContent('from=%2Fdashboard');
  });
});
