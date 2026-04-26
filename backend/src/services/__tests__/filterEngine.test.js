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

  test('buildDateRangeFilter creates correct SQL for date range', () => {
    const params = [];
    const sql = filterEngine.buildDateRangeFilter('2024-03-01', '2024-03-31', params);
    
    expect(sql).toBe(
      '((start_date BETWEEN $1 AND $2) OR (end_date BETWEEN $1 AND $2) OR (start_date <= $1 AND end_date >= $2))'
    );
    expect(params).toEqual(['2024-03-01', '2024-03-31']);
  });

  test('buildDateRangeFilter handles existing params correctly', () => {
    const params = ['existing-param'];
    const sql = filterEngine.buildDateRangeFilter('2024-03-01', '2024-03-31', params);
    
    expect(sql).toBe(
      '((start_date BETWEEN $2 AND $3) OR (end_date BETWEEN $2 AND $3) OR (start_date <= $2 AND end_date >= $3))'
    );
    expect(params).toEqual(['existing-param', '2024-03-01', '2024-03-31']);
  });

  test('buildSingleDateFilter creates correct SQL for single date', () => {
    const params = [];
    const sql = filterEngine.buildSingleDateFilter('2024-03-15', params);
    
    expect(sql).toBe('(start_date <= $1 AND end_date >= $1)');
    expect(params).toEqual(['2024-03-15']);
  });

  test('buildSingleDateFilter handles existing params correctly', () => {
    const params = ['existing-param'];
    const sql = filterEngine.buildSingleDateFilter('2024-03-15', params);
    
    expect(sql).toBe('(start_date <= $2 AND end_date >= $2)');
    expect(params).toEqual(['existing-param', '2024-03-15']);
  });

  test('buildFilterQuery includes single date filter when singleDate is provided', () => {
    const result = filterEngine.buildFilterQuery({ singleDate: '2024-03-15' });
    
    expect(result.whereClause).toContain('start_date <= $');
    expect(result.whereClause).toContain('end_date >= $');
    expect(result.params).toContain('2024-03-15');
  });

  test('buildFilterQuery includes date range filter when startDate and endDate are provided', () => {
    const result = filterEngine.buildFilterQuery({ 
      startDate: '2024-03-01', 
      endDate: '2024-03-31' 
    });
    
    expect(result.whereClause).toContain('start_date BETWEEN');
    expect(result.whereClause).toContain('end_date BETWEEN');
    expect(result.params).toContain('2024-03-01');
    expect(result.params).toContain('2024-03-31');
  });

  test('buildFilterQuery prioritizes singleDate over date range', () => {
    const result = filterEngine.buildFilterQuery({ 
      singleDate: '2024-03-15',
      startDate: '2024-03-01', 
      endDate: '2024-03-31' 
    });
    
    // Should use singleDate filter, not date range
    expect(result.whereClause).toContain('start_date <= $');
    expect(result.whereClause).toContain('end_date >= $');
    expect(result.whereClause).not.toContain('BETWEEN');
    expect(result.params).toContain('2024-03-15');
    expect(result.params).not.toContain('2024-03-01');
  });

  test('buildFilterQuery combines date filter with other filters', () => {
    const result = filterEngine.buildFilterQuery({ 
      category: 'Hackathons',
      status: 'upcoming',
      singleDate: '2024-03-15'
    });
    
    expect(result.whereClause).toContain('category = $');
    expect(result.whereClause).toContain('status = $');
    expect(result.whereClause).toContain('start_date <= $');
    expect(result.whereClause).toContain('end_date >= $');
    expect(result.params).toEqual(
      expect.arrayContaining(['Hackathons', 'upcoming', '2024-03-15'])
    );
  });
});
