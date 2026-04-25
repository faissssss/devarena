# Database Setup Quick Start Guide

This guide will help you set up the DevArena PostgreSQL database in under 5 minutes.

## Prerequisites

- PostgreSQL 12 or higher installed
- Node.js 18 or higher installed
- Terminal/Command line access

## Step 1: Install PostgreSQL (if not already installed)

### macOS
```bash
brew install postgresql@15
brew services start postgresql@15
```

### Ubuntu/Debian
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### Windows
Download and install from: https://www.postgresql.org/download/windows/

## Step 2: Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE devarena;

# Create user (optional, for security)
CREATE USER devarena_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE devarena TO devarena_user;

# Exit psql
\q
```

## Step 3: Configure Environment Variables

Create a `.env` file in the `backend` directory:

```bash
cd backend
cp ../.env.example .env
```

Edit `.env` and update the DATABASE_URL:

```env
DATABASE_URL=postgresql://devarena_user:your_secure_password@localhost:5432/devarena
```

Or if using default postgres user:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/devarena
```

## Step 4: Install Dependencies

```bash
cd backend
npm install
```

## Step 5: Run Migrations

### Option A: Using npm script (Recommended)
```bash
npm run migrate
```

### Option B: Using Node.js directly
```bash
node migrations/run-migrations.js
```

### Option C: Using psql manually
```bash
export DATABASE_URL="postgresql://devarena_user:your_secure_password@localhost:5432/devarena"

psql $DATABASE_URL -f migrations/001_create_users_table.sql
psql $DATABASE_URL -f migrations/002_create_competitions_table.sql
psql $DATABASE_URL -f migrations/003_create_bookmarks_table.sql
psql $DATABASE_URL -f migrations/004_create_sync_logs_table.sql
```

## Step 6: Verify Setup

```bash
# Check tables were created
psql $DATABASE_URL -c "\dt"

# Expected output:
#              List of relations
#  Schema |     Name      | Type  |     Owner
# --------+---------------+-------+---------------
#  public | bookmarks     | table | devarena_user
#  public | competitions  | table | devarena_user
#  public | sync_logs     | table | devarena_user
#  public | users         | table | devarena_user
```

## Step 7: Run Tests (Optional)

```bash
# Run migration tests
npm test -- migrations.test.js
```

## Troubleshooting

### Error: "database does not exist"
```bash
# Create the database first
psql -U postgres -c "CREATE DATABASE devarena;"
```

### Error: "password authentication failed"
```bash
# Check your DATABASE_URL in .env file
# Make sure username and password are correct
```

### Error: "connection refused"
```bash
# Make sure PostgreSQL is running
# macOS:
brew services start postgresql@15

# Ubuntu/Debian:
sudo systemctl start postgresql

# Check status:
pg_isready
```

### Error: "permission denied"
```bash
# Grant privileges to your user
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE devarena TO devarena_user;"
```

### Error: "relation already exists"
```bash
# Tables already exist. To reset:
psql $DATABASE_URL -c "DROP TABLE IF EXISTS bookmarks CASCADE;"
psql $DATABASE_URL -c "DROP TABLE IF EXISTS sync_logs CASCADE;"
psql $DATABASE_URL -c "DROP TABLE IF EXISTS competitions CASCADE;"
psql $DATABASE_URL -c "DROP TABLE IF EXISTS users CASCADE;"

# Then run migrations again
npm run migrate
```

## What's Next?

After setting up the database:

1. **Start the backend server**: `npm run dev`
2. **Test the API endpoints**: Use Postman or curl to test endpoints
3. **Implement authentication**: Task 3.x - User authentication service
4. **Set up data sync**: Task 4.x - External API integration
5. **Build frontend**: Connect React frontend to backend API

## Useful Commands

### View table structure
```bash
psql $DATABASE_URL -c "\d users"
psql $DATABASE_URL -c "\d competitions"
psql $DATABASE_URL -c "\d bookmarks"
psql $DATABASE_URL -c "\d sync_logs"
```

### View indexes
```bash
psql $DATABASE_URL -c "\di"
```

### View constraints
```bash
psql $DATABASE_URL -c "SELECT conname, contype FROM pg_constraint WHERE conrelid = 'users'::regclass;"
```

### Count records
```bash
psql $DATABASE_URL -c "SELECT COUNT(*) FROM users;"
psql $DATABASE_URL -c "SELECT COUNT(*) FROM competitions;"
```

### Insert test data
```bash
psql $DATABASE_URL -c "
INSERT INTO users (username, email, password_hash, role)
VALUES ('testuser', 'test@example.com', '\$2b\$10\$abcdefghijklmnopqrstuv', 'user');
"
```

### Clear all data (keep schema)
```bash
psql $DATABASE_URL -c "TRUNCATE users, competitions, bookmarks, sync_logs CASCADE;"
```

### Backup database
```bash
pg_dump $DATABASE_URL > backup.sql
```

### Restore database
```bash
psql $DATABASE_URL < backup.sql
```

## Development Tips

1. **Use a GUI tool**: pgAdmin, DBeaver, or TablePlus for easier database management
2. **Enable query logging**: Add `log_statement = 'all'` to postgresql.conf for debugging
3. **Use transactions**: Wrap multiple operations in BEGIN/COMMIT for data consistency
4. **Monitor performance**: Use EXPLAIN ANALYZE to optimize slow queries
5. **Regular backups**: Set up automated backups for production databases

## Production Considerations

Before deploying to production:

1. **Change default passwords**: Use strong, unique passwords
2. **Enable SSL**: Configure PostgreSQL to require SSL connections
3. **Set up connection pooling**: Use pg-pool or pgBouncer
4. **Configure backups**: Set up automated daily backups
5. **Monitor performance**: Use tools like pg_stat_statements
6. **Restrict access**: Use firewall rules to limit database access
7. **Use environment-specific configs**: Separate .env files for dev/staging/prod

## Support

For issues or questions:
- Check the [README.md](./README.md) for detailed documentation
- Review [SCHEMA_DIAGRAM.md](./SCHEMA_DIAGRAM.md) for database structure
- See [MIGRATION_SUMMARY.md](./MIGRATION_SUMMARY.md) for implementation details
- Refer to the main [design document](../../.kiro/specs/devarena-platform/design.md)
