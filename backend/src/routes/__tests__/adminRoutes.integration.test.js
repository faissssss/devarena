import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import request from 'supertest';

const mockSyncAll = jest.fn();
const mockGetSyncLogs = jest.fn();
const mockDeleteCompetition = jest.fn();
const mockGetPlatformStats = jest.fn();
const mockListCompetitions = jest.fn();
const mockUpdateCompetition = jest.fn();
const mockValidateToken = jest.fn();

jest.unstable_mockModule('../../services/dataSyncService.js', () => ({
  createSyncLog: jest.fn(),
  syncKontests: jest.fn(),
  syncCLIST: jest.fn(),
  syncKaggle: jest.fn(),
  syncAll: mockSyncAll,
  getSyncLogs: mockGetSyncLogs,
}));

jest.unstable_mockModule('../../services/competitionService.js', () => ({
  updateCompetitionStatus: jest.fn(),
  upsertCompetitions: jest.fn(),
  getCompetitionById: jest.fn(),
  deleteCompetition: mockDeleteCompetition,
  updateCompetition: mockUpdateCompetition,
  listCompetitions: mockListCompetitions,
  getPlatformStats: mockGetPlatformStats,
}));

jest.unstable_mockModule('../../services/authService.js', () => ({
  hashPassword: jest.fn(),
  comparePassword: jest.fn(),
  generateToken: jest.fn(),
  validateToken: mockValidateToken,
  register: jest.fn(),
  login: jest.fn(),
}));

describe('admin routes integration', () => {
  let appModule;

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.resetModules();
    process.env.NODE_ENV = 'test';
    appModule = await import('../../server.js');
  });

  test('admin can trigger sync and view logs', async () => {
    mockValidateToken.mockReturnValue({ userId: 'admin-1', role: 'admin' });
    mockSyncAll.mockResolvedValueOnce({
      results: [],
      successCount: 3,
      failureCount: 0,
      totalProcessed: 9,
    });
    mockGetSyncLogs.mockResolvedValueOnce({
      logs: [{ id: 'log-1', source: 'kontests', status: 'success' }],
      totalCount: 1,
      totalPages: 1,
      page: 1,
      limit: 20,
    });

    const app = appModule.createApp();

    const syncResponse = await request(app)
      .post('/api/admin/sync')
      .set('Authorization', 'Bearer admin-token');
    expect(syncResponse.status).toBe(200);
    expect(syncResponse.body.totalProcessed).toBe(9);

    const logsResponse = await request(app)
      .get('/api/admin/sync-logs')
      .set('Authorization', 'Bearer admin-token');
    expect(logsResponse.status).toBe(200);
    expect(logsResponse.body.logs).toHaveLength(1);
  });

  test('non-admin receives 403 for admin routes', async () => {
    mockValidateToken.mockReturnValue({ userId: 'user-1', role: 'user' });

    const response = await request(appModule.createApp())
      .post('/api/admin/sync')
      .set('Authorization', 'Bearer user-token');

    expect(response.status).toBe(403);
    expect(response.body.error.message).toBe('Admin access required');
  });

  test('admin can update and delete competitions', async () => {
    mockValidateToken.mockReturnValue({ userId: 'admin-1', role: 'admin' });
    mockUpdateCompetition.mockResolvedValueOnce({
      id: 'competition-1',
      title: 'Updated Title',
    });
    mockDeleteCompetition.mockResolvedValueOnce(true);

    const app = appModule.createApp();

    const updateResponse = await request(app)
      .put('/api/admin/competitions/competition-1')
      .set('Authorization', 'Bearer admin-token')
      .send({ title: 'Updated Title' });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.competition.title).toBe('Updated Title');

    const deleteResponse = await request(app)
      .delete('/api/admin/competitions/competition-1')
      .set('Authorization', 'Bearer admin-token');

    expect(deleteResponse.status).toBe(204);
    expect(mockDeleteCompetition).toHaveBeenCalledWith('competition-1');
  });
});
