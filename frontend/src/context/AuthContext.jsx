/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { authApi, unwrapError, userApi } from '../services/api';
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

  useEffect(() => {
    if (!token || user) {
      return;
    }

    userApi
      .getMe()
      .then((response) => {
        setSession((current) => ({ ...current, user: response.user }));
        localStorage.setItem('devarena_user', JSON.stringify(response.user));
      })
      .catch(() => {
        localStorage.removeItem('devarena_token');
        localStorage.removeItem('devarena_user');
        setSession({ token: null, user: null });
      });
  }, [token, user]);

  const value = useMemo(
    () => ({
      token,
      user,
      isAuthenticated: Boolean(token && user),
      isAdmin: user?.role === 'admin',
      loading,
      async login(credentials) {
        setLoading(true);
        try {
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
          return await authApi.register(payload);
        } catch (error) {
          throw new Error(unwrapError(error, 'Registration failed'));
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
    [loading, token, user]
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
