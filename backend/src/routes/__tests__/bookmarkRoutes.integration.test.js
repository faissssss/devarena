import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import request from 'supertest';

const mockCreateBookmark = jest.fn();
const mockDeleteBookmark = jest.fn();
const mockFindBookmarkByCompetition = jest.fn();
const mockListBookmarks = jest.fn();
const mockValidateToken = jest.fn();

jest.unstable_mockModule('../../services/bookmarkService.js', () => ({
  createBookmark: mockCreateBookmark,
  deleteBookmark: mockDeleteBookmark,
  findBookmarkByCompetition: mockFindBookmarkByCompetition,
  listBookmarks: mockListBookmarks,
}));

jest.unstable_mockModule('../../services/authService.js', () => ({
  hashPassword: jest.fn(),
  comparePassword: jest.fn(),
  generateToken: jest.fn(),
  validateToken: mockValidateToken,
  register: jest.fn(),
  login: jest.fn(),
}));

describe('bookmark routes integration', () => {
  let appModule;

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.resetModules();
    process.env.NODE_ENV = 'test';

    mockValidateToken.mockReturnValue({ userId: 'user-1', role: 'user' });
    appModule = await import('../../server.js');
  });

  test('GET /api/bookmarks returns joined bookmarks for the authenticated user', async () => {
    mockListBookmarks.mockResolvedValueOnce([
      {
        id: 'bookmark-1',
        competition_id: 'competition-1',
        competition: { id: 'competition-1', title: 'Vision Challenge' },
      },
    ]);

    const response = await request(appModule.createApp())
      .get('/api/bookmarks')
      .set('Authorization', 'Bearer valid-token');

    expect(response.status).toBe(200);
    expect(response.body.bookmarks).toHaveLength(1);
    expect(mockListBookmarks).toHaveBeenCalledWith('user-1');
  });

  test('POST /api/bookmarks creates a bookmark record', async () => {
    mockCreateBookmark.mockResolvedValueOnce({
      id: 'bookmark-2',
      user_id: 'user-1',
      competition_id: 'competition-2',
    });

    const response = await request(appModule.createApp())
      .post('/api/bookmarks')
      .set('Authorization', 'Bearer valid-token')
      .send({ competition_id: 'competition-2' });

    expect(response.status).toBe(201);
    expect(response.body.bookmark.id).toBe('bookmark-2');
    expect(mockCreateBookmark).toHaveBeenCalledWith('user-1', 'competition-2');
  });

  test('DELETE /api/bookmarks/:id removes a bookmark record', async () => {
    mockDeleteBookmark.mockResolvedValueOnce(true);

    const response = await request(appModule.createApp())
      .delete('/api/bookmarks/bookmark-3')
      .set('Authorization', 'Bearer valid-token');

    expect(response.status).toBe(204);
    expect(mockDeleteBookmark).toHaveBeenCalledWith('user-1', 'bookmark-3');
  });

  test('POST /api/bookmarks returns 409 for duplicate bookmarks', async () => {
    const duplicateError = new Error('Bookmark already exists');
    duplicateError.statusCode = 409;
    mockCreateBookmark.mockRejectedValueOnce(duplicateError);

    const response = await request(appModule.createApp())
      .post('/api/bookmarks')
      .set('Authorization', 'Bearer valid-token')
      .send({ competition_id: 'competition-2' });

    expect(response.status).toBe(409);
    expect(response.body.error.message).toBe('Bookmark already exists');
  });
});
