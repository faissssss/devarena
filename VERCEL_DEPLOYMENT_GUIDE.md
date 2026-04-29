# Vercel Deployment Guide

This guide provides step-by-step instructions for deploying the DevArena platform to Vercel.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Database Setup](#database-setup)
3. [OAuth Provider Configuration](#oauth-provider-configuration)
4. [Vercel Project Setup](#vercel-project-setup)
5. [Environment Variables](#environment-variables)
6. [Deployment](#deployment)
7. [Verification](#verification)
8. [Troubleshooting](#troubleshooting)

## Prerequisites

Before deploying to Vercel, ensure you have:

- A GitHub account with the DevArena repository
- A Vercel account (sign up at https://vercel.com)
- A Supabase PostgreSQL database (or another PostgreSQL provider)
- Google OAuth credentials (Google Cloud Console)
- GitHub OAuth credentials (GitHub Developer Settings)
- CLIST API key (from https://clist.by)

## Database Setup

### Using Supabase PostgreSQL with Connection Pooler

**CRITICAL**: Vercel's serverless architecture requires using Supabase's connection pooler to prevent connection exhaustion.

1. **Get Pooler Connection String**:
   - Go to your Supabase project dashboard
   - Navigate to: Settings → Database → Connection Pooling
   - Copy the **Transaction** pooler connection string
   - Format: `postgresql://user:password@aws-0-us-west-1.pooler.supabase.com:6543/postgres`

2. **Add pgbouncer Parameter**:
   - **CRITICAL**: Add `?pgbouncer=true` to the end of the connection string
   - Final format: `postgresql://user:password@aws-0-us-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true`
   - This parameter is **required** for prepared statements to work correctly

3. **Verify Connection String**:
   - ✅ Port should be **6543** (pooler), NOT 5432 (direct)
   - ✅ Must include `?pgbouncer=true` parameter
   - ❌ Do NOT use direct connection (port 5432) - will cause FATAL error

**Why Connection Pooler?**
- Vercel serverless functions are ephemeral and create new connections frequently
- Direct connections (port 5432) cause connection exhaustion on cold starts
- Pooler (port 6543) manages connections efficiently for serverless

## OAuth Provider Configuration

### Google OAuth Setup

1. **Go to Google Cloud Console**:
   - Navigate to: https://console.cloud.google.com
   - Select your project or create a new one

2. **Configure OAuth Consent Screen**:
   - Go to: APIs & Services → OAuth consent screen
   - Set User Type to "External"
   - Fill in application name, user support email, and developer contact

3. **Create OAuth Credentials**:
   - Go to: APIs & Services → Credentials
   - Click "Create Credentials" → "OAuth client ID"
   - Application type: "Web application"
   - Name: "DevArena Production"

4. **Configure Authorized Origins and Redirect URIs**:
   - Authorized JavaScript origins: `https://your-app.vercel.app`
   - Authorized redirect URIs: `https://your-app.vercel.app/api/auth/oauth/google/callback`
   - Click "Create"

5. **Save Credentials**:
   - Copy the Client ID and Client Secret
   - You'll need these for Vercel environment variables

### GitHub OAuth Setup

1. **Go to GitHub Developer Settings**:
   - Navigate to: https://github.com/settings/developers
   - Click "New OAuth App"

2. **Configure OAuth App**:
   - Application name: "DevArena Production"
   - Homepage URL: `https://your-app.vercel.app`
   - Authorization callback URL: `https://your-app.vercel.app/api/auth/oauth/github/callback`
   - Click "Register application"

3. **Generate Client Secret**:
   - Click "Generate a new client secret"
   - Copy the Client ID and Client Secret
   - You'll need these for Vercel environment variables

## Vercel Project Setup

### 1. Connect GitHub Repository

1. **Log in to Vercel**:
   - Go to: https://vercel.com/dashboard

2. **Import Project**:
   - Click "Add New..." → "Project"
   - Select "Import Git Repository"
   - Choose your DevArena repository
   - Click "Import"

3. **Configure Project**:
   - **Framework Preset**: Vercel auto-detects from vercel.json
   - **Root Directory**: Leave as `.` (project root)
   - **Build Command**: Auto-detected from vercel.json (`npm run vercel-build`)
   - **Output Directory**: Auto-detected from vercel.json (`frontend/dist`)

### 2. Configure Environment Variables

Click "Environment Variables" and add the following:

#### Database Configuration

```bash
DATABASE_URL=postgresql://user:password@aws-0-us-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```
**CRITICAL**: 
- Use pooler URL (port 6543), NOT direct connection (port 5432)
- Must include `?pgbouncer=true` parameter
- Application will throw FATAL error if incorrect

#### JWT Configuration

```bash
JWT_SECRET=<generate-a-32-character-random-string>
JWT_EXPIRES_IN=7d
```
**Tip**: Generate JWT secret using: `openssl rand -hex 32`

#### Server Configuration

```bash
NODE_ENV=production
CORS_ORIGIN=https://your-app.vercel.app
APP_URL=https://your-app.vercel.app
API_URL=https://your-app.vercel.app
```
**Note**: Replace `your-app` with your actual Vercel project name

#### OAuth Configuration

```bash
GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-client-secret>
GITHUB_CLIENT_ID=<your-github-client-id>
GITHUB_CLIENT_SECRET=<your-github-client-secret>
```

#### External API Configuration

```bash
CLIST_API_URL=https://clist.by/api/v2/contest/
CLIST_API_KEY=<your-clist-api-key>
KONTESTS_API_URL=https://kontests.net/api/v1/all
```

#### Cron Job Configuration

```bash
CRON_SECRET=<generate-a-random-secret>
```
**Tip**: Generate cron secret using: `openssl rand -hex 32`

#### Optional: Kaggle Configuration

```bash
KAGGLE_API_KEY=<your-kaggle-api-key>
KAGGLE_USERNAME=<your-kaggle-username>
```

#### Data Sync Configuration (Optional - has defaults)

```bash
SYNC_SCHEDULE=0 */6 * * *
SYNC_TIMEOUT=30000
SYNC_RETRIES=3
LOG_LEVEL=info
```

## Deployment

### Initial Deployment

1. **Click Deploy**:
   - After configuring environment variables, click "Deploy"
   - Vercel will automatically build and deploy your application

2. **Monitor Build Logs**:
   - Watch the build process in real-time
   - Build should complete in 3-5 minutes
   - Look for any errors in the logs

3. **Verify Deployment**:
   - Once deployment completes, Vercel will show "Ready" status
   - Your application will be available at: `https://your-app.vercel.app`

### Subsequent Deployments

- **Automatic**: Push to main branch triggers automatic deployment
- **Manual**: Click "Redeploy" in Vercel dashboard

## Verification

### 1. Health Check

```bash
curl https://your-app.vercel.app/api/health
```

Expected response:
```json
{
  "status": "ok",
  "message": "DevArena API is running",
  "database": {
    "configured": true,
    "connected": true
  }
}
```

### 2. Frontend Access

- Open: https://your-app.vercel.app
- Verify the homepage loads with competition data
- Check browser console for any errors

### 3. OAuth Authentication

**Google OAuth**:
1. Click "Sign in with Google"
2. Verify redirect to Google OAuth consent screen
3. Authorize the application
4. Verify redirect back to DevArena with successful login

**GitHub OAuth**:
1. Click "Sign in with GitHub"
2. Verify redirect to GitHub authorization page
3. Authorize the application
4. Verify redirect back to DevArena with successful login

### 4. Core Functionality

- **User Registration**: Create a new account with email/password
- **User Login**: Log in with email/password
- **Competition Listing**: Browse competitions on homepage
- **Competition Filtering**: Filter by category, platform, status
- **Competition Search**: Search competitions by title
- **Bookmarks**: Create and view bookmarks (requires authentication)

### 5. Cron Job Verification

**Check Logs**:
- Go to Vercel dashboard → Your project → Logs
- Look for: "Scheduled sync started" message
- Frequency: Should appear every 6 hours

**Manual Trigger**:
```bash
curl -X POST https://your-app.vercel.app/api/cron-sync \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

Expected response:
```json
{
  "success": true,
  "message": "Competition data sync completed",
  "result": { ... }
}
```

### 6. Database Connection Stability

- **Monitor for 24 hours**: Check Vercel logs for database connection errors
- **Expected**: No "connection pool exhausted" errors
- **Expected**: No "too many connections" errors from Supabase
- **Expected**: Automatic recovery from temporary network failures

## Troubleshooting

### Build Failures

**Issue**: "Cannot find package 'express'"
- **Cause**: Dependencies not installed correctly
- **Solution**: Verify `vercel-build` script in package.json includes dependency installation

**Issue**: "vite: command not found"
- **Cause**: Frontend dependencies not installed
- **Solution**: Verify build command includes `cd frontend && npm install`

### Database Connection Errors

**Issue**: "FATAL: Direct Supabase connection not allowed"
- **Cause**: Using direct connection (port 5432) instead of pooler
- **Solution**: Change DATABASE_URL to use pooler (port 6543) with `?pgbouncer=true`

**Issue**: "FATAL: Supabase pooler URL must include ?pgbouncer=true"
- **Cause**: Missing pgbouncer parameter
- **Solution**: Add `?pgbouncer=true` to the end of your DATABASE_URL

**Issue**: "Connection pool exhausted"
- **Cause**: Too many concurrent connections
- **Solution**: Verify using pooler URL (port 6543), not direct connection

**Issue**: "too many connections" from Supabase
- **Cause**: Connection pool size too high or not using pooler
- **Solution**: Verify DATABASE_URL uses pooler with pgbouncer=true parameter

### OAuth Errors

**Issue**: "OAuth redirect URI mismatch"
- **Cause**: Redirect URI in OAuth provider doesn't match application
- **Solution**: 
  - Google: Verify redirect URI is `https://your-app.vercel.app/api/auth/oauth/google/callback`
  - GitHub: Verify callback URL is `https://your-app.vercel.app/api/auth/oauth/github/callback`

**Issue**: "OAuth state mismatch"
- **Cause**: Cookie not persisted or CSRF protection issue
- **Solution**: 
  - Verify cookies are enabled in browser
  - Check Vercel logs for cookie-related errors
  - Ensure CORS_ORIGIN matches APP_URL

**Issue**: "Secure cookie not set"
- **Cause**: HTTPS not detected correctly
- **Solution**: Verify `app.set('trust proxy', 1)` is configured in server.js (should already be set)

### CORS Errors

**Issue**: "Origin not allowed by CORS"
- **Cause**: CORS_ORIGIN environment variable not set correctly
- **Solution**: 
  - Verify CORS_ORIGIN=https://your-app.vercel.app
  - Verify APP_URL=https://your-app.vercel.app
  - Redeploy after updating environment variables

**Issue**: "Duplicate CORS headers"
- **Cause**: CORS headers set in both vercel.json and Express
- **Solution**: Verify vercel.json does NOT have "headers" section (should be removed)

### Rate Limiting Issues

**Issue**: "Too many requests" (HTTP 429)
- **Cause**: Rate limit exceeded
- **Solution**: 
  - Wait 15 minutes for rate limit window to reset
  - Check if rate limiting is too strict for your use case

### Deployment Hangs or Fails

**Issue**: Deployment stuck at "Building..."
- **Cause**: Build process taking too long or hanging
- **Solution**: 
  - Check Vercel logs for specific error
  - Verify all dependencies are in correct package.json files
  - Try redeploying

**Issue**: "Function execution timed out"
- **Cause**: Serverless function exceeded 60-second timeout
- **Solution**: 
  - Check for slow database queries
  - Verify database connection is using pooler
  - Check Vercel logs for specific slow operations

## Monitoring and Maintenance

### Set Up External Monitoring

Use a service like UptimeRobot to monitor your application:

1. **Create Monitor**:
   - URL: `https://your-app.vercel.app/api/health`
   - Interval: 5 minutes
   - Alert: Email or SMS on 3 consecutive failures

2. **Monitor Metrics**:
   - Response time (should be < 500ms)
   - Uptime percentage (target: 99.9%)
   - Database connection status

### Review Logs Regularly

- **Access Logs**: Vercel dashboard → Your project → Logs
- **Look for**:
  - Database connection errors
  - OAuth authentication failures
  - Cron job execution logs
  - Application errors and stack traces

### Database Maintenance

- **Backups**: Ensure Supabase automatic backups are enabled
- **Monitoring**: Check Supabase dashboard for database performance
- **Optimization**: Review slow queries and add indexes as needed

### Performance Optimization

- **Monitor Cold Starts**: Check Vercel logs for function initialization time
- **Database Queries**: Optimize slow queries (> 1 second)
- **Connection Pool**: Monitor pool usage in logs

## Advanced Configuration

### Custom Domain

1. **Add Domain in Vercel**:
   - Go to: Project Settings → Domains
   - Add your custom domain
   - Follow DNS configuration instructions

2. **Update Environment Variables**:
   - Update CORS_ORIGIN, APP_URL, API_URL to use custom domain
   - Redeploy application

3. **Update OAuth Providers**:
   - Update Google OAuth redirect URI
   - Update GitHub OAuth callback URL

### Cron Job Schedule

To change the cron job schedule:

1. **Edit vercel.json**:
   ```json
   "crons": [
     {
       "path": "/api/cron-sync",
       "schedule": "0 */6 * * *"
     }
   ]
   ```

2. **Common Schedules**:
   - Every hour: `0 * * * *`
   - Every 6 hours: `0 */6 * * *`
   - Every 12 hours: `0 */12 * * *`
   - Daily at midnight: `0 0 * * *`

3. **Redeploy**: Push changes to trigger redeployment

## Support

For issues not covered in this guide:

- **Vercel Documentation**: https://vercel.com/docs
- **Supabase Documentation**: https://supabase.com/docs
- **DevArena GitHub Issues**: https://github.com/your-org/devarena/issues

## Rollback Plan

If deployment fails or causes issues:

1. **Immediate Rollback**:
   - Go to Vercel dashboard → Deployments
   - Find the last successful deployment
   - Click "..." → "Promote to Production"

2. **Verify Rollback**:
   - Check health endpoint: `https://your-app.vercel.app/api/health`
   - Verify frontend loads correctly
   - Test OAuth authentication

3. **Debug and Redeploy**:
   - Review Vercel logs for error details
   - Fix identified issues locally
   - Test changes locally before redeploying
   - Push to main branch to trigger new deployment

## Conclusion

You've successfully deployed DevArena to Vercel! The platform now benefits from:

- **Serverless architecture** with automatic scaling
- **Optimized database connections** through Supabase pooler
- **Reliable OAuth authentication** with proper cookie handling
- **Automatic deployments** on git push
- **Built-in CDN** for fast static file serving
- **Scheduled cron jobs** for data synchronization

For ongoing maintenance, monitor logs regularly and keep dependencies up to date.

