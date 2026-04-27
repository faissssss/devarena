/**
 * Preservation Property Tests for OAuth Redirect Fix
 * 
 * **IMPORTANT**: These tests verify existing behavior on UNFIXED code
 * **EXPECTED OUTCOME**: Tests PASS on unfixed code (confirms baseline behavior to preserve)
 * 
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10, 3.11, 3.12, 3.13**
 * 
 * Testing Strategy: Observation-first methodology
 * 1. Observe behavior on UNFIXED code for non-buggy inputs
 * 2. Write property-based tests capturing observed behavior patterns
 * 3. Run tests on UNFIXED code - they should PASS
 * 4. After fix is implemented, re-run these tests to ensure no regressions
 */

import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import AuthCallbackPage from './AuthCallbackPage';
import { AuthProvider } from '../context/AuthContext';
import { userApi } from '../services/api';

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

describe('Property 4: Preservation - Error Handling', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  /**
   * Property 4.1: OAuth error parameter handling
   * 
   * **Validates: Requirement 3.1**
   * 
   * WHEN OAuth authentication fails with an error parameter
   * THEN the system SHALL CONTINUE TO display the error message
   * AND redirect to the login page after 1200ms
   */
  test('OAuth callback with error parameter displays error and redirects to login after 1200ms', async () => {
    const errorMessage = 'OAuth provider authentication failed';
    const initialUrl = `/auth/callback?error=${encodeURIComponent(errorMessage)}`;

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

    // Error message should be displayed
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    // Should NOT redirect immediately
    expect(screen.queryByTestId('login-page')).not.toBeInTheDocument();

    // Should redirect to login after 1200ms
    await waitFor(
      () => {
        expect(screen.getByTestId('login-page')).toBeInTheDocument();
      },
      { timeout: 2000 }
    );

    // Verify no tokens were stored
    expect(localStorage.getItem('devarena_token')).toBeNull();
    expect(localStorage.getItem('devarena_user')).toBeNull();
  });

  /**
   * Property 4.2: Missing token handling
   * 
   * **Validates: Requirement 3.2**
   * 
   * WHEN the OAuth callback receives no token
   * THEN the system SHALL CONTINUE TO display "Missing OAuth token" error
   * AND redirect to the login page after 1200ms
   */
  test('OAuth callback without token displays missing token error and redirects after 1200ms', async () => {
    const initialUrl = `/auth/callback`;

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

    // Missing token error message should be displayed
    await waitFor(() => {
      expect(screen.getByText(/missing oauth token/i)).toBeInTheDocument();
    });

    // Should NOT redirect immediately
    expect(screen.queryByTestId('login-page')).not.toBeInTheDocument();

    // Should redirect to login after 1200ms
    await waitFor(
      () => {
        expect(screen.getByTestId('login-page')).toBeInTheDocument();
      },
      { timeout: 2000 }
    );

    // Verify no tokens were stored
    expect(localStorage.getItem('devarena_token')).toBeNull();
    expect(localStorage.getItem('devarena_user')).toBeNull();
  });

  /**
   * Property 4.3: completeOAuthLogin failure handling
   * 
   * **Validates: Requirement 3.3**
   * 
   * WHEN the completeOAuthLogin function throws an error
   * THEN the system SHALL CONTINUE TO display the error message
   * AND redirect to the login page after 1200ms
   */
  test('OAuth callback with completeOAuthLogin failure displays error and redirects after 1200ms', async () => {
    const authError = new Error('Invalid token signature');
    userApi.getMe.mockRejectedValue(authError);

    const validToken = 'invalid-signature-token';
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

    // Error message should be displayed (wrapped by unwrapError)
    await waitFor(() => {
      expect(screen.getByText(/oauth login failed|invalid token signature/i)).toBeInTheDocument();
    });

    // Should NOT redirect immediately
    expect(screen.queryByTestId('login-page')).not.toBeInTheDocument();

    // Should redirect to login after 1200ms
    await waitFor(
      () => {
        expect(screen.getByTestId('login-page')).toBeInTheDocument();
      },
      { timeout: 2000 }
    );

    // Verify tokens were cleared after error
    expect(localStorage.getItem('devarena_token')).toBeNull();
    expect(localStorage.getItem('devarena_user')).toBeNull();
  });
});

describe('Property 5: Preservation - Authentication State Management', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  /**
   * Property 5.1: Token storage during OAuth
   * 
   * **Validates: Requirements 3.11, 3.12**
   * 
   * WHEN OAuth creates a new user account or links to existing account
   * THEN the system SHALL CONTINUE TO store user profile data correctly in localStorage
   */
  test('OAuth success stores token and user data in localStorage', async () => {
    const mockUser = {
      id: 'user-preserve-1',
      username: 'preserveuser',
      email: 'preserve@example.com',
      role: 'user',
      createdAt: '2024-01-01T00:00:00.000Z',
    };
    userApi.getMe.mockResolvedValue({ user: mockUser });

    const validToken = 'preserve-token-123';
    const initialUrl = `/auth/callback?token=${validToken}`;

    render(
      <MemoryRouter initialEntries={[initialUrl]}>
        <AuthProvider>
          <Routes>
            <Route path="/auth/callback" element={<AuthCallbackPage />} />
            <Route path="/dashboard" element={<div data-testid="dashboard-page">Dashboard</div>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    // Wait for OAuth to complete
    await waitFor(() => {
      expect(userApi.getMe).toHaveBeenCalled();
    });

    // Verify token is stored
    expect(localStorage.getItem('devarena_token')).toBe(validToken);

    // Verify user data is stored correctly
    const storedUser = JSON.parse(localStorage.getItem('devarena_user'));
    expect(storedUser).toEqual(mockUser);
    expect(storedUser.id).toBe(mockUser.id);
    expect(storedUser.username).toBe(mockUser.username);
    expect(storedUser.email).toBe(mockUser.email);
    expect(storedUser.role).toBe(mockUser.role);
  });

  /**
   * Property 5.2: Token cleanup on authentication failure
   * 
   * **Validates: Requirements 3.6, 3.7**
   * 
   * WHEN authentication fails (401, expired token, etc.)
   * THEN the system SHALL CONTINUE TO clear stored tokens
   */
  test('Authentication failure clears tokens from localStorage', async () => {
    // Pre-populate localStorage with old tokens
    localStorage.setItem('devarena_token', 'old-token');
    localStorage.setItem('devarena_user', JSON.stringify({ id: 'old-user' }));

    const authError = new Error('Unauthorized');
    authError.response = { status: 401 };
    userApi.getMe.mockRejectedValue(authError);

    const invalidToken = 'expired-token';
    const initialUrl = `/auth/callback?token=${invalidToken}`;

    render(
      <MemoryRouter initialEntries={[initialUrl]}>
        <AuthProvider>
          <Routes>
            <Route path="/auth/callback" element={<AuthCallbackPage />} />
            <Route path="/login" element={<div data-testid="login-page">Login</div>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    // Wait for error handling
    await waitFor(() => {
      expect(userApi.getMe).toHaveBeenCalled();
    });

    // Verify tokens were cleared
    expect(localStorage.getItem('devarena_token')).toBeNull();
    expect(localStorage.getItem('devarena_user')).toBeNull();
  });

  /**
   * Property 5.3: OAuth state validation (CSRF protection)
   * 
   * **Validates: Requirements 3.8, 3.9**
   * 
   * WHEN OAuth state validation fails (state mismatch)
   * THEN the system SHALL CONTINUE TO reject the authentication and show an error
   * 
   * Note: This test verifies that error parameters are handled correctly,
   * which is how state validation failures are communicated from the backend
   */
  test('OAuth state mismatch error is handled correctly', async () => {
    const stateError = 'OAuth state mismatch - possible CSRF attack';
    const initialUrl = `/auth/callback?error=${encodeURIComponent(stateError)}`;

    render(
      <MemoryRouter initialEntries={[initialUrl]}>
        <AuthProvider>
          <Routes>
            <Route path="/auth/callback" element={<AuthCallbackPage />} />
            <Route path="/login" element={<div data-testid="login-page">Login</div>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    // State mismatch error should be displayed
    await waitFor(() => {
      expect(screen.getByText(stateError)).toBeInTheDocument();
    });

    // Should redirect to login after delay
    await waitFor(
      () => {
        expect(screen.getByTestId('login-page')).toBeInTheDocument();
      },
      { timeout: 2000 }
    );

    // Verify no tokens were stored
    expect(localStorage.getItem('devarena_token')).toBeNull();
  });

  /**
   * Property 5.4: OAuth session expiration handling
   * 
   * **Validates: Requirement 3.9**
   * 
   * WHEN OAuth session cookies expire
   * THEN the system SHALL CONTINUE TO reject the authentication and show error
   */
  test('OAuth session expired error is handled correctly', async () => {
    const sessionError = 'OAuth session expired. Please try again.';
    const initialUrl = `/auth/callback?error=${encodeURIComponent(sessionError)}`;

    render(
      <MemoryRouter initialEntries={[initialUrl]}>
        <AuthProvider>
          <Routes>
            <Route path="/auth/callback" element={<AuthCallbackPage />} />
            <Route path="/login" element={<div data-testid="login-page">Login</div>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    // Session expired error should be displayed
    await waitFor(() => {
      expect(screen.getByText(sessionError)).toBeInTheDocument();
    });

    // Should redirect to login after delay
    await waitFor(
      () => {
        expect(screen.getByTestId('login-page')).toBeInTheDocument();
      },
      { timeout: 2000 }
    );

    // Verify no tokens were stored
    expect(localStorage.getItem('devarena_token')).toBeNull();
  });

  /**
   * Property 5.5: Manual navigation to callback without parameters
   * 
   * **Validates: Requirement 3.10**
   * 
   * WHEN users manually navigate to the auth callback page without valid parameters
   * THEN the system SHALL CONTINUE TO handle it gracefully with appropriate error messages
   */
  test('Manual navigation to callback page without parameters shows error', async () => {
    const initialUrl = `/auth/callback`;

    render(
      <MemoryRouter initialEntries={[initialUrl]}>
        <AuthProvider>
          <Routes>
            <Route path="/auth/callback" element={<AuthCallbackPage />} />
            <Route path="/login" element={<div data-testid="login-page">Login</div>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    // Should show missing token error
    await waitFor(() => {
      expect(screen.getByText(/missing oauth token/i)).toBeInTheDocument();
    });

    // Should redirect to login
    await waitFor(
      () => {
        expect(screen.getByTestId('login-page')).toBeInTheDocument();
      },
      { timeout: 2000 }
    );
  });
});
