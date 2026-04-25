# DevArena API

Base URL: `http://localhost:3000/api`

## Health

`GET /health`

Returns:

```json
{
  "status": "ok",
  "message": "DevArena API is running"
}
```

## Authentication

`POST /auth/register`

Request:

```json
{
  "username": "devuser",
  "email": "devuser@example.com",
  "password": "super-secret-password"
}
```

`POST /auth/login`

Request:

```json
{
  "email": "devuser@example.com",
  "password": "super-secret-password"
}
```

Response:

```json
{
  "token": "jwt-token",
  "user": {
    "id": "uuid",
    "username": "devuser",
    "email": "devuser@example.com",
    "role": "user",
    "created_at": "2026-04-25T00:00:00.000Z"
  }
}
```

## Competitions

`GET /competitions`

Query params:

- `category`
- `status`
- `location`
- `deadline`
- `prize`
- `difficulty`
- `source`
- `search`
- `page`
- `limit`

`GET /competitions/:id`

Returns one competition object.

## Bookmarks

Requires `Authorization: Bearer <token>`.

`GET /bookmarks`

Returns the authenticated user's bookmarks with embedded competition data.

`POST /bookmarks`

Request:

```json
{
  "competition_id": "competition-uuid"
}
```

`DELETE /bookmarks/:id`

Deletes one bookmark owned by the authenticated user.

## User Profile

Requires authentication.

`GET /users/me`

Returns:

```json
{
  "user": {
    "id": "uuid",
    "username": "devuser",
    "email": "devuser@example.com",
    "role": "user",
    "created_at": "2026-04-25T00:00:00.000Z"
  },
  "stats": {
    "bookmarkCount": 3
  }
}
```

`PUT /users/me`

Supports profile updates:

```json
{
  "username": "new-name",
  "email": "new@example.com"
}
```

Supports password updates:

```json
{
  "currentPassword": "old-password",
  "newPassword": "new-password-123"
}
```

## Admin

Requires an authenticated admin token.

`POST /admin/sync`

Triggers manual synchronization across all sources.

`GET /admin/sync-logs`

Supports `page` and `limit`.

`GET /admin/stats`

Returns platform stats plus a paginated competition list for admin management.

`PUT /admin/competitions/:id`

Updates a competition while preserving its original source.

`DELETE /admin/competitions/:id`

Deletes a competition and any cascading bookmarks.

## Error Shape

Most error responses follow:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message"
  }
}
```
