import app from '../backend/api/index.js';

// Comprehensive logging for Vercel serverless function diagnostics
// This is the single entrypoint for all /api/* requests on Vercel
// Explicit routing through this function ensures deterministic API behavior
export default async function handler(req, res) {
  const startTime = Date.now();
  
  // Log incoming request details
  console.log('=== Vercel Serverless Function Invoked ===');
  console.log('[API ROUTING] Catch-all function handling request');
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log(`Method: ${req.method}`);
  console.log(`Original URL: ${req.url}`);
  console.log(`Original Path: ${req.path || 'N/A'}`);
  console.log(`Headers:`, JSON.stringify({
    host: req.headers.host,
    'user-agent': req.headers['user-agent'],
    'content-type': req.headers['content-type'],
    origin: req.headers.origin,
    referer: req.headers.referer,
    cookie: req.headers.cookie ? '[PRESENT]' : '[ABSENT]',
    'x-forwarded-host': req.headers['x-forwarded-host'],
    'x-forwarded-proto': req.headers['x-forwarded-proto'],
  }, null, 2));
  
  // Log environment variables (without sensitive values)
  console.log('Environment Variables:');
  console.log(`NODE_ENV: ${process.env.NODE_ENV || '[NOT SET]'}`);
  console.log(`VERCEL: ${process.env.VERCEL || '[NOT SET]'}`);
  console.log(`DATABASE_URL: ${process.env.DATABASE_URL ? '[SET - ' + process.env.DATABASE_URL.substring(0, 20) + '...]' : '[NOT SET]'}`);
  console.log(`CORS_ORIGIN: ${process.env.CORS_ORIGIN || '[NOT SET]'}`);
  console.log(`APP_URL: ${process.env.APP_URL || '[NOT SET]'}`);
  console.log(`API_URL: ${process.env.API_URL || '[NOT SET]'}`);
  console.log(`JWT_SECRET: ${process.env.JWT_SECRET ? '[SET]' : '[NOT SET]'}`);
  console.log(`GOOGLE_CLIENT_ID: ${process.env.GOOGLE_CLIENT_ID ? '[SET]' : '[NOT SET]'}`);
  console.log(`GOOGLE_CLIENT_SECRET: ${process.env.GOOGLE_CLIENT_SECRET ? '[SET]' : '[NOT SET]'}`);
  console.log(`GITHUB_CLIENT_ID: ${process.env.GITHUB_CLIENT_ID ? '[SET]' : '[NOT SET]'}`);
  console.log(`GITHUB_CLIENT_SECRET: ${process.env.GITHUB_CLIENT_SECRET ? '[SET]' : '[NOT SET]'}`);
  
  try {
    // Log database connection attempt
    console.log('Attempting to handle request with Express app...');
    
    // CRITICAL FIX: Vercel strips /api prefix in the rewrite, but Express app expects it
    // The rewrite "/api/:path*" -> "/api/[...path]" means the function receives the path WITHOUT /api
    // But our Express app has routes mounted at /api, so we need to prepend it back
    // Example: Request to /api/auth/oauth/google -> Function receives /auth/oauth/google -> Need to restore to /api/auth/oauth/google
    if (!req.url.startsWith('/api')) {
      console.log(`[API ROUTING] Prepending /api to URL: ${req.url} -> /api${req.url}`);
      req.url = `/api${req.url}`;
    }
    
    // Call the Express app
    await new Promise((resolve, reject) => {
      // Capture response to log it
      const originalSend = res.send;
      const originalJson = res.json;
      const originalRedirect = res.redirect;
      const originalStatus = res.status;
      
      let statusCode = 200;
      let responseBody = null;
      
      res.status = function(code) {
        statusCode = code;
        return originalStatus.call(this, code);
      };
      
      res.send = function(body) {
        responseBody = body;
        console.log(`Response Status: ${statusCode}`);
        console.log(`Response Body: ${typeof body === 'string' ? body.substring(0, 200) : JSON.stringify(body).substring(0, 200)}...`);
        console.log(`Request Duration: ${Date.now() - startTime}ms`);
        console.log('=== Request Completed Successfully ===\n');
        resolve();
        return originalSend.call(this, body);
      };
      
      res.json = function(body) {
        responseBody = body;
        console.log(`Response Status: ${statusCode}`);
        console.log(`Response JSON: ${JSON.stringify(body).substring(0, 200)}...`);
        console.log(`Request Duration: ${Date.now() - startTime}ms`);
        console.log('=== Request Completed Successfully ===\n');
        resolve();
        return originalJson.call(this, body);
      };
      
      res.redirect = function(statusOrUrl, url) {
        const redirectUrl = url || statusOrUrl;
        const redirectStatus = url ? statusOrUrl : 302;
        console.log(`Response: Redirect ${redirectStatus} to ${redirectUrl}`);
        console.log(`Request Duration: ${Date.now() - startTime}ms`);
        console.log('=== Request Completed with Redirect ===\n');
        resolve();
        return originalRedirect.call(this, statusOrUrl, url);
      };
      
      // Handle the request
      app(req, res, (err) => {
        if (err) {
          reject(err);
        }
      });
    });
    
  } catch (error) {
    // Log errors with full stack traces
    console.error('=== ERROR in Serverless Function ===');
    console.error(`Error Message: ${error.message}`);
    console.error(`Error Stack:`);
    console.error(error.stack);
    console.error(`Request Duration: ${Date.now() - startTime}ms`);
    console.error('=== Error Details End ===\n');
    
    // Return error response if not already sent
    if (!res.headersSent) {
      res.status(500).json({
        error: {
          code: 'SERVERLESS_FUNCTION_ERROR',
          message: error.message,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }
      });
    }
  }
}
