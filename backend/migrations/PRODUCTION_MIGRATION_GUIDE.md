# Production Database Migration Guide

## Overview

This guide walks you through running database migrations on your production Supabase database for the DevArena platform. Follow these steps carefully to ensure your production database is properly set up with all required tables and data.

## Prerequisites

- Node.js 18 or higher installed
- Access to your Supabase project dashboard
- Production database URL from `.env.production`
- Terminal/Command line access

## Important Notes

⚠️ **CRITICAL**: This guide is for production database setup. Your local development database will remain unchanged.

⚠️ **BACKUP**: Before running migrations on production, ensure you have a backup of your database (if it contains any data).

## Step 1: Verify Database Connection

Your production database URL from `.env.production`:
```
postgresql://postgres:itcampdevarena2026@db.gsjndfnqktnstmfvahcu.supabase.co:5432/postgres
```

### Test Connection

1. Open your terminal
2. Navigate to the project root directory
3. Test the connection:

```bash
# On macOS/Linux:
export DATABASE_URL="postgresql://postgres:itcampdevarena2026@db.gsjndfnqktnstmfvahcu.supabase.co:5432/postgres"

# On Windows (PowerShell):
$env:DATABASE_URL="postgresql://postgres:itcampdevarena2026@db.gsjndfnqktnstmfvahcu.supabase.co:5432/postgres"

# Test connection (requires psql installed):
psql $DATABASE_URL -c "SELECT NOW();"
```

If you don't have `psql` installed, you can skip this test and proceed to Step 2.

## Step 2: Run Migrations Using Node.js Script

The easiest way to run migrations is using the provided Node.js script.

### Option A: Using Temporary Environment Variable (Recommended)

This method doesn't modify your `.env` file:

```bash
# Navigate to backend directory
cd backend

# Install dependencies if not already installed
npm install

# Run migrations with production DATABASE_URL
# On macOS/Linux:
DATABASE_URL="postgresql://postgres:itcampdevarena2026@db.gsjndfnqktnstmfvahcu.supabase.co:5432/postgres" node migrations/run-migrations.js

# On Windows (PowerShell):
$env:DATABASE_URL="postgresql://postgres:itcampdevarena2026@db.gsjndfnqktnstmfvahcu.supabase.co:5432/postgres"; node migrations/run-migrations.js
```

### Option B: Using .env.production File

1. Temporarily copy `.env.production` to `.env` in the backend directory:

```bash
# From project root
cp .env.production backend/.env

# Navigate to backend
cd backend

# Run migrations
node migrations/run-migrations.js

# IMPORTANT: Restore your local .env after migrations
# (Copy your local .env back or delete the production one)
```

### Expected Output

You should see output similar to:

```
Starting database migrations...

✓ Database connection successful

Found 6 migration file(s):

Running migration: 001_create_users_table.sql
✓ Successfully executed: 001_create_users_table.sql

Running migration: 002_create_competitions_table.sql
✓ Successfully executed: 002_create_competitions_table.sql

Running migration: 003_create_bookmarks_table.sql
✓ Successfully executed: 003_create_bookmarks_table.sql

Running migration: 004_create_sync_logs_table.sql
✓ Successfully executed: 004_create_sync_logs_table.sql

Running migration: 005_update_category_constraint.sql
✓ Successfully executed: 005_update_category_constraint.sql

Running migration: 006_add_oauth_accounts.sql
✓ Successfully executed: 006_add_oauth_accounts.sql

Migration Summary:
  Total: 6
  Successful: 6
  Failed: 0

✓ All migrations completed successfully!

Verifying database schema...

✓ Table 'users' exists
✓ Table 'competitions' exists
✓ Table 'bookmarks' exists
✓ Table 'sync_logs' exists
```

## Step 3: Verify Tables in Supabase Dashboard

1. Log in to your Supabase dashboard: https://supabase.com/dashboard
2. Navigate to your project: `gsjndfnqktnstmfvahcu`
3. Go to **Table Editor** in the left sidebar
4. Verify the following tables exist:
   - `users`
   - `competitions`
   - `bookmarks`
   - `sync_logs`
   - `oauth_accounts`

## Step 4: Verify Data Exists

After migrations, you need to ensure the `competitions` table has data. The design document mentions there should be 519 records.

### Check Competition Count

Using Supabase SQL Editor:

1. In Supabase dashboard, go to **SQL Editor**
2. Run this query:

```sql
SELECT COUNT(*) FROM competitions;
```

Expected result: Should show 519 records (or 0 if data hasn't been synced yet)

### If No Data Exists

If the competitions table is empty, you need to trigger a data sync:

1. **Option A: Use the Admin Sync Endpoint**
   - After deploying to Vercel, visit: `https://devarena-rust.vercel.app/api/admin/sync`
   - This will trigger a full data sync from external APIs (CTFtime, Kaggle, Clist)

2. **Option B: Run Local Sync Script**
   ```bash
   # From backend directory
   DATABASE_URL="postgresql://postgres:itcampdevarena2026@db.gsjndfnqktnstmfvahcu.supabase.co:5432/postgres" node scripts/trigger-sync.js
   ```

## Step 5: Verify Database Accessibility from Vercel

Supabase databases are accessible from anywhere by default, but you should verify connection pooling is enabled for optimal performance with Vercel's serverless functions.

### Enable Connection Pooling in Supabase

1. In Supabase dashboard, go to **Settings** → **Database**
2. Scroll to **Connection Pooling** section
3. Verify **Connection Pooling** is **Enabled**
4. Note the **Connection Pooling URL** (it should look like):
   ```
   postgresql://postgres.gsjndfnqktnstmfvahcu:itcampdevarena2026@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
   ```

### Update DATABASE_URL in Vercel (Optional but Recommended)

For better performance with serverless functions, use the connection pooling URL:

1. Go to Vercel dashboard: https://vercel.com/dashboard
2. Select your project: `devarena-rust`
3. Go to **Settings** → **Environment Variables**
4. Find `DATABASE_URL` and update it to the **Connection Pooling URL** (if different)
5. Redeploy your application for changes to take effect

## Step 6: Verify Vercel Environment Variables

Ensure all required environment variables are set in Vercel:

1. Go to Vercel dashboard → Your project → **Settings** → **Environment Variables**
2. Verify these variables are set:
   - `DATABASE_URL` (should match your Supabase connection string)
   - `JWT_SECRET`
   - `CORS_ORIGIN`
   - `APP_URL`
   - `API_URL`
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `GITHUB_CLIENT_ID`
   - `GITHUB_CLIENT_SECRET`
   - `CLIST_API_KEY`
   - `CLIST_USERNAME`
   - `KAGGLE_API_KEY`
   - `KAGGLE_USERNAME`

## Troubleshooting

### Error: "connection refused" or "timeout"

**Cause**: Supabase database may not be accessible or connection string is incorrect.

**Solution**:
1. Verify the database URL is correct in `.env.production`
2. Check Supabase project status in dashboard
3. Ensure your IP is not blocked (Supabase free tier allows all IPs by default)
4. Try using the connection pooling URL instead

### Error: "relation already exists"

**Cause**: Tables already exist in the database.

**Solution**: This is actually fine! It means migrations were already run. You can verify tables exist in Supabase dashboard.

If you need to re-run migrations (e.g., after schema changes):
1. Drop existing tables in Supabase SQL Editor:
   ```sql
   DROP TABLE IF EXISTS oauth_accounts CASCADE;
   DROP TABLE IF EXISTS bookmarks CASCADE;
   DROP TABLE IF EXISTS sync_logs CASCADE;
   DROP TABLE IF EXISTS competitions CASCADE;
   DROP TABLE IF EXISTS users CASCADE;
   ```
2. Re-run the migration script

### Error: "password authentication failed"

**Cause**: Incorrect database password in connection string.

**Solution**:
1. Go to Supabase dashboard → **Settings** → **Database**
2. Reset database password if needed
3. Update `DATABASE_URL` in `.env.production` and Vercel environment variables

### Competitions Table is Empty

**Cause**: Data hasn't been synced yet.

**Solution**:
1. Trigger a data sync using the admin endpoint or sync script (see Step 4)
2. Wait for sync to complete (may take 1-2 minutes)
3. Verify data exists: `SELECT COUNT(*) FROM competitions;`

### Vercel Functions Still Return Empty Results

**Cause**: Environment variables not set correctly in Vercel or database not accessible.

**Solution**:
1. Verify `DATABASE_URL` is set in Vercel environment variables
2. Redeploy your application after setting environment variables
3. Check Vercel function logs for database connection errors
4. Ensure connection pooling is enabled in Supabase

## Post-Migration Checklist

After completing migrations, verify:

- [ ] All 5 tables exist in Supabase: `users`, `competitions`, `bookmarks`, `sync_logs`, `oauth_accounts`
- [ ] Competitions table has data (519 records expected after sync)
- [ ] Connection pooling is enabled in Supabase
- [ ] `DATABASE_URL` is set correctly in Vercel environment variables
- [ ] Vercel deployment is using the latest environment variables (redeploy if needed)
- [ ] Test API endpoints on Vercel:
  - [ ] `https://devarena-rust.vercel.app/api/competitions` returns competitions
  - [ ] `https://devarena-rust.vercel.app/api/auth/oauth/google` redirects to Google
  - [ ] `https://devarena-rust.vercel.app/api/auth/register` accepts POST requests

## Next Steps

After migrations are complete:

1. **Deploy to Vercel**: Push your code changes to trigger a deployment
2. **Test Bug Fixes**: Verify all three bugs are fixed:
   - Competition list displays on home page
   - OAuth redirects work correctly
   - Email registration accepts POST requests
3. **Monitor Logs**: Check Vercel function logs for any errors
4. **Run Property Tests**: Execute the bug condition and preservation tests

## Support

If you encounter issues:
- Check Supabase dashboard for database status and logs
- Check Vercel function logs for runtime errors
- Review the [README.md](./README.md) for detailed documentation
- Refer to the [bugfix design document](../../.kiro/specs/vercel-deployment-bugs/design.md)

## Security Notes

⚠️ **IMPORTANT**: 
- Never commit `.env.production` to Git (it's already in `.gitignore`)
- Keep database credentials secure
- Use environment variables in Vercel dashboard for production secrets
- Rotate database password periodically
- Monitor database access logs in Supabase dashboard
