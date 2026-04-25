import { beforeEach, describe, expect, jest, test } from '@jest/globals';

const mockAxiosGet = jest.fn();
const mockQuery = jest.fn();
const mockUpsertCompetitions = jest.fn();

jest.unstable_mockModule('axios', () => ({
  default: {
    get: mockAxiosGet,
  },
}));

jest.unstable_mockModule('../../utils/db.js', () => ({
  query: mockQuery,
}));

jest.unstable_mockModule('../competitionService.js', () => ({
  upsertCompetitions: mockUpsertCompetitions,
}));

describe('dataSyncService', () => {
  let dataSyncService;

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.resetModules();

    process.env.KONTESTS_API_URL = 'https://kontests.example/api';
    process.env.CLIST_API_URL = 'https://clist.example/api';
    process.env.KAGGLE_API_URL = 'https://kaggle.example/api';
    process.env.CLIST_API_KEY = 'clist-key';
    process.env.CLIST_USERNAME = 'clist-user';
    process.env.KAGGLE_API_KEY = 'kaggle-key';
    process.env.KAGGLE_USERNAME = 'kaggle-user';
    process.env.SYNC_TIMEOUT = '30000';

    dataSyncService = await import('../dataSyncService.js');
  });

  test('syncKontests stores competitions and logs success', async () => {
    mockAxiosGet.mockResolvedValueOnce({
      data: [
        {
          name: 'Codeforces Round',
          url: 'https://codeforces.com',
          start_time: '2026-05-01T00:00:00.000Z',
          end_time: '2026-05-01T02:00:00.000Z',
          site: 'CodeForces',
        },
      ],
    });
    mockUpsertCompetitions.mockResolvedValueOnce({
      inserted: 1,
      updated: 0,
      total: 1,
    });
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 'log-1', source: 'kontests', status: 'success' }],
    });

    const result = await dataSyncService.syncKontests();

    expect(mockAxiosGet).toHaveBeenCalledWith(process.env.KONTESTS_API_URL, {
      timeout: 30000,
    });
    expect(mockUpsertCompetitions).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          title: 'Codeforces Round',
          source: 'kontests',
        }),
      ])
    );
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO sync_logs'),
      ['kontests', 'success', 1, null]
    );
    expect(result).toEqual(
      expect.objectContaining({
        source: 'kontests',
        success: true,
        processed: 1,
      })
    );
  });

  test('syncCLIST logs parser errors without throwing', async () => {
    mockAxiosGet.mockResolvedValueOnce({ data: '{invalid json' });
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 'log-2', source: 'clist', status: 'error' }],
    });

    const result = await dataSyncService.syncCLIST();

    expect(mockAxiosGet).toHaveBeenCalledWith(process.env.CLIST_API_URL, {
      timeout: 30000,
      params: {
        username: 'clist-user',
        api_key: 'clist-key',
      },
      headers: {
        Authorization: 'Token clist-key',
      },
    });
    expect(result).toEqual(
      expect.objectContaining({
        source: 'clist',
        success: false,
        processed: 0,
      })
    );
    expect(mockUpsertCompetitions).not.toHaveBeenCalled();
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO sync_logs'),
      [
        'clist',
        'error',
        0,
        expect.stringContaining('Failed to parse CLIST response JSON'),
      ]
    );
  });

  test('syncAll aggregates mixed results and continues past failures', async () => {
    mockAxiosGet
      .mockResolvedValueOnce({
        data: [
          {
            name: 'Round 1',
            url: 'https://example.com/1',
            start_time: '2026-05-01T00:00:00.000Z',
            end_time: '2026-05-01T02:00:00.000Z',
            site: 'CodeForces',
          },
        ],
      })
      .mockRejectedValueOnce(new Error('CLIST unavailable'))
      .mockResolvedValueOnce({
        data: [
          {
            title: 'Kaggle Vision Challenge',
            url: 'https://kaggle.com/vision',
            deadline: '2026-05-02T00:00:00.000Z',
            category: 'AI/Data Science',
          },
        ],
      });

    mockUpsertCompetitions
      .mockResolvedValueOnce({ inserted: 1, updated: 0, total: 1 })
      .mockResolvedValueOnce({ inserted: 1, updated: 0, total: 1 });

    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 'log-1' }] })
      .mockResolvedValueOnce({ rows: [{ id: 'log-2' }] })
      .mockResolvedValueOnce({ rows: [{ id: 'log-3' }] });

    const result = await dataSyncService.syncAll();

    expect(mockAxiosGet).toHaveBeenNthCalledWith(3, process.env.KAGGLE_API_URL, {
      timeout: 30000,
      auth: {
        username: 'kaggle-user',
        password: 'kaggle-key',
      },
    });
    expect(result).toEqual({
      results: [
        expect.objectContaining({ source: 'kontests', success: true, processed: 1 }),
        expect.objectContaining({
          source: 'clist',
          success: false,
          processed: 0,
          error: 'CLIST unavailable',
        }),
        expect.objectContaining({ source: 'kaggle', success: true, processed: 1 }),
      ],
      successCount: 2,
      failureCount: 1,
      totalProcessed: 2,
    });
  });
});
