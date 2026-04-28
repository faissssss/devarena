/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { authApi, primeCsrfToken, unwrapError, userApi } from '../services/api';
import { decodeJwt, isTokenExpired } from '../utils/auth';

const AuthContext = createContext(null);

function getStoredSession() {
  const token = localStorage.getItem('devarena_token');
  const storedUser = localStorage.getItem('devarena_user');

  if (!token || isTokenExpired(token)) {
    localStorage.removeItem('devarena_token');
    localStorage.removeItem('devarena_user');
    return { token: null, user: null };
  }

  return {
    token,
    user: storedUser ? JSON.parse(storedUser) : null,
  };
}

export function AuthProvider({ children }) {
  const [{ token, user }, setSession] = useState(getStoredSession);
  const [loading, setLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Sync auth state across tabs
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'devarena_token' || e.key === 'devarena_user') {
        console.log('[AuthContext] Storage changed in another tab, syncing auth state');
        const newSession = getStoredSession();
        setSession(newSession);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Check token expiration periodically and warn user
  useEffect(() => {
    if (!token) return;

    const checkExpiration = () => {
      const payload = decodeJwt(token);
      if (!payload?.exp) return;

      const expiresAt = payload.exp * 1000;
      const now = Date.now();
      const timeUntilExpiry = expiresAt - now;

      // If token expires in less than 5 minutes, warn user
      if (timeUntilExpiry > 0 && timeUntilExpiry < 5 * 60 * 1000) {
        console.warn('[AuthContext] Token will expire soon. User should re-authenticate.');
        // You could dispatch an event here to show a notification to the user
      }

      // If token is expired, log out
      if (timeUntilExpiry <= 0) {
        console.log('[AuthContext] Token expired, logging out');
        localStorage.removeItem('devarena_token');
        localStorage.removeItem('devarena_user');
        setSession({ token: null, user: null });
      }
    };

    // Check immediately
    checkExpiration();

    // Check every minute
    const interval = setInterval(checkExpiration, 60 * 1000);
    return () => clearInterval(interval);
  }, [token]);

  useEffect(() => {
    if (!token || user) {
      setIsInitialized(true);
      return;
    }

    userApi
      .getMe()
      .then((response) => {
        setSession((current) => ({ ...current, user: response.user }));
        localStorage.setItem('devarena_user', JSON.stringify(response.user));
        setIsInitialized(true);
      })
      .catch(() => {
        localStorage.removeItem('devarena_token');
        localStorage.removeItem('devarena_user');
        setSession({ token: null, user: null });
        setIsInitialized(true);
      });
  }, [token, user]);

  const value = useMemo(
    () => ({
      token,
      user,
      isAuthenticated: Boolean(token && user),
      isAdmin: user?.role === 'admin',
      loading,
      isInitialized,
      async login(credentials) {
        setLoading(true);
        try {
          // Prime CSRF token before first POST request to ensure cookie exists
          await primeCsrfToken();
          const response = await authApi.login(credentials);
          localStorage.setItem('devarena_token', response.token);
          localStorage.setItem('devarena_user', JSON.stringify(response.user));
          setSession({ token: response.token, user: response.user });
          return response;
        } catch (error) {
          throw new Error(unwrapError(error, 'Login failed'));
        } finally {
          setLoading(false);
        }
      },
      async register(payload) {
        setLoading(true);
        try {
          // Prime CSRF token before first POST request to ensure cookie exists
          await primeCsrfToken();
          return await authApi.register(payload);
        } catch (error) {
          throw new Error(unwrapError(error, 'Registration failed'));
        } finally {
          setLoading(false);
        }
      },
      async continueWithProvider(provider, nextPath = '/') {
        window.location.assign(authApi.getOAuthUrl(provider, nextPath));
      },
      async completeOAuthLogin(token) {
        setLoading(true);
        try {
          localStorage.setItem('devarena_token', token);
          localStorage.removeItem('devarena_user');
          setSession({ token, user: null });

          const response = await userApi.getMe();
          localStorage.setItem('devarena_user', JSON.stringify(response.user));
          setSession({ token, user: response.user });
          return response.user;
        } catch (error) {
          localStorage.removeItem('devarena_token');
          localStorage.removeItem('devarena_user');
          setSession({ token: null, user: null });
          
          // Detect network-specific errors (timeouts, connection refused, etc.)
          const isNetworkError = 
            error?.code === 'ERR_NETWORK' || 
            error?.code === 'ECONNABORTED' ||
            error?.code === 'ECONNREFUSED' ||
            error?.code === 'ETIMEDOUT' ||
            error?.code === 'ENOTFOUND' ||
            (error?.message && error.message.toLowerCase().includes('network')) ||
            (error?.message && error.message.toLowerCase().includes('timeout'));
          
          if (isNetworkError) {
            // Create error with user-friendly message while preserving the code
            const networkError = new Error('Unable to connect. Please check your internet connection.');
            networkError.code = error.code || 'ERR_NETWORK';
            throw networkError;
          }
          
          // For non-network errors, preserve the original error code if it exists
          const wrappedError = new Error(unwrapError(error, 'OAuth login failed'));
          if (error.code) {
            wrappedError.code = error.code;
          }
          throw wrappedError;
        } finally {
          setLoading(false);
        }
      },
      async refreshUser() {
        const response = await userApi.getMe();
        localStorage.setItem('devarena_user', JSON.stringify(response.user));
        setSession((current) => ({ ...current, user: response.user }));
        return response.user;
      },
      logout() {
        localStorage.removeItem('devarena_token');
        localStorage.removeItem('devarena_user');
        setSession({ token: null, user: null });
      },
      getPayload() {
        return token ? decodeJwt(token) : null;
      },
    }),
    [loading, token, user, isInitialized]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
}
