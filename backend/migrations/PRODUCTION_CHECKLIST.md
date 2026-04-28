# Production Database Migration Checklist

Quick reference checklist for running migrations on production Supabase database.

## Pre-Migration Checklist

- [ ] Node.js 18+ installed
- [ ] Have access to Supabase dashboard
- [ ] Have production DATABASE_URL from `.env.production`
- [ ] (Optional) Backup existing database if it contains data

## Migration Steps

### 1. Run Migrations

Choose one method:

**Method A: Temporary Environment Variable (Recommended)**

```bash
cd backend
npm install
DATABASE_URL="postgresql://postgres:itcampdevarena2026@db.gsjndfnqktnstmfvahcu.supabase.co:5432/postgres" node migrations/run-migrations.js
```

**Method B: Using .env.production**

```bash
cp .env.production backend/.env
cd backend
node migrations/run-migrations.js
# Remember to restore your local .env after!
```

### 2. Verify Migration Success

Expected output:
```
✓ All migrations completed successfully!
✓ Table 'users' exists
✓ Table 'competitions' exists
✓ Table 'bookmarks' exists
✓ Table 'sync_logs' exists
```

### 3. Run Verification Script

```bash
DATABASE_URL="postgresql://postgres:itcampdevarena2026@db.gsjndfnqktnstmfvahcu.supabase.co:5432/postgres" node backend/migrations/verify-production-db.js
```

This will check:
- Database connection
- All tables exist
- Data exists in competitions table
- Database configuration
- Indexes are created

## Post-Migration Verification

### In Supabase Dashboard

1. Log in to https://supabase.com/dashboard
2. Select project: `gsjndfnqktnstmfvahcu`
3. Go to **Table Editor**
4. Verify tables exist:
   - [ ] `users`
   - [ ] `competitions`
   - [ ] `bookmarks`
   - [ ] `sync_logs`
   - [ ] `user_oauth_accounts`

### Check Data

In Supabase **SQL Editor**, run:

```sql
-- Check competitions count
SELECT COUNT(*) FROM competitions;
-- Expected: 519 records (after data sync)

-- Check sample data
SELECT title, platform, category FROM competitions LIMIT 5;
```

### Enable Connection Pooling

1. In Supabase dashboard: **Settings** → **Database**
2. Verify **Connection Pooling** is **Enabled**
3. Note the connection pooling URL (optional but recommended for Vercel)

## Vercel Configuration

### Update Environment Variables

1. Go to Vercel dashboard: https://vercel.com/dashboard
2. Select project: `devarena-rust`
3. Go to **Settings** → **Environment Variables**
4. Verify these are set:
   - [ ] `DATABASE_URL` (Supabase connection string)
   - [ ] `JWT_SECRET`
   - [ ] `CORS_ORIGIN`
   - [ ] `APP_URL`
   - [ ] `API_URL`
   - [ ] `GOOGLE_CLIENT_ID`
   - [ ] `GOOGLE_CLIENT_SECRET`
   - [ ] `GITHUB_CLIENT_ID`
   - [ ] `GITHUB_CLIENT_SECRET`
   - [ ] `CLIST_API_KEY`
   - [ ] `CLIST_USERNAME`
   - [ ] `KAGGLE_API_KEY`
   - [ ] `KAGGLE_USERNAME`

### Redeploy

After setting environment variables:
- [ ] Trigger a new deployment (push to main branch or manual redeploy)
- [ ] Wait for deployment to complete
- [ ] Check Vercel function logs for errors

## Data Sync (If Competitions Table is Empty)

If `SELECT COUNT(*) FROM competitions` returns 0:

**Option A: Use Admin Endpoint**
```
Visit: https://devarena-rust.vercel.app/api/admin/sync
```

**Option B: Run Sync Script**
```bash
DATABASE_URL="postgresql://postgres:itcampdevarena2026@db.gsjndfnqktnstmfvahcu.supabase.co:5432/postgres" node backend/scripts/trigger-sync.js
```

Wait 1-2 minutes for sync to complete, then verify:
```sql
SELECT COUNT(*) FROM competitions;
-- Should show ~519 records
```

## Final Testing

Test the three bug fixes on Vercel production:

1. **Competition List**
   - [ ] Visit: https://devarena-rust.vercel.app/home
   - [ ] Verify competitions display in Featured/Newest/Popular sections

2. **OAuth Authentication**
   - [ ] Click "Continue with Google"
   - [ ] Verify redirect to Google OAuth consent page (not black screen)

3. **Email Registration**
   - [ ] Submit registration form
   - [ ] Verify user account created (not 405 error)

## Troubleshooting

### Migrations Fail

**Error: "relation already exists"**
- Tables already exist (this is fine!)
- Verify tables in Supabase dashboard

**Error: "connection refused"**
- Check DATABASE_URL is correct
- Verify Supabase project is active
- Try connection pooling URL

**Error: "password authentication failed"**
- Reset database password in Supabase dashboard
- Update DATABASE_URL in `.env.production` and Vercel

### Competitions Table Empty

- Run data sync (see "Data Sync" section above)
- Check sync logs: `SELECT * FROM sync_logs ORDER BY synced_at DESC LIMIT 5;`

### Vercel Functions Still Fail

- Verify DATABASE_URL is set in Vercel environment variables
- Redeploy after setting environment variables
- Check Vercel function logs for errors
- Ensure connection pooling is enabled in Supabase

## Support Resources

- **Full Guide**: `backend/migrations/PRODUCTION_MIGRATION_GUIDE.md`
- **Migration README**: `backend/migrations/README.md`
- **Bugfix Design**: `.kiro/specs/vercel-deployment-bugs/design.md`
- **Supabase Dashboard**: https://supabase.com/dashboard
- **Vercel Dashboard**: https://vercel.com/dashboard

## Success Criteria

✓ All 5 tables exist in Supabase
✓ Competitions table has data (519 records)
✓ Connection pooling enabled
✓ DATABASE_URL set in Vercel
✓ Vercel deployment successful
✓ API endpoints return data (not empty/405 errors)
✓ OAuth redirects work correctly
✓ Email registration works

---

**Note**: This checklist is for Task 3.3 of the vercel-deployment-bugs bugfix spec. Your local development database remains unchanged.
