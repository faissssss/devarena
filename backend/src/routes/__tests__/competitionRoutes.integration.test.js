import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, jest, test } from '@jest/globals';

const mockExecuteFilter = jest.fn();
const mockGetAvailablePlatforms = jest.fn();
const mockGetCompetitionById = jest.fn();
const mockGetLiveCompetitionById = jest.fn();
const mockGetLivePlatforms = jest.fn();
const mockListLiveCompetitions = jest.fn();

jest.unstable_mockModule('../../services/filterEngine.js', () => ({
  executeFilter: mockExecuteFilter,
  getAvailablePlatforms: mockGetAvailablePlatforms,
}));

jest.unstable_mockModule('../../services/competitionService.js', () => ({
  getCompetitionById: mockGetCompetitionById,
}));

jest.unstable_mockModule('../../services/liveCompetitionService.js', () => ({
  getLiveCompetitionById: mockGetLiveCompetitionById,
  getLivePlatforms: mockGetLivePlatforms,
  listLiveCompetitions: mockListLiveCompetitions,
}));

describe('competition routes integration', () => {
  let competitionRoutes;
  let app;

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.resetModules();
    competitionRoutes = (await import('../competitionRoutes.js')).default;

    app = express();
    app.use('/api/competitions', competitionRoutes);
  });

  test('GET /api/competitions returns db results without falling back when empty', async () => {
    mockExecuteFilter.mockResolvedValueOnce({
      competitions: [],
      totalCount: 0,
      totalPages: 1,
      page: 1,
      limit: 10,
    });

    const response = await request(app).get('/api/competitions?status=ongoing&limit=10');

    expect(response.status).toBe(200);
    expect(response.body.competitions).toEqual([]);
    expect(mockListLiveCompetitions).not.toHaveBeenCalled();
  });

  test('GET /api/competitions falls back to live results when db query fails', async () => {
    mockExecuteFilter.mockRejectedValueOnce(new Error('db offline'));
    mockListLiveCompetitions.mockResolvedValueOnce({
      competitions: [{ id: 'live-1', title: 'Live comp' }],
      totalCount: 1,
      totalPages: 1,
      page: 1,
      limit: 10,
    });

    const response = await request(app).get('/api/competitions?limit=10');

    expect(response.status).toBe(200);
    expect(response.body.competitions).toHaveLength(1);
    expect(response.body.competitions[0].id).toBe('live-1');
  });

  test('GET /api/competitions still returns valid empty payload when db and live both fail', async () => {
    mockExecuteFilter.mockRejectedValueOnce(new Error('db offline'));
    mockListLiveCompetitions.mockRejectedValueOnce(new Error('live offline'));

    const response = await request(app).get('/api/competitions?limit=10&page=2');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      competitions: [],
      totalCount: 0,
      totalPages: 1,
      page: 2,
      limit: 10,
    });
  });
});
