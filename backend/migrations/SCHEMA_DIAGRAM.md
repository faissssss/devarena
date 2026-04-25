# Database Schema Diagram

## Entity Relationship Diagram

```
┌─────────────────────────────────────────┐
│              USERS                      │
├─────────────────────────────────────────┤
│ PK  id              UUID                │
│ UQ  username        VARCHAR(50)         │
│ UQ  email           VARCHAR(255)        │
│     password_hash   VARCHAR(255)        │
│     role            VARCHAR(20)         │
│     created_at      TIMESTAMP           │
└─────────────────────────────────────────┘
                    │
                    │ 1
                    │
                    │
                    │ N
┌─────────────────────────────────────────┐
│            BOOKMARKS                    │
├─────────────────────────────────────────┤
│ PK  id              UUID                │
│ FK  user_id         UUID                │ ──┐
│ FK  competition_id  UUID                │   │
│     created_at      TIMESTAMP           │   │
│                                         │   │
│ UQ (user_id, competition_id)           │   │
│ CASCADE DELETE on both FKs             │   │
└─────────────────────────────────────────┘   │
                    │                         │
                    │ N                       │
                    │                         │
                    │ 1                       │
                    │                         │
┌─────────────────────────────────────────┐   │
│          COMPETITIONS                   │   │
├─────────────────────────────────────────┤   │
│ PK  id              UUID                │ ◄─┘
│     title           VARCHAR(255)        │
│     description     TEXT                │
│     category        VARCHAR(50)         │
│     platform        VARCHAR(100)        │
│     url             VARCHAR(500)        │
│     start_date      TIMESTAMP           │
│     end_date        TIMESTAMP           │
│     status          VARCHAR(20)         │
│     location        VARCHAR(100)        │
│     prize           VARCHAR(100)        │
│     difficulty      VARCHAR(20)         │
│     source          VARCHAR(50)         │
│     created_at      TIMESTAMP           │
│     updated_at      TIMESTAMP           │
│                                         │
│ UQ (title, platform, start_date)       │
└─────────────────────────────────────────┘


┌─────────────────────────────────────────┐
│            SYNC_LOGS                    │
├─────────────────────────────────────────┤
│ PK  id              UUID                │
│     source          VARCHAR(50)         │
│     status          VARCHAR(20)         │
│     record_count    INTEGER             │
│     error_message   TEXT                │
│     synced_at       TIMESTAMP           │
└─────────────────────────────────────────┘
```

## Relationships

### Users ↔ Bookmarks (One-to-Many)
- One user can have many bookmarks
- Each bookmark belongs to exactly one user
- **Cascade Delete**: When a user is deleted, all their bookmarks are automatically deleted

### Competitions ↔ Bookmarks (One-to-Many)
- One competition can be bookmarked by many users
- Each bookmark references exactly one competition
- **Cascade Delete**: When a competition is deleted, all bookmarks referencing it are automatically deleted

### Sync Logs (Independent)
- No foreign key relationships
- Tracks synchronization operations from external APIs
- Used for audit and monitoring purposes

## Key Constraints

### Users Table
- **Primary Key**: id (UUID)
- **Unique**: username, email
- **Check**: role IN ('user', 'admin')
- **Check**: email matches valid email regex
- **Check**: username length between 3 and 50 characters

### Competitions Table
- **Primary Key**: id (UUID)
- **Unique**: (title, platform, start_date) - prevents duplicate competitions
- **Check**: category IN ('Competitive Programming', 'Hackathons', 'AI/Data Science', 'CTF/Security')
- **Check**: status IN ('upcoming', 'ongoing', 'ended')
- **Check**: end_date > start_date
- **Check**: source IN ('kontests', 'clist', 'kaggle')

### Bookmarks Table
- **Primary Key**: id (UUID)
- **Foreign Key**: user_id → users(id) ON DELETE CASCADE
- **Foreign Key**: competition_id → competitions(id) ON DELETE CASCADE
- **Unique**: (user_id, competition_id) - prevents duplicate bookmarks

### Sync Logs Table
- **Primary Key**: id (UUID)
- **Check**: status IN ('success', 'error', 'partial')
- **Check**: source IN ('kontests', 'clist', 'kaggle')
- **Check**: record_count >= 0

## Indexes

### Users Table
```sql
idx_users_email          ON users(email)
idx_users_username       ON users(username)
```

### Competitions Table
```sql
idx_competitions_category              ON competitions(category)
idx_competitions_status                ON competitions(status)
idx_competitions_start_date            ON competitions(start_date)
idx_competitions_end_date              ON competitions(end_date)
idx_competitions_source                ON competitions(source)
idx_competitions_category_status       ON competitions(category, status)
idx_competitions_title                 ON competitions USING gin(to_tsvector('english', title))
```

### Bookmarks Table
```sql
idx_bookmarks_user_id                  ON bookmarks(user_id)
idx_bookmarks_competition_id           ON bookmarks(competition_id)
idx_bookmarks_user_competition         ON bookmarks(user_id, competition_id)
```

### Sync Logs Table
```sql
idx_sync_logs_synced_at                ON sync_logs(synced_at DESC)
idx_sync_logs_source                   ON sync_logs(source)
idx_sync_logs_status                   ON sync_logs(status)
idx_sync_logs_source_synced_at         ON sync_logs(source, synced_at DESC)
```

## Data Flow

### User Registration Flow
1. User submits registration form
2. Backend hashes password with bcrypt
3. Insert into `users` table with role='user'
4. Return user object (without password_hash)

### Competition Sync Flow
1. Scheduler triggers data sync every 6 hours
2. Fetch data from external APIs (Kontests, CLIST, Kaggle)
3. Parse and normalize competition data
4. Upsert into `competitions` table (update if exists, insert if new)
5. Create entry in `sync_logs` table with results

### Bookmark Creation Flow
1. Authenticated user requests to bookmark a competition
2. Validate JWT token to get user_id
3. Insert into `bookmarks` table with (user_id, competition_id)
4. Unique constraint prevents duplicates
5. Return bookmark object with competition details

### Cascade Delete Example
```
User deleted → All bookmarks for that user automatically deleted
Competition deleted → All bookmarks for that competition automatically deleted
```

## Query Patterns

### Common Queries

**Get user's bookmarked competitions:**
```sql
SELECT c.* 
FROM competitions c
JOIN bookmarks b ON c.id = b.competition_id
WHERE b.user_id = $1
ORDER BY c.start_date ASC;
```
*Uses indexes: idx_bookmarks_user_id, idx_competitions_start_date*

**Filter competitions by category and status:**
```sql
SELECT * FROM competitions
WHERE category = $1 AND status = $2
ORDER BY start_date ASC;
```
*Uses index: idx_competitions_category_status*

**Get upcoming competitions ending within 7 days:**
```sql
SELECT * FROM competitions
WHERE status = 'upcoming'
  AND end_date BETWEEN NOW() AND NOW() + INTERVAL '7 days'
ORDER BY end_date ASC;
```
*Uses indexes: idx_competitions_status, idx_competitions_end_date*

**Get recent sync logs:**
```sql
SELECT * FROM sync_logs
ORDER BY synced_at DESC
LIMIT 50;
```
*Uses index: idx_sync_logs_synced_at*

**Search competitions by title:**
```sql
SELECT * FROM competitions
WHERE to_tsvector('english', title) @@ to_tsquery('english', $1);
```
*Uses index: idx_competitions_title (GIN index)*

## Performance Considerations

1. **Indexes on Foreign Keys**: Both foreign keys in bookmarks table are indexed for efficient joins
2. **Composite Indexes**: Category + Status index optimizes common filter combinations
3. **Descending Index**: Sync logs synced_at index is DESC for recent-first queries
4. **Full-Text Search**: GIN index on competition title enables fast text search
5. **Unique Constraints**: Prevent duplicate data and serve as implicit indexes
6. **Cascade Deletes**: Handled at database level for data integrity and performance

## Scalability Notes

- UUID primary keys allow for distributed ID generation
- Indexes support efficient filtering and sorting at scale
- Cascade deletes prevent orphaned records
- Unique constraints prevent data duplication
- Check constraints ensure data validity at database level
