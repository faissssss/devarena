import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, jest, test } from '@jest/globals';

const mockExchangeGithubCode = jest.fn();
const mockExchangeGoogleCode = jest.fn();
const mockLogin = jest.fn();
const mockLoginWithOAuth = jest.fn();
const mockRegister = jest.fn();
const mockWarmupConnection = jest.fn();

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

jest.unstable_mockModule('../../utils/db.js', () => ({
  warmupConnection: mockWarmupConnection,
}));

describe('auth routes integration', () => {
  let authRoutes;
  let app;

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.resetModules();
    process.env.NODE_ENV = 'test';
    process.env.GOOGLE_CLIENT_ID = 'google-client-id';
    process.env.GITHUB_CLIENT_ID = 'github-client-id';
    process.env.APP_URL = 'http://localhost:5173';
    process.env.API_URL = 'http://localhost:3000';
    mockWarmupConnection.mockResolvedValue();

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

  test('GET /auth/oauth/google uses frontend APP_URL for local callback redirects', async () => {
    mockExchangeGoogleCode.mockResolvedValueOnce({
      provider: 'google',
      providerUserId: 'google-1',
      email: 'user@example.com',
      username: 'google-user',
      avatarUrl: null,
    });
    mockLoginWithOAuth.mockResolvedValueOnce({
      token: 'oauth-token',
      user: { id: 'user-3', email: 'user@example.com', role: 'user' },
    });

    const response = await request(app)
      .get('/auth/oauth/google/callback?code=test-code&state=state-123')
      .set('Host', 'localhost:3000')
      .set('Cookie', 'devarena_oauth_state_google=state-123%7C%2Fhome');

    expect(response.status).toBe(302);
    expect(response.headers.location).toBe(
      'http://localhost:5173/auth/callback?token=oauth-token&next=%2Fhome'
    );
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

  test('GET /auth/oauth/google does not require database warmup before redirecting to provider', async () => {
    const response = await request(app).get('/auth/oauth/google?next=/home');

    expect(response.status).toBe(302);
    expect(response.headers.location).toContain('https://accounts.google.com/o/oauth2/v2/auth?');
    expect(mockWarmupConnection).not.toHaveBeenCalled();
  });

  test('OAuth redirect URI prioritizes x-forwarded headers over localhost', async () => {
    // Test that x-forwarded-host and x-forwarded-proto are used for redirect URI construction
    const response = await request(app)
      .get('/auth/oauth/google?next=/explore')
      .set('x-forwarded-proto', 'https')
      .set('x-forwarded-host', 'devarena-rust.vercel.app')
      .set('host', 'localhost:3000'); // Should be ignored in favor of x-forwarded-host

    expect(response.status).toBe(302);
    // Verify the redirect URI in the OAuth provider URL uses the Vercel production origin
    expect(response.headers.location).toContain(
      encodeURIComponent('https://devarena-rust.vercel.app/api/auth/oauth/google/callback')
    );
    // Should NOT contain localhost
    expect(response.headers.location).not.toContain('localhost');
  });

  test('OAuth callback uses correct redirect URI with x-forwarded headers', async () => {
    mockExchangeGoogleCode.mockResolvedValueOnce({
      provider: 'google',
      providerUserId: 'google-2',
      email: 'test@example.com',
      username: 'test-user',
      avatarUrl: null,
    });
    mockLoginWithOAuth.mockResolvedValueOnce({
      token: 'test-token',
      user: { id: 'user-4', email: 'test@example.com', role: 'user' },
    });

    const response = await request(app)
      .get('/auth/oauth/google/callback?code=test-code&state=state-456')
      .set('x-forwarded-proto', 'https')
      .set('x-forwarded-host', 'devarena-rust.vercel.app')
      .set('Cookie', 'devarena_oauth_state_google=state-456%7C%2Fexplore');

    expect(response.status).toBe(302);
    // Verify exchangeGoogleCode was called with the correct redirect URI
    expect(mockExchangeGoogleCode).toHaveBeenCalledWith(
      'test-code',
      'https://devarena-rust.vercel.app/api/auth/oauth/google/callback'
    );
    // Verify redirect back to frontend uses the same origin
    expect(response.headers.location).toBe(
      'https://devarena-rust.vercel.app/auth/callback?token=test-token&next=%2Fexplore'
    );
  });

  test('OAuth error handling includes error code and detailed message', async () => {
    mockExchangeGithubCode.mockRejectedValueOnce(
      new Error('redirect_uri_mismatch: The redirect URI does not match')
    );

    const response = await request(app)
      .get('/auth/oauth/github/callback?code=test-code&state=state-789')
      .set('x-forwarded-proto', 'https')
      .set('x-forwarded-host', 'devarena-rust.vercel.app')
      .set('Cookie', 'devarena_oauth_state_github=state-789%7C%2Fhome');

    expect(response.status).toBe(302);
    // Verify error redirect includes error code
    expect(response.headers.location).toContain('error=');
    expect(response.headers.location).toContain('code=');
  });
});
