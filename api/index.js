/**
 * Vercel Serverless Function Entry Point
 * 
 * This file serves as the main entry point for all API routes on Vercel.
 * It imports the Express app and wraps it for serverless execution.
 */

import app from '../backend/src/server.js';

/**
 * Vercel serverless function handler
 * Vercel automatically wraps Express apps when exported as default
 */
export default app;
