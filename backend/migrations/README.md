# Database Migrations

This directory contains SQL migration files for the DevArena PostgreSQL database schema.

## Migration Files

The migrations are numbered sequentially and should be executed in order:

1. **001_create_users_table.sql** - User authentication and authorization table
2. **002_create_competitions_table.sql** - Competition data aggregation table
3. **003_create_bookmarks_table.sql** - User bookmarks with foreign key relationships
4. **004_create_sync_logs_table.sql** - Synchronization audit log table

## Running Migrations

### Prerequisites

- PostgreSQL 12 or higher installed
- Database created (e.g., `devarena`)
- Database connection details in `.env` file

### Manual Execution

To run all migrations manually using `psql`:

```bash
# Set your database connection details
export DATABASE_URL="postgresql://username:password@localhost:5432/devarena"

# Run each migration in order
psql $DATABASE_URL -f backend/migrations/001_create_users_table.sql
psql $DATABASE_URL -f backend/migrations/002_create_competitions_table.sql
psql $DATABASE_URL -f backend/migrations/003_create_bookmarks_table.sql
psql $DATABASE_URL -f backend/migrations/004_create_sync_logs_table.sql
```

### Using a Single Command

Run all migrations at once:

```bash
for file in backend/migrations/*.sql; do
  psql $DATABASE_URL -f "$file"
done
```

### Verification

After running migrations, verify the schema:

```bash
psql $DATABASE_URL -c "\dt"  # List all tables
psql $DATABASE_URL -c "\d users"  # Describe users table
psql $DATABASE_URL -c "\d competitions"  # Describe competitions table
psql $DATABASE_URL -c "\d bookmarks"  # Describe bookmarks table
psql $DATABASE_URL -c "\d sync_logs"  # Describe sync_logs table
```

## Schema Overview

### Tables

- **users**: User accounts with authentication credentials and role-based access control
- **competitions**: Competition data aggregated from multiple external APIs
- **bookmarks**: User bookmarks linking users to competitions (with cascade delete)
- **sync_logs**: Audit log of data synchronization operations

### Indexes

All tables include appropriate indexes for efficient querying:

- **users**: Indexes on email and username for authentication lookups
- **competitions**: Indexes on category, status, start_date, end_date, and source for filtering
- **bookmarks**: Indexes on user_id and competition_id for relationship queries
- **sync_logs**: Indexes on synced_at and source for audit log queries

### Constraints

- **Foreign Keys**: Bookmarks table has foreign keys to users and competitions with CASCADE DELETE
- **Unique Constraints**: 
  - Users: username and email must be unique
  - Competitions: (title, platform, start_date) must be unique
  - Bookmarks: (user_id, competition_id) must be unique
- **Check Constraints**: Validation for roles, categories, statuses, dates, and email format

## Requirements Mapping

These migrations satisfy the following requirements from the design document:

- **Requirement 10.1**: PostgreSQL as database management system
- **Requirement 10.2**: Users table schema
- **Requirement 10.3**: Competitions table schema
- **Requirement 10.4**: Bookmarks table schema
- **Requirement 10.5**: Sync_logs table schema
- **Requirement 10.6**: Foreign key constraints on bookmarks
- **Requirement 10.7**: Foreign key constraints on bookmarks
- **Requirement 10.8**: Index on competitions.category
- **Requirement 10.9**: Index on competitions.status
- **Requirement 10.10**: Index on competitions.start_date

## Rollback

To drop all tables (WARNING: This will delete all data):

```bash
psql $DATABASE_URL -c "DROP TABLE IF EXISTS bookmarks CASCADE;"
psql $DATABASE_URL -c "DROP TABLE IF EXISTS sync_logs CASCADE;"
psql $DATABASE_URL -c "DROP TABLE IF EXISTS competitions CASCADE;"
psql $DATABASE_URL -c "DROP TABLE IF EXISTS users CASCADE;"
```

## Future Migrations

When adding new migrations:

1. Create a new file with the next sequential number (e.g., `005_add_new_feature.sql`)
2. Include descriptive comments about the migration purpose
3. Reference relevant requirements from the design document
4. Update this README with the new migration details
