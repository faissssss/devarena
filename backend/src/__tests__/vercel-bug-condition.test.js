/**
 * Bug Condition Exploration Test for Vercel Deployment Bugs
 * 
 * **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8**
 * 
 * **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bugs exist
 * **DO NOT attempt to fix the test or the code when it fails**
 * **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
 * 
 * **GOAL**: Surface counterexamples that demonstrate the three bugs exist on Vercel production
 * 
 * This test validates the Bug Condition from the design document:
 * - Competition List: Request `/api/competitions` on Vercel → Assert returns non-empty competitions array (not `{competitions: [], totalCount: 0}`)
 * - OAuth Redirect: Request `/api/auth/oauth/google?next=%2Fhome` on Vercel → Assert returns HTTP 302 redirect to Google OAuth URL (not black screen)
 * - Email Registration: POST `/api/auth/register` with valid data on Vercel → Assert returns HTTP 201 with user data (not HTTP 405)
 * 
 * Expected counterexamples on UNFIXED deployment:
 * - Competition endpoint returns empty array instead of data
 * - OAuth endpoint displays blank page instead of redirecting
 * - Registration endpoint returns 405 instead of creating user
 * - Rate limiting may block requests after 5-100 requests
 * - Database connection pool may be exhausted
 */

import { describe, expect, jest, test } from '@jest/globals';
import axios from 'axios';
import fc from 'fast-check';

// Vercel production URL from .env.production
const VERCEL_URL = 'https://devarena-rust.vercel.app';

// Configure axios to not follow redirects (so we can check for 302)
const axiosInstance = axios.create({
  maxRedirects: 0,
  validateStatus: (status) => status < 600, // Accept all status codes
});

describe('Bug Condition Exploration - Vercel API Endpoints', () => {
  // Increase timeout for network requests
  jest.setTimeout(30000);

  describe('Property 1: Bug Condition - Vercel API Endpoints Return Correct Responses', () => {
    
    test('Competition List: /api/competitions returns non-empty competitions array', async () => {
      /**
       * **Validates: Requirements 2.1, 2.2**
       * 
       * Bug Condition: Competition endpoint returns empty array on Vercel production
       * Expected Behavior: Should return non-empty competitions array from database
       * 
       * On UNFIXED deployment, this test will FAIL with counterexample:
       * - Response: {competitions: [], totalCount: 0}
       * - Expected: {competitions: [...], totalCount: > 0}
       */
      
      const response = await axiosInstance.get(`${VERCEL_URL}/api/competitions`);
      
      // Log response for debugging
      console.log('Competition List Response:', {
        status: response.status,
        data: response.data,
      });
      
      // Assert: Response should be 200 OK
      expect(response.status).toBe(200);
      
      // Assert: Response should have competitions array
      expect(response.data).toHaveProperty('competitions');
      expect(Array.isArray(response.data.competitions)).toBe(true);
      
      // Assert: Competitions array should NOT be empty (this will fail on unfixed deployment)
      expect(response.data.competitions.length).toBeGreaterThan(0);
      
      // Assert: Total count should be greater than 0
      expect(response.data.totalCount).toBeGreaterThan(0);
    });

    test('OAuth Redirect: /api/auth/oauth/google returns HTTP 302 redirect to Google OAuth URL', async () => {
      /**
       * **Validates: Requirements 2.5, 2.6, 2.7**
       * 
       * Bug Condition: OAuth endpoint displays black screen on Vercel production
       * Expected Behavior: Should return HTTP 302 redirect to Google OAuth consent page
       * 
       * On UNFIXED deployment, this test will FAIL with counterexample:
       * - Response: HTTP 200 with blank page or error
       * - Expected: HTTP 302 with Location header to accounts.google.com
       */
      
      try {
        const response = await axiosInstance.get(
          `${VERCEL_URL}/api/auth/oauth/google?next=%2Fhome`
        );
        
        // Log response for debugging
        console.log('OAuth Redirect Response:', {
          status: response.status,
          headers: response.headers,
          location: response.headers.location,
        });
        
        // Assert: Response should be 302 Found (redirect)
        expect(response.status).toBe(302);
        
        // Assert: Response should have Location header
        expect(response.headers).toHaveProperty('location');
        
        // Assert: Location should redirect to Google OAuth URL
        const location = response.headers.location;
        expect(location).toContain('accounts.google.com/o/oauth2/v2/auth');
        
        // Assert: Location should contain required OAuth parameters
        expect(location).toContain('client_id=');
        expect(location).toContain('redirect_uri=');
        expect(location).toContain('response_type=code');
        expect(location).toContain('scope=');
      } catch (error) {
        // If request fails, log error and fail test
        console.error('OAuth Redirect Error:', {
          message: error.message,
          response: error.response ? {
            status: error.response.status,
            data: error.response.data,
          } : 'No response',
        });
        throw error;
      }
    });

    test('Email Registration: POST /api/auth/register returns HTTP 201 with user data', async () => {
      /**
       * **Validates: Requirements 2.9, 2.10**
       * 
       * Bug Condition: Registration endpoint returns 405 on Vercel production
       * Expected Behavior: Should return HTTP 201 with user data
       * 
       * On UNFIXED deployment, this test will FAIL with counterexample:
       * - Response: HTTP 405 Method Not Allowed
       * - Expected: HTTP 201 Created with user data
       * 
       * Note: We use a unique email for each test run to avoid conflicts
       */
      
      // Generate unique email for this test run
      const timestamp = Date.now();
      const testEmail = `test-${timestamp}@example.com`;
      
      const registrationData = {
        email: testEmail,
        password: 'TestPassword123!',
        username: `testuser${timestamp}`,
      };
      
      try {
        const response = await axiosInstance.post(
          `${VERCEL_URL}/api/auth/register`,
          registrationData,
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
        
        // Log response for debugging
        console.log('Email Registration Response:', {
          status: response.status,
          data: response.data,
        });
        
        // Assert: Response should be 201 Created (not 405 Method Not Allowed)
        expect(response.status).toBe(201);
        
        // Assert: Response should have user data
        expect(response.data).toHaveProperty('user');
        expect(response.data.user).toHaveProperty('id');
        expect(response.data.user).toHaveProperty('email');
        expect(response.data.user.email).toBe(testEmail);
        
        // Assert: Response should have JWT token
        expect(response.data).toHaveProperty('token');
        expect(typeof response.data.token).toBe('string');
        expect(response.data.token.length).toBeGreaterThan(0);
      } catch (error) {
        // If request fails, log error and fail test
        console.error('Email Registration Error:', {
          message: error.message,
          response: error.response ? {
            status: error.response.status,
            statusText: error.response.statusText,
            data: error.response.data,
          } : 'No response',
        });
        throw error;
      }
    });

    test('Property-Based: Competition endpoint returns valid data structure', () => {
      /**
       * **Validates: Requirements 2.1, 2.2, 2.3, 2.4**
       * 
       * Property-based test that verifies the competition endpoint returns
       * a valid data structure for various query parameters.
       * 
       * This test generates random query parameters and verifies the response
       * always has the correct structure.
       */
      
      return fc.assert(
        fc.asyncProperty(
          fc.record({
            page: fc.integer({ min: 1, max: 5 }),
            limit: fc.integer({ min: 1, max: 20 }),
            category: fc.constantFrom('ctf', 'ml', 'coding', 'all'),
          }),
          async (params) => {
            const response = await axiosInstance.get(`${VERCEL_URL}/api/competitions`, {
              params,
            });
            
            // Assert: Response should be 200 OK
            expect(response.status).toBe(200);
            
            // Assert: Response should have correct structure
            expect(response.data).toHaveProperty('competitions');
            expect(response.data).toHaveProperty('totalCount');
            expect(Array.isArray(response.data.competitions)).toBe(true);
            expect(typeof response.data.totalCount).toBe('number');
            
            // Assert: Competitions should not be empty (will fail on unfixed deployment)
            expect(response.data.competitions.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 5 } // Run 5 times with different parameters
      );
    });

    test('Property-Based: OAuth endpoints return redirects for all providers', () => {
      /**
       * **Validates: Requirements 2.5, 2.6, 2.7, 2.8**
       * 
       * Property-based test that verifies OAuth endpoints return proper
       * redirects for all supported providers.
       */
      
      return fc.assert(
        fc.asyncProperty(
          fc.record({
            provider: fc.constantFrom('google', 'github'),
            next: fc.constantFrom('%2Fhome', '%2Fexplore', '%2Fprofile'),
          }),
          async ({ provider, next }) => {
            const response = await axiosInstance.get(
              `${VERCEL_URL}/api/auth/oauth/${provider}?next=${next}`
            );
            
            // Assert: Response should be 302 redirect
            expect(response.status).toBe(302);
            
            // Assert: Response should have Location header
            expect(response.headers).toHaveProperty('location');
            
            // Assert: Location should contain OAuth provider domain
            const location = response.headers.location;
            if (provider === 'google') {
              expect(location).toContain('accounts.google.com');
            } else if (provider === 'github') {
              expect(location).toContain('github.com');
            }
          }
        ),
        { numRuns: 4 } // Run 4 times (2 providers × 2 next paths)
      );
    });
  });
});
