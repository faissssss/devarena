import { beforeEach, describe, expect, jest, test } from '@jest/globals';

const mockQuery = jest.fn();

jest.unstable_mockModule('../../utils/db.js', () => ({
  query: mockQuery,
}));

describe('filterEngine', () => {
  let filterEngine;

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.resetModules();
    filterEngine = await import('../filterEngine.js');
  });

  test('buildFilterQuery returns all competitions when no filters are provided', () => {
    expect(filterEngine.buildFilterQuery()).toEqual({
      whereClause: '',
      params: [],
    });
  });

  test('buildFilterQuery handles a single filter', () => {
    expect(filterEngine.buildFilterQuery({ category: 'AI/Data Science' })).toEqual({
      whereClause: 'WHERE category = $1',
      params: ['AI/Data Science'],
    });
  });

  test('buildFilterQuery combines multiple filters with AND logic', () => {
    const result = filterEngine.buildFilterQuery({
      category: 'AI/Data Science',
      status: 'upcoming',
      source: 'kaggle',
    });

    expect(result.whereClause).toBe(
      'WHERE category = $1 AND status = $2 AND source = $3'
    );
    expect(result.params).toEqual([
      'AI/Data Science',
      'upcoming',
      'kaggle',
    ]);
  });

  test('buildFilterQuery adds case-insensitive search conditions', () => {
    const result = filterEngine.buildFilterQuery({ search: 'vision' });
    expect(result.whereClause).toContain('title ILIKE $1');
    expect(result.whereClause).toContain("COALESCE(description, '') ILIKE $1");
    expect(result.params).toEqual(['%vision%']);
  });

  test('executeFilter applies pagination and returns metadata', async () => {
    mockQuery
      .mockResolvedValueOnce({
        rows: [{ id: 'comp-1', title: 'Test Competition' }],
      })
      .mockResolvedValueOnce({
        rows: [{ count: 25 }],
      });

    const result = await filterEngine.executeFilter({ page: 2, limit: 10 });

    expect(mockQuery).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('LIMIT $1 OFFSET $2'),
      [10, 10]
    );
    expect(result).toEqual({
      competitions: [{ id: 'comp-1', title: 'Test Competition' }],
      totalCount: 25,
      totalPages: 3,
      page: 2,
      limit: 10,
    });
  });
});
