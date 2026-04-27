/**
 * Bug Condition Exploration Test for OAuth Redirect Fix
 * 
 * **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
 * **DO NOT attempt to fix the test or the code when it fails**
 * **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
 * 
 * **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.8, 2.9, 2.10, 2.11, 2.12, 2.13**
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import AuthCallbackPage from './AuthCallbackPage';
import LoginPage from './LoginPage';
import RegisterPage from './RegisterPage';
import { AuthProvider } from '../context/AuthContext';
import { authApi, userApi } from '../services/api';

// Mock the API
vi.mock('../services/api', () => ({
  authApi: {
    login: vi.fn(),
    register: vi.fn(),
    getOAuthUrl: vi.fn((provider, nextPath) => `/api/auth/oauth/${provider}?next=${nextPath}`),
  },
  userApi: {
    getMe: vi.fn(),
  },
  unwrapError: vi.fn((error, fallbackMessage) => error?.message || fallbackMessage),
}));

describe('Bug Condition Exploration - OAuth Redirect Fix', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  /**
   * Property 1: Bug Condition - OAuth Redirect Success
   * 
   * **Validates: Requirements 2.1, 2.2, 2.3, 2.4**
   * 
   * For any OAuth callback where a valid token is received and completeOAuthLogin succeeds,
   * the system SHALL immediately navigate to the homepage (or specified next path).
   * 
   * **EXPECTED OUTCOME ON UNFIXED CODE**: Test FAILS
   * - navigate() may be called but navigation doesn't occur due to React timing issues
   * - The `active` flag in useEffect cleanup may prevent navigation
   * - Navigation may be called during an unstable render cycle
   */
  test('Property 1: OAuth callback with valid token should navigate to homepage', async () => {
    // Setup: Mock successful user fetch
    const mockUser = {
      id: 'user-1',
      username: 'testuser',
      email: 'test@example.com',
      role: 'user',
    };
    userApi.getMe.mockResolvedValue({ user: mockUser });

    // Simulate OAuth callback with valid token
    const validToken = 'valid-oauth-token-123';
    const initialUrl = `/auth/callback?token=${validToken}&next=/dashboard`;

    render(
      <MemoryRouter initialEntries={[initialUrl]}>
        <AuthProvider>
          <Routes>
            <Route path="/auth/callback" element={<AuthCallbackPage />} />
            <Route path="/dashboard" element={<div data-testid="dashboard-page">Dashboard Page</div>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    // Wait for OAuth completion
    await waitFor(
      () => {
        expect(userApi.getMe).toHaveBeenCalled();
      },
      { timeout: 3000 }
    );

    // CRITICAL ASSERTION: User should actually see the dashboard page
    // This will FAIL on unfixed code if navigation doesn't happen
    await waitFor(
      () => {
        expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    // Verify token was stored
    expect(localStorage.getItem('devarena_token')).toBe(validToken);
    expect(localStorage.getItem('devarena_user')).toBe(JSON.stringify(mockUser));
  });

  /**
   * Property 1 (continued): OAuth callback without next parameter should default to homepage
   * 
   * **Validates: Requirements 2.4**
   */
  test('Property 1: OAuth callback without next parameter should navigate to default /dashboard', async () => {
    const mockUser = {
      id: 'user-2',
      username: 'testuser2',
      email: 'test2@example.com',
      role: 'user',
    };
    userApi.getMe.mockResolvedValue({ user: mockUser });

    const validToken = 'valid-oauth-token-456';
    const initialUrl = `/auth/callback?token=${validToken}`;

    render(
      <MemoryRouter initialEntries={[initialUrl]}>
        <AuthProvider>
          <Routes>
            <Route path="/auth/callback" element={<AuthCallbackPage />} />
            <Route path="/dashboard" element={<div data-testid="dashboard-page">Dashboard Page</div>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(
      () => {
        expect(userApi.getMe).toHaveBeenCalled();
      },
      { timeout: 3000 }
    );

    // Should navigate to default /dashboard and user should see the page
    await waitFor(
      () => {
        expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  /**
   * Property 2: Bug Condition - Network Error Handling
   * 
   * **Validates: Requirements 2.8, 2.9, 2.10, 2.11**
   * 
   * For any authentication request where a network error occurs,
   * the system SHALL display a clear, user-friendly error message.
   * 
   * **EXPECTED OUTCOME ON UNFIXED CODE**: Test FAILS
   * - Network errors may show generic "OAuth login failed" message
   * - No specific detection of network vs other errors
   * - Error messages are not user-friendly or actionable
   */
  test('Property 2: Network error during OAuth should display user-friendly error message', async () => {
    // Simulate network error - axios network errors typically don't have "network" in the message
    const networkError = new Error('Request failed');
    networkError.code = 'ERR_NETWORK';
    userApi.getMe.mockRejectedValue(networkError);

    const validToken = 'valid-token-but-network-fails';
    const initialUrl = `/auth/callback?token=${validToken}`;

    render(
      <MemoryRouter initialEntries={[initialUrl]}>
        <AuthProvider>
          <Routes>
            <Route path="/auth/callback" element={<AuthCallbackPage />} />
            <Route path="/login" element={<div data-testid="login-page">Login Page</div>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    // Wait for error to be displayed
    // CRITICAL: This should show a user-friendly network error message
    // On unfixed code, it will show generic "OAuth login failed" or "Request failed"
    // Expected: "Network error. Please check your connection and try again." or similar
    await waitFor(
      () => {
        // Look for user-friendly network error guidance
        const errorText = screen.getByText(/(network.*connection|check.*connection|internet.*connection|connection.*problem)/i);
        expect(errorText).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    // Verify no invalid tokens are stored
    expect(localStorage.getItem('devarena_token')).toBeNull();
    expect(localStorage.getItem('devarena_user')).toBeNull();

    // Should redirect to login after error
    await waitFor(
      () => {
        expect(screen.getByTestId('login-page')).toBeInTheDocument();
      },
      { timeout: 2000 }
    );
  });

  /**
   * Property 2 (continued): Timeout errors should be handled gracefully
   * 
   * **Validates: Requirements 2.10**
   */
  test('Property 2: Timeout error during OAuth should display user-friendly error message', async () => {
    // Simulate timeout error - axios timeout errors have this specific message
    const timeoutError = new Error('timeout of 30000ms exceeded');
    timeoutError.code = 'ECONNABORTED';
    userApi.getMe.mockRejectedValue(timeoutError);

    const validToken = 'valid-token-but-timeout';
    const initialUrl = `/auth/callback?token=${validToken}`;

    render(
      <MemoryRouter initialEntries={[initialUrl]}>
        <AuthProvider>
          <Routes>
            <Route path="/auth/callback" element={<AuthCallbackPage />} />
            <Route path="/login" element={<div data-testid="login-page">Login Page</div>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    // Wait for error to be displayed
    // CRITICAL: Should show user-friendly timeout/network error message
    // Expected: "Network error. Please check your connection and try again." or similar
    // On unfixed code: "timeout of 30000ms exceeded" or "OAuth login failed"
    await waitFor(
      () => {
        const errorText = screen.getByText(/(network.*connection|check.*connection|internet.*connection|connection.*problem|try.*again)/i);
        expect(errorText).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    // Verify no invalid tokens are stored
    expect(localStorage.getItem('devarena_token')).toBeNull();
  });

  /**
   * Property 3: Bug Condition - Email/Password Redirect
   * 
   * **Validates: Requirements 2.12, 2.13**
   * 
   * For any successful email/password login or registration,
   * the system SHALL immediately redirect to the homepage after authentication completes.
   * 
   * **EXPECTED OUTCOME ON UNFIXED CODE**: Test MAY FAIL
   * - Navigation may not occur consistently after login/register
   * - Components may rely on auth state changes instead of explicit navigation
   * - Missing navigate() calls after successful authentication
   */
  test('Property 3: Email/password login should redirect to homepage after success', async () => {
    // Setup: Mock successful login
    const mockUser = {
      id: 'user-3',
      username: 'emailuser',
      email: 'email@example.com',
      role: 'user',
    };
    const mockToken = 'email-login-token-789';
    authApi.login.mockResolvedValue({
      token: mockToken,
      user: mockUser,
    });

    render(
      <MemoryRouter initialEntries={['/login']}>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/dashboard" element={<div data-testid="dashboard-page">Dashboard Page</div>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    // Fill in login form
    fireEvent.change(screen.getByPlaceholderText('you@example.com'), {
      target: { value: 'email@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'password123' },
    });

    // Submit login form
    fireEvent.click(screen.getByRole('button', { name: /^login$/i }));

    // Wait for login to complete
    await waitFor(
      () => {
        expect(authApi.login).toHaveBeenCalledWith({
          email: 'email@example.com',
          password: 'password123',
        });
      },
      { timeout: 3000 }
    );

    // CRITICAL ASSERTION: User should actually see the dashboard page
    await waitFor(
      () => {
        expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    // Verify token was stored
    expect(localStorage.getItem('devarena_token')).toBe(mockToken);
    expect(localStorage.getItem('devarena_user')).toBe(JSON.stringify(mockUser));
  });

  /**
   * Property 3 (continued): Registration should redirect to homepage after success
   * 
   * **Validates: Requirements 2.13**
   */
  test('Property 3: Email/password registration should redirect to homepage after success', async () => {
    // Setup: Mock successful registration and auto-login
    const mockUser = {
      id: 'user-4',
      username: 'newuser',
      email: 'new@example.com',
      role: 'user',
    };
    const mockToken = 'register-token-101';
    authApi.register.mockResolvedValue({
      user: mockUser,
    });
    authApi.login.mockResolvedValue({
      token: mockToken,
      user: mockUser,
    });

    render(
      <MemoryRouter initialEntries={['/register']}>
        <AuthProvider>
          <Routes>
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/dashboard" element={<div data-testid="dashboard-page">Dashboard Page</div>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    // Fill in registration form
    fireEvent.change(screen.getByPlaceholderText('devuser'), {
      target: { value: 'newuser' },
    });
    fireEvent.change(screen.getByPlaceholderText('you@example.com'), {
      target: { value: 'new@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Min. 8 characters'), {
      target: { value: 'password123' },
    });

    // Submit registration form
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    // Wait for registration and auto-login to complete
    await waitFor(
      () => {
        expect(authApi.register).toHaveBeenCalled();
        expect(authApi.login).toHaveBeenCalledWith({
          email: 'new@example.com',
          password: 'password123',
        });
      },
      { timeout: 3000 }
    );

    // CRITICAL ASSERTION: User should actually see the dashboard page
    await waitFor(
      () => {
        expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    // Verify token was stored
    expect(localStorage.getItem('devarena_token')).toBe(mockToken);
    expect(localStorage.getItem('devarena_user')).toBe(JSON.stringify(mockUser));
  });
});
