/**
 * Preservation Property Tests for AuthContext
 * 
 * **IMPORTANT**: These tests verify existing authentication state management on UNFIXED code
 * **EXPECTED OUTCOME**: Tests PASS on unfixed code (confirms baseline behavior to preserve)
 * 
 * **Validates: Requirements 3.4, 3.5, 3.6, 3.7, 3.11, 3.12, 3.13**
 * 
 * Testing Strategy: Property-based testing for authentication state management
 * - Test token storage and retrieval
 * - Test user data management
 * - Test logout functionality
 * - Test token expiration handling
 */

import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { AuthProvider, useAuth } from './AuthContext';
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

// Mock JWT decode
vi.mock('../utils/auth', () => ({
  decodeJwt: vi.fn((token) => {
    if (!token) return null;
    return {
      userId: 'user-123',
      exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
    };
  }),
  isTokenExpired: vi.fn((token) => {
    if (!token) return true;
    // For testing, consider tokens starting with 'expired-' as expired
    return token.startsWith('expired-');
  }),
}));

describe('Property 5: Preservation - Authentication State Management (AuthContext)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  /**
   * Property 5.6: Email/password login authentication
   * 
   * **Validates: Requirement 3.4**
   * 
   * WHEN a user performs traditional email/password login with valid credentials
   * THEN the system SHALL CONTINUE TO authenticate successfully and store the token
   */
  test('Email/password login stores token and user data correctly', async () => {
    const mockUser = {
      id: 'user-login-1',
      username: 'loginuser',
      email: 'login@example.com',
      role: 'user',
    };
    const mockToken = 'login-token-abc123';

    authApi.login.mockResolvedValue({
      token: mockToken,
      user: mockUser,
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    // Perform login
    await act(async () => {
      await result.current.login({
        email: 'login@example.com',
        password: 'password123',
      });
    });

    // Verify token is stored
    expect(localStorage.getItem('devarena_token')).toBe(mockToken);

    // Verify user data is stored
    const storedUser = JSON.parse(localStorage.getItem('devarena_user'));
    expect(storedUser).toEqual(mockUser);

    // Verify auth state is updated
    expect(result.current.token).toBe(mockToken);
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
  });

  /**
   * Property 5.7: Email/password registration
   * 
   * **Validates: Requirement 3.5**
   * 
   * WHEN a user performs traditional email/password registration with valid data
   * THEN the system SHALL CONTINUE TO create the account successfully
   */
  test('Email/password registration creates account successfully', async () => {
    const mockUser = {
      id: 'user-register-1',
      username: 'newuser',
      email: 'new@example.com',
      role: 'user',
    };

    authApi.register.mockResolvedValue({
      user: mockUser,
      message: 'Registration successful',
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    // Perform registration
    let registrationResult;
    await act(async () => {
      registrationResult = await result.current.register({
        username: 'newuser',
        email: 'new@example.com',
        password: 'password123',
      });
    });

    // Verify registration was successful
    expect(registrationResult.user).toEqual(mockUser);
    expect(authApi.register).toHaveBeenCalledWith({
      username: 'newuser',
      email: 'new@example.com',
      password: 'password123',
    });
  });

  /**
   * Property 5.8: JWT token expiration handling
   * 
   * **Validates: Requirement 3.6**
   * 
   * WHEN a user's JWT token expires
   * THEN the system SHALL CONTINUE TO remove the token and require re-authentication
   */
  test('Expired token is removed from localStorage on initialization', async () => {
    // Pre-populate with expired token
    const expiredToken = 'expired-token-xyz';
    const oldUser = { id: 'old-user', username: 'olduser' };
    localStorage.setItem('devarena_token', expiredToken);
    localStorage.setItem('devarena_user', JSON.stringify(oldUser));

    // Render hook - should detect expired token and clear it
    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    // Verify expired token was cleared
    expect(localStorage.getItem('devarena_token')).toBeNull();
    expect(localStorage.getItem('devarena_user')).toBeNull();

    // Verify auth state is cleared
    expect(result.current.token).toBeNull();
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  /**
   * Property 5.9: 401 unauthorized response handling
   * 
   * **Validates: Requirement 3.7**
   * 
   * WHEN API requests receive 401 unauthorized responses
   * THEN the system SHALL CONTINUE TO clear stored tokens and require re-authentication
   * 
   * Note: This is tested through the completeOAuthLogin flow which calls userApi.getMe
   */
  test('401 error during user fetch clears tokens', async () => {
    // Pre-populate with valid token
    const validToken = 'valid-token-401';
    localStorage.setItem('devarena_token', validToken);

    // Mock 401 error
    const unauthorizedError = new Error('Unauthorized');
    unauthorizedError.response = { status: 401 };
    userApi.getMe.mockRejectedValue(unauthorizedError);

    // Render hook - should attempt to fetch user and fail with 401
    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    // Wait for the effect to run and clear tokens
    await waitFor(() => {
      expect(localStorage.getItem('devarena_token')).toBeNull();
      expect(localStorage.getItem('devarena_user')).toBeNull();
    });

    // Verify auth state is cleared
    expect(result.current.token).toBeNull();
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  /**
   * Property 5.10: Logout functionality
   * 
   * **Validates: Requirement 3.13**
   * 
   * WHEN users log out
   * THEN the system SHALL CONTINUE TO clear all authentication tokens and user data from localStorage
   */
  test('Logout clears all tokens and user data', async () => {
    // Pre-populate with authenticated state
    const mockToken = 'logout-token-123';
    const mockUser = {
      id: 'user-logout',
      username: 'logoutuser',
      email: 'logout@example.com',
    };
    localStorage.setItem('devarena_token', mockToken);
    localStorage.setItem('devarena_user', JSON.stringify(mockUser));

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    // Verify initial authenticated state
    expect(result.current.token).toBe(mockToken);
    expect(result.current.user).toEqual(mockUser);

    // Perform logout
    act(() => {
      result.current.logout();
    });

    // Verify all tokens and user data are cleared
    expect(localStorage.getItem('devarena_token')).toBeNull();
    expect(localStorage.getItem('devarena_user')).toBeNull();

    // Verify auth state is cleared
    expect(result.current.token).toBeNull();
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  /**
   * Property 5.11: OAuth user data storage
   * 
   * **Validates: Requirements 3.11, 3.12**
   * 
   * WHEN OAuth creates a new user account or links to existing account
   * THEN the system SHALL CONTINUE TO generate unique usernames and store user profile data correctly
   */
  test('completeOAuthLogin stores user data correctly', async () => {
    const mockUser = {
      id: 'oauth-user-1',
      username: 'oauthuser_12345', // Unique generated username
      email: 'oauth@example.com',
      role: 'user',
      oauthProvider: 'google',
      oauthId: 'google-123456',
    };
    const oauthToken = 'oauth-token-xyz789';

    userApi.getMe.mockResolvedValue({ user: mockUser });

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    // Complete OAuth login
    await act(async () => {
      await result.current.completeOAuthLogin(oauthToken);
    });

    // Verify token is stored
    expect(localStorage.getItem('devarena_token')).toBe(oauthToken);

    // Verify user data is stored with all OAuth fields
    const storedUser = JSON.parse(localStorage.getItem('devarena_user'));
    expect(storedUser).toEqual(mockUser);
    expect(storedUser.username).toBe(mockUser.username);
    expect(storedUser.oauthProvider).toBe('google');
    expect(storedUser.oauthId).toBe('google-123456');

    // Verify auth state
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
  });

  /**
   * Property 5.12: OAuth account linking to existing email
   * 
   * **Validates: Requirement 3.12**
   * 
   * WHEN OAuth links to an existing email account
   * THEN the system SHALL CONTINUE TO link the OAuth provider to the existing user account
   */
  test('OAuth linking to existing email preserves user data', async () => {
    const existingUser = {
      id: 'existing-user-1',
      username: 'existinguser',
      email: 'existing@example.com',
      role: 'user',
      createdAt: '2023-01-01T00:00:00.000Z',
      // Now linked with OAuth
      oauthProvider: 'github',
      oauthId: 'github-789012',
    };
    const oauthToken = 'oauth-link-token-456';

    userApi.getMe.mockResolvedValue({ user: existingUser });

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    // Complete OAuth login (linking to existing account)
    await act(async () => {
      await result.current.completeOAuthLogin(oauthToken);
    });

    // Verify token is stored
    expect(localStorage.getItem('devarena_token')).toBe(oauthToken);

    // Verify existing user data is preserved with OAuth link added
    const storedUser = JSON.parse(localStorage.getItem('devarena_user'));
    expect(storedUser.id).toBe(existingUser.id);
    expect(storedUser.username).toBe(existingUser.username);
    expect(storedUser.email).toBe(existingUser.email);
    expect(storedUser.createdAt).toBe(existingUser.createdAt);
    expect(storedUser.oauthProvider).toBe('github');
    expect(storedUser.oauthId).toBe('github-789012');
  });

  /**
   * Property 5.13: User data refresh functionality
   * 
   * **Validates: Requirement 3.11**
   * 
   * WHEN user data needs to be refreshed
   * THEN the system SHALL CONTINUE TO fetch and update user data correctly
   */
  test('refreshUser updates user data in localStorage and state', async () => {
    // Initial authenticated state
    const initialUser = {
      id: 'user-refresh',
      username: 'refreshuser',
      email: 'refresh@example.com',
      role: 'user',
    };
    const mockToken = 'refresh-token-123';
    localStorage.setItem('devarena_token', mockToken);
    localStorage.setItem('devarena_user', JSON.stringify(initialUser));

    // Updated user data (e.g., profile updated)
    const updatedUser = {
      ...initialUser,
      username: 'refreshuser_updated',
      bio: 'Updated bio',
    };
    userApi.getMe.mockResolvedValue({ user: updatedUser });

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    // Refresh user data
    await act(async () => {
      await result.current.refreshUser();
    });

    // Verify updated user data is stored
    const storedUser = JSON.parse(localStorage.getItem('devarena_user'));
    expect(storedUser).toEqual(updatedUser);
    expect(storedUser.username).toBe('refreshuser_updated');
    expect(storedUser.bio).toBe('Updated bio');

    // Verify auth state is updated
    expect(result.current.user).toEqual(updatedUser);
  });

  /**
   * Property 5.14: Token persistence across page reloads
   * 
   * **Validates: Requirements 3.4, 3.11**
   * 
   * WHEN the application reloads with valid tokens in localStorage
   * THEN the system SHALL CONTINUE TO restore the authenticated session
   */
  test('Valid token in localStorage restores authenticated session', async () => {
    const mockUser = {
      id: 'user-persist',
      username: 'persistuser',
      email: 'persist@example.com',
      role: 'user',
    };
    const mockToken = 'persist-token-123';

    // Pre-populate localStorage (simulating page reload)
    localStorage.setItem('devarena_token', mockToken);
    localStorage.setItem('devarena_user', JSON.stringify(mockUser));

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    // Verify session is restored
    expect(result.current.token).toBe(mockToken);
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
  });
});
