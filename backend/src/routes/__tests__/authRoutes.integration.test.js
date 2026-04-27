import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, jest, test } from '@jest/globals';

const mockExchangeGithubCode = jest.fn();
const mockExchangeGoogleCode = jest.fn();
const mockLogin = jest.fn();
const mockLoginWithOAuth = jest.fn();
const mockRegister = jest.fn();

jest.unstable_mockModule('../../services/authService.js', () => {
  class MockAuthServiceError extends Error {
    constructor(message, code, statusCode = 400) {
      super(message);
      this.name = 'AuthServiceError';
      this.code = code;
      this.statusCode = statusCode;
    }
  }

  return {
    AuthServiceError: MockAuthServiceError,
    exchangeGithubCode: mockExchangeGithubCode,
    exchangeGoogleCode: mockExchangeGoogleCode,
    login: mockLogin,
    loginWithOAuth: mockLoginWithOAuth,
    register: mockRegister,
  };
});

describe('auth routes integration', () => {
  let authRoutes;
  let app;

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.resetModules();
    process.env.NODE_ENV = 'test';
    process.env.GOOGLE_CLIENT_ID = 'google-client-id';
    process.env.GITHUB_CLIENT_ID = 'github-client-id';

    authRoutes = (await import('../authRoutes.js')).default;

    app = express();
    app.use(express.json());
    app.use('/api/auth', authRoutes);
    app.use('/auth', authRoutes);
  });

  test('POST /api/auth/login returns token and user payload', async () => {
    mockLogin.mockResolvedValueOnce({
      token: 'jwt-token',
      user: { id: 'user-1', email: 'user@example.com', role: 'user' },
    });

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user@example.com', password: 'password123' });

    expect(response.status).toBe(200);
    expect(response.body.token).toBe('jwt-token');
    expect(mockLogin).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'password123',
    });
  });

  test('GET /auth/oauth/google builds callback using forwarded vercel origin and secure cookie', async () => {
    const response = await request(app)
      .get('/auth/oauth/google?next=/dashboard')
      .set('x-forwarded-proto', 'https')
      .set('x-forwarded-host', 'preview-app.vercel.app');

    expect(response.status).toBe(302);
    expect(response.headers.location).toContain(
      encodeURIComponent('https://preview-app.vercel.app/api/auth/oauth/google/callback')
    );
    expect(response.headers['set-cookie'][0]).toContain('devarena_oauth_state_google=');
    expect(response.headers['set-cookie'][0]).toContain('Secure');
  });

  test('GET /api/auth/oauth/github/callback redirects back to frontend callback on same vercel origin', async () => {
    mockExchangeGithubCode.mockResolvedValueOnce({
      provider: 'github',
      providerUserId: 'gh-1',
      email: 'octo@example.com',
      username: 'octocat',
      avatarUrl: null,
    });
    mockLoginWithOAuth.mockResolvedValueOnce({
      token: 'oauth-token',
      user: { id: 'user-2', email: 'octo@example.com', role: 'user' },
    });

    const response = await request(app)
      .get('/api/auth/oauth/github/callback?code=test-code&state=state-123')
      .set('x-forwarded-proto', 'https')
      .set('x-forwarded-host', 'preview-app.vercel.app')
      .set('Cookie', 'devarena_oauth_state_github=state-123%7C%2Fdashboard');

    expect(response.status).toBe(302);
    expect(mockExchangeGithubCode).toHaveBeenCalledWith(
      'test-code',
      'https://preview-app.vercel.app/api/auth/oauth/github/callback'
    );
    expect(response.headers.location).toBe(
      'https://preview-app.vercel.app/auth/callback?token=oauth-token&next=%2Fdashboard'
    );
    expect(response.headers['set-cookie'][0]).toContain('devarena_oauth_state_github=');
  });
});
