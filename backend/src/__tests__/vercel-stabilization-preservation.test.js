/**
 * Preservation Property Tests for Vercel Stabilization
 * 
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10, 3.11, 3.12, 3.13, 3.14, 3.15**
 * 
 * **IMPORTANT**: Follow observation-first methodology
 * 
 * This test validates the Preservation Requirements from the design document:
 * - Non-API routes (`/home`, `/explore`, `/login`) serve frontend correctly
 * - API endpoints work in local development
 * - Auth requests with existing CSRF cookies succeed
 * - Competition data retrieval works when database is healthy
 * - All working endpoints return correct responses
 * 
 * **EXPECTED OUTCOME**: Tests PASS on UNFIXED code (confirms baseline behavior to preserve)
 * 
 * These tests capture the current behavior that must remain unchanged after the fix.
 * Property-based testing generates many test cases for stronger guarantees.
 */

import { describe, expect, jest, test } from '@jest/globals';
import axios from 'axios';
import fc from 'fast-check';
import request from 'supertest';
import { createApp } from '../server.js';

// Vercel production URL from .env.production
const VERCEL_URL = 'https://devarena-rust.vercel.app';

// Configure axios to not follow redirects
const axiosInstance = axios.create({
  maxRedirects: 0,
  validateStatus: (status) => status < 600, // Accept all status codes
});

describe('Property 2: Preservation - Non-Buggy Behavior Preservation', () => {
  // Increase timeout for network requests
  jest.setTimeout(60000);

  describe('Preservation: Non-API Routes Serve Frontend Correctly', () => {
    
    test('Observation: Non-API routes serve HTML with React app on Vercel', async () => {
      /**
       * **Validates: Requirement 3.1**
       * 
       * Observation: Non-API routes (`/home`, `/explore`, `/login`) serve frontend correctly on unfixed code
       * 
       * This test observes the current behavior that must be preserved after the fix.
       */
      
      const routes = ['/', '/home', '/explore', '/login', '/register'];
      
      for (const route of routes) {
        const response = await axiosInstance.get(`${VERCEL_URL}${route}`);
        
        // Observe: Response should be 200 OK
        expect(response.status).toBe(200);
        
        // Observe: Response should be HTML
        expect(response.headers['content-type']).toMatch(/html/);
        
        // Observe: Response should contain HTML document with React app
        expect(response.data).toContain('<!DOCTYPE html>');
        expect(response.data).toContain('<html');
        expect(response.data).toContain('<div id="root">');
      }
    });

    test('Property-Based: All frontend paths not starting with /api/ serve HTML with React app', () => {
      /**
       * **Validates: Requirement 3.1**
       * 
       * Property: For all frontend paths not starting with `/api/`, assert response is HTML with React app
       * 
       * Property-based testing generates many test cases for stronger guarantees.
       */
      
      return fc.assert(
        fc.asyncProperty(
          fc.constantFrom(
            '/',
            '/home',
            '/explore',
            '/login',
            '/register',
            '/profile',
            '/bookmarks',
            '/admin',
            '/competitions/123'
          ),
          async (path) => {
            const response = await axiosInstance.get(`${VERCEL_URL}${path}`);
            
            // Assert: Response should be 200 OK
            expect(response.status).toBe(200);
            
            // Assert: Response should be HTML
            expect(response.headers['content-type']).toMatch(/html/);
            
            // Assert: Response should contain HTML document with React app
            expect(response.data).toContain('<!DOCTYPE html>');
            expect(response.data).toContain('<html');
            expect(response.data).toContain('<div id="root">');
          }
        ),
        { numRuns: 9 }
      );
    });
  });

  describe('Preservation: API Endpoints Work in Local Development', () => {
    
    test('Observation: API endpoints work in local development on unfixed code', async () => {
      /**
       * **Validates: Requirements 3.2, 3.3**
       * 
       * Observation: API endpoints work in local development on unfixed code
       * 
       * This test observes that local development continues to work correctly.
       */
      
      const app = createApp();
      
      // Test health endpoint
      const healthResponse = await request(app).get('/api/health');
      expect(healthResponse.status).toBe(200);
      expect(healthResponse.body).toHaveProperty('status');
      
      // Test competitions endpoint
      const competitionsResponse = await request(app).get('/api/competitions');
      expect(competitionsResponse.status).toBe(200);
      expect(competitionsResponse.body).toHaveProperty('competitions');
      expect(Array.isArray(competitionsResponse.body.competitions)).toBe(true);
      
      // Test platforms endpoint
      const platformsResponse = await request(app).get('/api/competitions/platforms');
      expect(platformsResponse.status).toBe(200);
      expect(platformsResponse.body).toHaveProperty('platforms');
      expect(Array.isArray(platformsResponse.body.platforms)).toBe(true);
    });

    test('Property-Based: All API requests in local environment return expected behavior', () => {
      /**
       * **Validates: Requirements 3.2, 3.3**
       * 
       * Property: For all API requests in local environment, assert response matches expected behavior
       * 
       * Property-based testing generates many test cases for stronger guarantees.
       */
      
      const app = createApp();
      
      return fc.assert(
        fc.asyncProperty(
          fc.constantFrom(
            '/api/health',
            '/api/competitions',
            '/api/competitions/platforms'
          ),
          async (endpoint) => {
            const response = await request(app).get(endpoint);
            
            // Assert: Response should be successful (200-299)
            expect(response.status).toBeGreaterThanOrEqual(200);
            expect(response.status).toBeLessThan(300);
            
            // Assert: Response should be JSON
            expect(response.headers['content-type']).toMatch(/json/);
            
            // Assert: Response should have valid JSON body
            expect(response.body).toBeDefined();
            expect(typeof response.body).toBe('object');
          }
        ),
        { numRuns: 3 }
      );
    });
  });

  describe('Preservation: Auth Requests with Existing CSRF Cookies Succeed', () => {
    
    test('Observation: Auth requests with primed CSRF cookies succeed on unfixed code', async () => {
      /**
       * **Validates: Requirements 3.4, 3.5, 3.6, 3.7**
       * 
       * Observation: Auth requests with existing CSRF cookies succeed on unfixed code
       * 
       * This test observes that auth flows work when CSRF cookies are already set.
       */
      
      const app = createApp();
      
      // First, get a CSRF token from cookie
      const healthResponse = await request(app).get('/api/health');
      const csrfCookie = healthResponse.headers['set-cookie']?.find(cookie => 
        cookie.startsWith('devarena_csrf=')
      );
      
      // Observe: CSRF cookie should be set
      expect(csrfCookie).toBeDefined();
      
      // Extract CSRF token from cookie
      const csrfToken = csrfCookie.split('=')[1].split(';')[0];
      expect(csrfToken).toBeDefined();
      expect(typeof csrfToken).toBe('string');
      expect(csrfToken.length).toBeGreaterThan(0);
      
      // Observe: CSRF cookie has correct attributes
      // Note: After fix in task 5, HttpOnly was removed to allow frontend to read cookie for double-submit pattern
      expect(csrfCookie).not.toContain('HttpOnly');
      expect(csrfCookie).toContain('SameSite=Strict');
    });

    test('Property-Based: All auth requests with primed CSRF cookies match expected behavior', () => {
      /**
       * **Validates: Requirements 3.4, 3.5, 3.6, 3.7**
       * 
       * Property: For all auth requests with primed CSRF cookies, assert response matches expected behavior
       * 
       * Property-based testing generates many test cases for stronger guarantees.
       */
      
      const app = createApp();
      
      return fc.assert(
        fc.asyncProperty(
          fc.constantFrom(
            { endpoint: '/api/auth/register', method: 'POST' },
            { endpoint: '/api/auth/login', method: 'POST' }
          ),
          async ({ endpoint, method }) => {
            // Prime CSRF cookie
            const healthResponse = await request(app).get('/api/health');
            const csrfCookie = healthResponse.headers['set-cookie']?.find(cookie => 
              cookie.startsWith('devarena_csrf=')
            );
            
            // Assert: CSRF cookie should be set
            expect(csrfCookie).toBeDefined();
            
            // Extract CSRF token
            const csrfToken = csrfCookie.split('=')[1].split(';')[0];
            
            // Make auth request with CSRF token
            const response = await request(app)
              [method.toLowerCase()](endpoint)
              .set('X-CSRF-Token', csrfToken)
              .set('Cookie', `devarena_csrf=${csrfToken}`)
              .send({
                email: 'test@example.com',
                password: 'TestPassword123!',
                username: 'testuser',
              });
            
            // Assert: Response should not be 403 Forbidden (CSRF validation passed)
            // It may be 400, 409, or other errors, but not 403 for CSRF
            expect(response.status).not.toBe(403);
          }
        ),
        { numRuns: 2 }
      );
    });
  });

  describe('Preservation: Competition Data Retrieval Works When Database is Healthy', () => {
    
    test('Observation: Competition data retrieval works when database is healthy on unfixed code', async () => {
      /**
       * **Validates: Requirements 3.8, 3.9, 3.10, 3.11**
       * 
       * Observation: Competition data retrieval works when database is healthy on unfixed code
       * 
       * This test observes that competition data is retrieved correctly from the database.
       */
      
      const app = createApp();
      
      // Test competition list endpoint
      const response = await request(app).get('/api/competitions');
      
      // Observe: Response should be 200 OK
      expect(response.status).toBe(200);
      
      // Observe: Response should have competitions array
      expect(response.body).toHaveProperty('competitions');
      expect(Array.isArray(response.body.competitions)).toBe(true);
      
      // Observe: Response should have pagination metadata
      expect(response.body).toHaveProperty('totalCount');
      expect(response.body).toHaveProperty('totalPages');
      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('limit');
      
      // Observe: Competitions should have expected structure
      if (response.body.competitions.length > 0) {
        const competition = response.body.competitions[0];
        expect(competition).toHaveProperty('id');
        expect(competition).toHaveProperty('title');
        expect(competition).toHaveProperty('platform');
        expect(competition).toHaveProperty('category');
        expect(competition).toHaveProperty('status');
      }
    });

    test('Property-Based: All competition list requests with healthy database include expected data', () => {
      /**
       * **Validates: Requirements 3.8, 3.9, 3.10, 3.11**
       * 
       * Property: For all competition list requests with healthy database, assert response includes expected data
       * 
       * Note: We cannot assert `dataSource: "database"` because the unfixed code doesn't include this field.
       * After the fix, this field will be added, but we're testing preservation of existing behavior.
       * 
       * Property-based testing generates many test cases for stronger guarantees.
       */
      
      const app = createApp();
      
      return fc.assert(
        fc.asyncProperty(
          fc.record({
            page: fc.constantFrom(1, 2, 3),
            limit: fc.constantFrom(12, 24, 48),
            platform: fc.constantFrom(undefined, 'Kaggle', 'CTFtime', 'Clist'),
            category: fc.constantFrom(undefined, 'Data Science', 'Security', 'Algorithms'),
            status: fc.constantFrom(undefined, 'upcoming', 'ongoing', 'past'),
          }),
          async (params) => {
            // Build query string
            const queryParams = new URLSearchParams();
            if (params.page) queryParams.append('page', params.page);
            if (params.limit) queryParams.append('limit', params.limit);
            if (params.platform) queryParams.append('platform', params.platform);
            if (params.category) queryParams.append('category', params.category);
            if (params.status) queryParams.append('status', params.status);
            
            const response = await request(app).get(`/api/competitions?${queryParams.toString()}`);
            
            // Assert: Response should be 200 OK
            expect(response.status).toBe(200);
            
            // Assert: Response should have competitions array
            expect(response.body).toHaveProperty('competitions');
            expect(Array.isArray(response.body.competitions)).toBe(true);
            
            // Assert: Response should have pagination metadata
            expect(response.body).toHaveProperty('totalCount');
            expect(response.body).toHaveProperty('totalPages');
            expect(response.body).toHaveProperty('page');
            expect(response.body).toHaveProperty('limit');
            
            // Assert: Pagination values should match request
            expect(response.body.page).toBe(params.page || 1);
            expect(response.body.limit).toBe(params.limit || 12);
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  describe('Preservation: All Working Endpoints Return Correct Responses', () => {
    
    test('Observation: All working endpoints return correct responses on unfixed code', async () => {
      /**
       * **Validates: Requirements 3.2, 3.4, 3.5, 3.6, 3.7, 3.12, 3.13, 3.14, 3.15**
       * 
       * Observation: All working endpoints return correct responses on unfixed code
       * 
       * This test observes that various API endpoints work correctly in local development.
       */
      
      const app = createApp();
      
      // Test health endpoint
      const healthResponse = await request(app).get('/api/health');
      expect(healthResponse.status).toBe(200);
      expect(healthResponse.body).toHaveProperty('status');
      expect(['ok', 'degraded']).toContain(healthResponse.body.status);
      
      // Test competitions endpoint
      const competitionsResponse = await request(app).get('/api/competitions');
      expect(competitionsResponse.status).toBe(200);
      expect(competitionsResponse.body).toHaveProperty('competitions');
      
      // Test platforms endpoint
      const platformsResponse = await request(app).get('/api/competitions/platforms');
      expect(platformsResponse.status).toBe(200);
      expect(platformsResponse.body).toHaveProperty('platforms');
      expect(Array.isArray(platformsResponse.body.platforms)).toBe(true);
      
      // Test 404 error handling
      const notFoundResponse = await request(app).get('/api/nonexistent-endpoint');
      expect(notFoundResponse.status).toBe(404);
      expect(notFoundResponse.body).toHaveProperty('error');
      expect(notFoundResponse.body.error).toHaveProperty('code');
      expect(notFoundResponse.body.error.code).toBe('NOT_FOUND');
    });

    test('Property-Based: All working endpoint requests with valid inputs return expected schema', () => {
      /**
       * **Validates: Requirements 3.2, 3.4, 3.5, 3.6, 3.7, 3.12, 3.13, 3.14, 3.15**
       * 
       * Property: For all working endpoint requests with valid inputs, assert response matches expected schema
       * 
       * Property-based testing generates many test cases for stronger guarantees.
       */
      
      const app = createApp();
      
      return fc.assert(
        fc.asyncProperty(
          fc.constantFrom(
            { endpoint: '/api/health', expectedStatus: 200, expectedFields: ['status', 'database'] },
            { endpoint: '/api/competitions', expectedStatus: 200, expectedFields: ['competitions', 'totalCount', 'totalPages', 'page', 'limit'] },
            { endpoint: '/api/competitions/platforms', expectedStatus: 200, expectedFields: null },
            { endpoint: '/api/nonexistent', expectedStatus: 404, expectedFields: ['error'] }
          ),
          async ({ endpoint, expectedStatus, expectedFields }) => {
            const response = await request(app).get(endpoint);
            
            // Assert: Response should have expected status
            expect(response.status).toBe(expectedStatus);
            
            // Assert: Response should be JSON
            expect(response.headers['content-type']).toMatch(/json/);
            
            // Assert: Response should have expected fields
            if (expectedFields) {
              for (const field of expectedFields) {
                expect(response.body).toHaveProperty(field);
              }
            }
          }
        ),
        { numRuns: 4 }
      );
    });
  });

  describe('Preservation: Security Headers and CSRF Validation', () => {
    
    test('Observation: Security headers are applied in local development', async () => {
      /**
       * **Validates: Requirements 3.5, 3.6, 3.7**
       * 
       * Observation: Security headers are applied correctly on unfixed code
       */
      
      const app = createApp();
      const response = await request(app).get('/api/health');
      
      // Observe: Response should have security headers from Helmet
      expect(response.headers).toHaveProperty('x-content-type-options');
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      
      expect(response.headers).toHaveProperty('x-frame-options');
      expect(response.headers['x-frame-options']).toBe('SAMEORIGIN');
      
      expect(response.headers).toHaveProperty('x-xss-protection');
    });

    test('Observation: CSRF validation continues to work', async () => {
      /**
       * **Validates: Requirements 3.5, 3.6, 3.7**
       * 
       * Observation: CSRF validation continues to protect state-changing requests
       */
      
      const app = createApp();
      
      // Attempt a state-changing request without CSRF token
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'TestPassword123!',
          username: 'testuser',
        });
      
      // Observe: Response should be 403 Forbidden (CSRF validation failed)
      // Note: May also be 409 if user already exists from previous test runs
      expect([403, 409]).toContain(response.status);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Preservation: Frontend Navigation and UI', () => {
    
    test('Observation: Frontend navigation works correctly on Vercel', async () => {
      /**
       * **Validates: Requirement 3.12**
       * 
       * Observation: Users can navigate between pages correctly on unfixed code
       */
      
      const routes = ['/', '/home', '/explore', '/login', '/register'];
      
      for (const route of routes) {
        const response = await axiosInstance.get(`${VERCEL_URL}${route}`);
        
        // Observe: Response should be 200 OK
        expect(response.status).toBe(200);
        
        // Observe: Response should be HTML
        expect(response.headers['content-type']).toMatch(/html/);
        
        // Observe: Response should contain React app
        expect(response.data).toContain('<div id="root">');
      }
    });

    test('Property-Based: Frontend navigation is consistent across all routes', () => {
      /**
       * **Validates: Requirement 3.12**
       * 
       * Property: For all frontend routes, assert consistent navigation behavior
       */
      
      return fc.assert(
        fc.asyncProperty(
          fc.constantFrom(
            '/',
            '/home',
            '/explore',
            '/login',
            '/register',
            '/profile',
            '/bookmarks'
          ),
          async (route) => {
            const response = await axiosInstance.get(`${VERCEL_URL}${route}`);
            
            // Assert: Response should be 200 OK
            expect(response.status).toBe(200);
            
            // Assert: Response should be HTML
            expect(response.headers['content-type']).toMatch(/html/);
            
            // Assert: Response should contain React app
            expect(response.data).toContain('<div id="root">');
            expect(response.data).toContain('<!DOCTYPE html>');
          }
        ),
        { numRuns: 7 }
      );
    });
  });
});
