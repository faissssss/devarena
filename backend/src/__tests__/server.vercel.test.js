import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import request from 'supertest';

const mockExecuteFilter = jest.fn();
const mockGetAvailablePlatforms = jest.fn();
const mockGetCompetitionById = jest.fn();
const mockGetLiveCompetitionById = jest.fn();
const mockGetLivePlatforms = jest.fn();
const mockListLiveCompetitions = jest.fn();
const mockValidateToken = jest.fn();
const mockGetDatabaseStatus = jest.fn();
const mockIsDatabaseConfigured = jest.fn();
const mockWarmupConnection = jest.fn();

jest.unstable_mockModule('../services/filterEngine.js', () => ({
  executeFilter: mockExecuteFilter,
  getAvailablePlatforms: mockGetAvailablePlatforms,
}));

jest.unstable_mockModule('../services/competitionService.js', () => ({
  getCompetitionById: mockGetCompetitionById,
  deleteCompetition: jest.fn(),
  getPlatformStats: jest.fn(),
  listCompetitions: jest.fn(),
  updateCompetition: jest.fn(),
  updateCompetitionStatus: jest.fn(),
  upsertCompetitions: jest.fn(),
}));

jest.unstable_mockModule('../services/liveCompetitionService.js', () => ({
  getLiveCompetitionById: mockGetLiveCompetitionById,
  getLivePlatforms: mockGetLivePlatforms,
  listLiveCompetitions: mockListLiveCompetitions,
}));

jest.unstable_mockModule('../services/authService.js', () => ({
  AuthServiceError: class AuthServiceError extends Error {},
  comparePassword: jest.fn(),
  exchangeGithubCode: jest.fn(),
  exchangeGoogleCode: jest.fn(),
  generateToken: jest.fn(),
  hashPassword: jest.fn(),
  login: jest.fn(),
  loginWithOAuth: jest.fn(),
  register: jest.fn(),
  validateToken: mockValidateToken,
}));

jest.unstable_mockModule('../services/bookmarkService.js', () => ({
  createBookmark: jest.fn(),
  deleteBookmark: jest.fn(),
  findBookmarkByCompetition: jest.fn(),
  listBookmarks: jest.fn(),
}));

jest.unstable_mockModule('../services/dataSyncService.js', () => ({
  getSyncLogs: jest.fn(),
  syncAll: jest.fn(),
}));

jest.unstable_mockModule('../services/userService.js', () => ({
  changePassword: jest.fn(),
  getUserById: jest.fn(),
  updateCurrentUser: jest.fn(),
}));

jest.unstable_mockModule('../utils/db.js', () => ({
  closePool: jest.fn(),
  getClient: jest.fn(),
  getDatabaseStatus: mockGetDatabaseStatus,
  getPool: jest.fn(),
  initializePool: jest.fn(),
  isDatabaseConfigured: mockIsDatabaseConfigured,
  query: jest.fn(),
  testConnection: jest.fn(),
  warmupConnection: mockWarmupConnection,
}));

describe('server vercel routing', () => {
  let appModule;

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.resetModules();
    process.env.NODE_ENV = 'test';
    process.env.VERCEL = '1';
    delete process.env.DATABASE_URL;

    mockExecuteFilter.mockResolvedValue({
      competitions: [{ id: 'comp-1', title: 'Mock Competition' }],
      totalCount: 1,
      totalPages: 1,
      page: 1,
      limit: 12,
    });
    mockGetDatabaseStatus.mockResolvedValue({
      connected: false,
      configured: false,
      message: 'DATABASE_URL is not configured',
    });
    mockIsDatabaseConfigured.mockReturnValue(false);
    mockWarmupConnection.mockResolvedValue(true);

    appModule = await import('../server.js');
  });

  test('serves competitions on /api prefix for deterministic routing', async () => {
    const response = await request(appModule.createApp()).get('/api/competitions');

    expect(response.status).toBe(200);
    expect(response.body.competitions).toHaveLength(1);
    expect(response.body.competitions[0].id).toBe('comp-1');
  });

  test('returns json 404 for unknown /api routes (not platform 404)', async () => {
    const response = await request(appModule.createApp()).get('/api/unknown-route');

    expect(response.status).toBe(404);
    expect(response.headers['content-type']).toMatch(/application\/json/);
    expect(response.body.error.code).toBe('NOT_FOUND');
    expect(response.body.error.message).toBe('Route not found');
  });

  test('returns json 404 for root-level unknown routes', async () => {
    const response = await request(appModule.createApp()).get('/missing-route');

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
  });
});
