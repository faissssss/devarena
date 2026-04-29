# Render Deployment Guide

This guide provides step-by-step instructions for deploying the DevArena platform to Render.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Database Setup](#database-setup)
3. [OAuth Provider Configuration](#oauth-provider-configuration)
4. [Render Project Setup](#render-project-setup)
5. [Environment Variables](#environment-variables)
6. [Deployment](#deployment)
7. [Verification](#verification)
8. [Troubleshooting](#troubleshooting)

## Prerequisites

Before deploying to Render, ensure you have:

- A GitHub account with the DevArena repository
- A Render account (sign up at https://render.com)
- A Supabase PostgreSQL database (or another PostgreSQL provider)
- Google OAuth credentials (Google Cloud Console)
- GitHub OAuth credentials (GitHub Developer Settings)
- CLIST API key (from https://clist.by)

## Database Setup

### Using Supabase PostgreSQL

1. **Get Database Connection String**:
   - Go to your Supabase project dashboard
   - Navigate to: Settings → Database → Connection string → URI mode
   - Copy the connection string (format: `postgresql://user:password@db.<project>.supabase.co:5432/postgres`)
   - **IMPORTANT**: Use the direct connection (port 5432), NOT the pooler URL (port 6543)
   - Render's persistent container uses direct connections, not pooling

2. **Verify Database Access**:
   - Test the connection string locally before deploying
   - Ensure your database allows connections from Render's IP addresses

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
   - Authorized JavaScript origins: `https://devarena.onrender.com`
   - Authorized redirect URIs: `https://devarena.onrender.com/api/auth/oauth/google/callback`
   - Click "Create"

5. **Save Credentials**:
   - Copy the Client ID and Client Secret
   - You'll need these for Render environment variables

### GitHub OAuth Setup

1. **Go to GitHub Developer Settings**:
   - Navigate to: https://github.com/settings/developers
   - Click "New OAuth App"

2. **Configure OAuth App**:
   - Application name: "DevArena Production"
   - Homepage URL: `https://devarena.onrender.com`
   - Authorization callback URL: `https://devarena.onrender.com/api/auth/oauth/github/callback`
   - Click "Register application"

3. **Generate Client Secret**:
   - Click "Generate a new client secret"
   - Copy the Client ID and Client Secret
   - You'll need these for Render environment variables

## Render Project Setup

### 1. Create Render Web Service

1. **Log in to Render**:
   - Go to: https://dashboard.render.com

2. **Create New Web Service**:
   - Click "New +" → "Web Service"
   - Connect your GitHub account if not already connected
   - Select the DevArena repository
   - Click "Connect"

3. **Configure Web Service**:
   - **Name**: `devarena` (or your preferred name)
   - **Region**: Choose the region closest to your users
   - **Branch**: `main` (or your production branch)
   - **Root Directory**: Leave empty (project root)
   - **Environment**: `Node`
   - **Build Command**: `npm run install:all && cd frontend && npm run build`
   - **Start Command**: `cd backend && node scripts/startup.js`
   - **Plan**: Choose your preferred plan (Free tier available)

4. **Advanced Settings**:
   - **Health Check Path**: `/api/health`
   - **Auto-Deploy**: Enable (deploys automatically on git push)

### 2. Configure Environment Variables

In the Render dashboard, go to your web service → Environment tab, and add the following environment variables:

#### Database Configuration

```bash
DATABASE_URL=postgresql://user:password@db.<project>.supabase.co:5432/postgres
```
**Note**: Use your Supabase connection string (direct connection, port 5432)

#### JWT Configuration

```bash
JWT_SECRET=<generate-a-32-character-random-string>
JWT_EXPIRES_IN=7d
```
**Tip**: Generate a secure JWT secret using: `openssl rand -base64 32`

#### Server Configuration

```bash
NODE_ENV=production
CORS_ORIGIN=https://devarena.onrender.com
APP_URL=https://devarena.onrender.com
API_URL=https://devarena.onrender.com
```
**Note**: Do NOT manually set PORT - Render auto-injects this

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

#### Data Sync Configuration

```bash
SYNC_SCHEDULE=0 */6 * * *
SYNC_TIMEOUT=30000
SYNC_RETRIES=3
```

#### Logging Configuration

```bash
LOG_LEVEL=info
```

## Deployment

### Initial Deployment

1. **Trigger Deployment**:
   - After configuring environment variables, Render will automatically trigger a deployment
   - Alternatively, click "Manual Deploy" → "Deploy latest commit"

2. **Monitor Build Logs**:
   - Go to: Logs tab in your Render dashboard
   - Watch for build progress and any errors
   - Build process should complete in 3-5 minutes

3. **Verify Deployment**:
   - Once deployment completes, Render will show "Live" status
   - Your application will be available at: `https://devarena.onrender.com`

### Subsequent Deployments

- **Automatic**: Push to main branch triggers automatic deployment
- **Manual**: Click "Manual Deploy" in Render dashboard

## Verification

### 1. Health Check

```bash
curl https://devarena.onrender.com/api/health
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

- Open: https://devarena.onrender.com
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

- **Check Logs**: Go to Render dashboard → Logs tab
- **Look for**: "Scheduled sync started" message
- **Frequency**: Should appear every 6 hours
- **Manual Trigger**: Use admin endpoint `/api/admin/sync` (requires admin role)

### 6. Database Connection Stability

- **Monitor for 24 hours**: Check Render logs for database connection errors
- **Expected**: No connection pool exhaustion errors
- **Expected**: Automatic recovery from temporary network failures

## Troubleshooting

### Build Failures

**Issue**: "Cannot find package 'express'"
- **Cause**: Dependencies not installed correctly
- **Solution**: Verify build command includes `npm run install:all`

**Issue**: "vite: command not found"
- **Cause**: Frontend dependencies not installed
- **Solution**: Verify build command includes `cd frontend && npm run build`

### Database Connection Errors

**Issue**: "Connection refused" or "ECONNREFUSED"
- **Cause**: Incorrect DATABASE_URL or database not accessible
- **Solution**: 
  - Verify DATABASE_URL is correct (direct connection, port 5432)
  - Check Supabase dashboard for database status
  - Ensure database allows connections from Render's IP addresses

**Issue**: "Connection pool exhausted"
- **Cause**: Too many concurrent connections
- **Solution**: 
  - Verify connection pool max is set to 20 (default in db.js)
  - Check for connection leaks in application code

### OAuth Errors

**Issue**: "OAuth redirect URI mismatch"
- **Cause**: Redirect URI in OAuth provider doesn't match application
- **Solution**: 
  - Verify Google OAuth redirect URI: `https://devarena.onrender.com/api/auth/oauth/google/callback`
  - Verify GitHub OAuth callback URL: `https://devarena.onrender.com/api/auth/oauth/github/callback`

**Issue**: "OAuth state mismatch"
- **Cause**: Cookie not persisted or CSRF protection issue
- **Solution**: 
  - Verify cookies are enabled in browser
  - Check Render logs for cookie-related errors
  - Ensure CORS_ORIGIN matches APP_URL

### CORS Errors

**Issue**: "Origin not allowed by CORS"
- **Cause**: CORS_ORIGIN environment variable not set correctly
- **Solution**: 
  - Verify CORS_ORIGIN=https://devarena.onrender.com
  - Verify APP_URL=https://devarena.onrender.com
  - Restart Render service after updating environment variables

### Rate Limiting Issues

**Issue**: "Too many requests" (HTTP 429)
- **Cause**: Rate limit exceeded
- **Solution**: 
  - Wait 15 minutes for rate limit window to reset
  - Check if rate limiting is too strict for your use case
  - Adjust rate limits in `backend/src/middleware/security.js` if needed

### Deployment Hangs or Fails

**Issue**: Deployment stuck at "Building..."
- **Cause**: Build process taking too long or hanging
- **Solution**: 
  - Check Render logs for specific error
  - Verify all dependencies are in correct package.json files
  - Try manual deploy with "Clear build cache & deploy"

**Issue**: "Health check failed"
- **Cause**: Application not responding on expected port
- **Solution**: 
  - Verify start command: `cd backend && node scripts/startup.js`
  - Verify health check path: `/api/health`
  - Check Render logs for startup errors

## Monitoring and Maintenance

### Set Up External Monitoring

Use a service like UptimeRobot to monitor your application:

1. **Create Monitor**:
   - URL: `https://devarena.onrender.com/api/health`
   - Interval: 5 minutes
   - Alert: Email or SMS on 3 consecutive failures

2. **Monitor Metrics**:
   - Response time (should be < 500ms)
   - Uptime percentage (target: 99.9%)
   - Database connection status

### Review Logs Regularly

- **Access Logs**: Render dashboard → Logs tab
- **Look for**:
  - Database connection errors
  - OAuth authentication failures
  - Cron job execution logs
  - Application errors and stack traces

### Database Maintenance

- **Backups**: Ensure Supabase automatic backups are enabled
- **Monitoring**: Check Supabase dashboard for database performance
- **Optimization**: Review slow queries and add indexes as needed

## Support

For issues not covered in this guide:

- **Render Documentation**: https://render.com/docs
- **Supabase Documentation**: https://supabase.com/docs
- **DevArena GitHub Issues**: https://github.com/your-org/devarena/issues

## Rollback Plan

If deployment fails or causes issues:

1. **Immediate Rollback**:
   - Go to Render dashboard → Deploys tab
   - Click "Rollback" on the last successful deployment

2. **Verify Rollback**:
   - Check health endpoint: `https://devarena.onrender.com/api/health`
   - Verify frontend loads correctly
   - Test OAuth authentication

3. **Debug and Redeploy**:
   - Review Render logs for error details
   - Fix identified issues locally
   - Test changes locally before redeploying
   - Push to main branch to trigger new deployment

## Conclusion

You've successfully deployed DevArena to Render! The platform now benefits from:

- **Stable database connections** through Render's persistent container
- **Reliable OAuth authentication** with consistent routing
- **Simplified build process** with straightforward dependency installation
- **Automatic deployments** on git push
- **Built-in health monitoring** with Render's health checks

For ongoing maintenance, monitor logs regularly and keep dependencies up to date.
