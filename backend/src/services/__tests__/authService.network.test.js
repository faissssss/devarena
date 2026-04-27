import { jest, describe, test, expect, beforeEach } from '@jest/globals';

const mockQuery = jest.fn();

jest.unstable_mockModule('../../utils/db.js', () => ({
  query: mockQuery,
}));

// Mock axios
jest.unstable_mockModule('axios', () => ({
  default: {
    post: jest.fn(),
    get: jest.fn(),
  },
}));

describe('authService - Network Error Handling', () => {
  let authService;
  let mockedAxios;

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.resetModules();

    process.env.JWT_SECRET = 'test-secret-key-with-more-than-32-characters';
    process.env.GOOGLE_CLIENT_ID = 'test-google-client-id';
    process.env.GOOGLE_CLIENT_SECRET = 'test-google-client-secret';
    process.env.GITHUB_CLIENT_ID = 'test-github-client-id';
    process.env.GITHUB_CLIENT_SECRET = 'test-github-client-secret';

    mockedAxios = await import('axios');
    authService = await import('../authService.js');
  });

  describe('exchangeGoogleCode', () => {
    test('handles ECONNREFUSED error with user-friendly message', async () => {
      const error = new Error('connect ECONNREFUSED');
      error.code = 'ECONNREFUSED';
      mockedAxios.default.post.mockRejectedValue(error);

      await expect(
        authService.exchangeGoogleCode('test-code', 'http://localhost:3000/callback')
      ).rejects.toMatchObject({
        name: 'AuthServiceError',
        code: 'GOOGLE_CONNECTION_REFUSED',
        message: 'Unable to connect to Google. Please try again later.',
        statusCode: 503,
      });
    });

    test('handles ETIMEDOUT error with user-friendly message', async () => {
      const error = new Error('timeout of 30000ms exceeded');
      error.code = 'ETIMEDOUT';
      mockedAxios.default.post.mockRejectedValue(error);

      await expect(
        authService.exchangeGoogleCode('test-code', 'http://localhost:3000/callback')
      ).rejects.toMatchObject({
        name: 'AuthServiceError',
        code: 'GOOGLE_TIMEOUT',
        message: 'Connection to Google timed out. Please check your internet connection and try again.',
        statusCode: 504,
      });
    });

    test('handles ENOTFOUND error with user-friendly message', async () => {
      const error = new Error('getaddrinfo ENOTFOUND oauth2.googleapis.com');
      error.code = 'ENOTFOUND';
      mockedAxios.default.post.mockRejectedValue(error);

      await expect(
        authService.exchangeGoogleCode('test-code', 'http://localhost:3000/callback')
      ).rejects.toMatchObject({
        name: 'AuthServiceError',
        code: 'GOOGLE_DNS_ERROR',
        message: 'Unable to reach Google services. Please check your internet connection and try again.',
        statusCode: 503,
      });
    });

    test('handles API errors from Google', async () => {
      const error = new Error('Request failed with status code 400');
      error.response = {
        status: 400,
        data: { error: 'invalid_grant' },
      };
      mockedAxios.default.post.mockRejectedValue(error);

      await expect(
        authService.exchangeGoogleCode('test-code', 'http://localhost:3000/callback')
      ).rejects.toMatchObject({
        name: 'AuthServiceError',
        code: 'GOOGLE_API_ERROR',
        message: 'Google authentication failed. Please try again.',
        statusCode: 400,
      });
    });

    test('handles generic network errors', async () => {
      const error = new Error('Network error');
      mockedAxios.default.post.mockRejectedValue(error);

      await expect(
        authService.exchangeGoogleCode('test-code', 'http://localhost:3000/callback')
      ).rejects.toMatchObject({
        name: 'AuthServiceError',
        code: 'GOOGLE_NETWORK_ERROR',
        message: 'Network error during Google authentication. Please check your connection and try again.',
        statusCode: 503,
      });
    });
  });

  describe('exchangeGithubCode', () => {
    test('handles ECONNREFUSED error with user-friendly message', async () => {
      const error = new Error('connect ECONNREFUSED');
      error.code = 'ECONNREFUSED';
      mockedAxios.default.post.mockRejectedValue(error);

      await expect(
        authService.exchangeGithubCode('test-code', 'http://localhost:3000/callback')
      ).rejects.toMatchObject({
        name: 'AuthServiceError',
        code: 'GITHUB_CONNECTION_REFUSED',
        message: 'Unable to connect to GitHub. Please try again later.',
        statusCode: 503,
      });
    });

    test('handles ETIMEDOUT error with user-friendly message', async () => {
      const error = new Error('timeout of 30000ms exceeded');
      error.code = 'ETIMEDOUT';
      mockedAxios.default.post.mockRejectedValue(error);

      await expect(
        authService.exchangeGithubCode('test-code', 'http://localhost:3000/callback')
      ).rejects.toMatchObject({
        name: 'AuthServiceError',
        code: 'GITHUB_TIMEOUT',
        message: 'Connection to GitHub timed out. Please check your internet connection and try again.',
        statusCode: 504,
      });
    });

    test('handles ENOTFOUND error with user-friendly message', async () => {
      const error = new Error('getaddrinfo ENOTFOUND github.com');
      error.code = 'ENOTFOUND';
      mockedAxios.default.post.mockRejectedValue(error);

      await expect(
        authService.exchangeGithubCode('test-code', 'http://localhost:3000/callback')
      ).rejects.toMatchObject({
        name: 'AuthServiceError',
        code: 'GITHUB_DNS_ERROR',
        message: 'Unable to reach GitHub services. Please check your internet connection and try again.',
        statusCode: 503,
      });
    });

    test('handles missing access_token with detailed logging', async () => {
      mockedAxios.default.post.mockResolvedValue({
        data: {
          error: 'bad_verification_code',
          error_description: 'The code passed is incorrect or expired.',
        },
      });

      await expect(
        authService.exchangeGithubCode('invalid-code', 'http://localhost:3000/callback')
      ).rejects.toMatchObject({
        name: 'AuthServiceError',
        code: 'GITHUB_TOKEN_EXCHANGE_FAILED',
        message: 'GitHub did not return an access token. Please try again.',
        statusCode: 400,
      });
    });

    test('handles API errors from GitHub', async () => {
      const error = new Error('Request failed with status code 401');
      error.response = {
        status: 401,
        data: { message: 'Bad credentials' },
      };
      mockedAxios.default.post.mockRejectedValue(error);

      await expect(
        authService.exchangeGithubCode('test-code', 'http://localhost:3000/callback')
      ).rejects.toMatchObject({
        name: 'AuthServiceError',
        code: 'GITHUB_API_ERROR',
        message: 'GitHub authentication failed. Please try again.',
        statusCode: 401,
      });
    });

    test('handles generic network errors', async () => {
      const error = new Error('Network error');
      mockedAxios.default.post.mockRejectedValue(error);

      await expect(
        authService.exchangeGithubCode('test-code', 'http://localhost:3000/callback')
      ).rejects.toMatchObject({
        name: 'AuthServiceError',
        code: 'GITHUB_NETWORK_ERROR',
        message: 'Network error during GitHub authentication. Please check your connection and try again.',
        statusCode: 503,
      });
    });
  });
});
