import { beforeEach, describe, expect, jest, test } from '@jest/globals';

const mockQuery = jest.fn();

jest.unstable_mockModule('../../utils/db.js', () => ({
  query: mockQuery,
}));

describe('competitionService', () => {
  let competitionService;

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.resetModules();
    competitionService = await import('../competitionService.js');
  });

  test('updateCompetitionStatus returns upcoming/ongoing/ended correctly', () => {
    const now = new Date('2026-04-25T12:00:00.000Z');

    expect(
      competitionService.updateCompetitionStatus(
        {
          start_date: '2026-04-26T12:00:00.000Z',
          end_date: '2026-04-27T12:00:00.000Z',
        },
        now
      )
    ).toBe('upcoming');

    expect(
      competitionService.updateCompetitionStatus(
        {
          start_date: '2026-04-25T11:00:00.000Z',
          end_date: '2026-04-26T12:00:00.000Z',
        },
        now
      )
    ).toBe('ongoing');

    expect(
      competitionService.updateCompetitionStatus(
        {
          start_date: '2026-04-20T11:00:00.000Z',
          end_date: '2026-04-25T12:00:00.000Z',
        },
        now
      )
    ).toBe('ended');
  });

  test('upsertCompetitions inserts new competitions', async () => {
    mockQuery
      .mockResolvedValueOnce({ rowCount: 0, rows: [] })
      .mockResolvedValueOnce({ rowCount: 1, rows: [] });

    const result = await competitionService.upsertCompetitions([
      {
        title: 'New Contest',
        description: null,
        category: 'Competitive Programming',
        platform: 'Codeforces',
        url: 'https://example.com',
        start_date: '2026-05-01T00:00:00.000Z',
        end_date: '2026-05-02T00:00:00.000Z',
        location: 'Online',
        prize: null,
        difficulty: null,
        source: 'kontests',
      },
    ]);

    expect(result).toEqual({ inserted: 1, updated: 0, total: 1 });
    expect(mockQuery).toHaveBeenCalledTimes(2);
    expect(mockQuery.mock.calls[1][0]).toContain('ON CONFLICT');
  });

  test('upsertCompetitions updates existing competitions', async () => {
    mockQuery
      .mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 'existing-1' }] })
      .mockResolvedValueOnce({ rowCount: 1, rows: [] });

    const result = await competitionService.upsertCompetitions([
      {
        title: 'Existing Contest',
        description: 'updated',
        category: 'Competitive Programming',
        platform: 'Codeforces',
        url: 'https://example.com',
        start_date: '2026-05-01T00:00:00.000Z',
        end_date: '2026-05-02T00:00:00.000Z',
        location: 'Online',
        prize: null,
        difficulty: null,
        source: 'kontests',
      },
    ]);

    expect(result).toEqual({ inserted: 0, updated: 1, total: 1 });
  });
});
