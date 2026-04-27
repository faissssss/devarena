# Implementation Plan

- [x] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - OAuth Redirect and Network Error Handling
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the bugs exist
  - **Scoped PBT Approach**: Scope the property to concrete failing cases - OAuth callbacks with valid tokens that don't navigate, network errors without user-friendly messages
  - Test that OAuth callback with valid token triggers navigation to homepage (from Bug Condition in design)
  - Test that network errors during completeOAuthLogin display user-friendly error messages (from Bug Condition in design)
  - Test that email/password login redirects to homepage after success (from Bug Condition in design)
  - The test assertions should match the Expected Behavior Properties from design (Property 1, Property 2, Property 3)
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves the bug exists)
  - Document counterexamples found to understand root cause (e.g., "navigate() called but navigation doesn't occur", "network error shows generic message")
  - Mark task complete when test is written, run, and failure is documented 
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.8, 2.9, 2.10, 2.11, 2.12, 2.13_

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Error Handling and Authentication State Management
  - **IMPORTANT**: Follow observation-first methodology
  - Observe behavior on UNFIXED code for non-buggy inputs (error cases, token validation, state management)
  - Write property-based tests capturing observed behavior patterns from Preservation Requirements
  - Test that OAuth errors still show error messages and redirect to login after 1200ms (from Preservation Requirements)
  - Test that missing tokens still show "Missing OAuth token" error (from Preservation Requirements)
  - Test that OAuth state mismatches still reject authentication (from Preservation Requirements)
  - Test that token expiration handling still clears expired tokens (from Preservation Requirements)
  - Test that 401 responses still clear tokens and redirect to login (from Preservation Requirements)
  - Test that user data storage in localStorage still works correctly (from Preservation Requirements)
  - Test that OAuth account linking to existing emails still functions (from Preservation Requirements)
  - Property-based testing generates many test cases for stronger guarantees
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10, 3.11, 3.12, 3.13_

- [x] 3. Fix for OAuth redirect and authentication issues

  - [x] 3.1 Fix OAuth redirect navigation in AuthCallbackPage.jsx
    - Move navigate() call outside the `if (active)` check or use window.location.href as fallback
    - Add small delay (100ms) after completeOAuthLogin to ensure state settles before navigation
    - Add console logging to track navigation attempts for debugging
    - Ensure navigation occurs immediately after successful OAuth completion
    - _Bug_Condition: isBugCondition(input) where input.token IS_VALID AND input.nextPath IS_DEFINED AND NOT navigationOccurred(input.nextPath)_
    - _Expected_Behavior: navigationOccurred(result.nextPath) AND result.userIsAuthenticated = true AND result.displayedOnHomepage = true (Property 1 from design)_
    - _Preservation: Error handling for OAuth errors, missing tokens, and authentication failures must remain unchanged (Property 4 from design)_
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3_

  - [x] 3.2 Add network error handling in AuthCallbackPage.jsx
    - Wrap completeOAuthLogin in try-catch with specific network error detection
    - Check for error.code === 'ERR_NETWORK' or error.message containing "network"
    - Display user-friendly message: "Network error. Please check your connection and try again."
    - Ensure no invalid authentication tokens are stored on network failure
    - _Bug_Condition: isBugCondition(input) where input.networkError AND NOT userFriendlyErrorDisplayed()_
    - _Expected_Behavior: Clear, user-friendly error message displayed for network errors (Property 2 from design)_
    - _Preservation: Existing error handling for OAuth errors must remain unchanged (Property 4 from design)_
    - _Requirements: 2.8, 2.9, 2.10, 2.11, 3.3_

  - [x] 3.3 Improve network error handling in AuthContext.jsx
    - Enhance completeOAuthLogin to detect network-specific errors (timeouts, connection refused)
    - Throw errors with clear messages like "Unable to connect. Please check your internet connection."
    - Ensure token cleanup on network failures
    - _Bug_Condition: Network errors during authentication API calls_
    - _Expected_Behavior: User-friendly network error messages (Property 2 from design)_
    - _Preservation: Token management and user data storage must remain unchanged (Property 5 from design)_
    - _Requirements: 2.8, 2.9, 2.11, 3.4, 3.5, 3.6, 3.7_

  - [x] 3.4 Add explicit navigation for email/password login
    - Update login and register functions in AuthContext.jsx to return success indicator
    - Ensure components using login/register navigate to homepage after successful authentication
    - Add consistent redirect behavior for both login and registration flows
    - _Bug_Condition: Successful email/password authentication without homepage redirect_
    - _Expected_Behavior: Immediate redirect to homepage after authentication (Property 3 from design)_
    - _Preservation: Existing authentication flow and token storage must remain unchanged (Property 5 from design)_
    - _Requirements: 2.12, 2.13, 3.4, 3.5_

  - [x] 3.5 Enhance backend network error handling in authService.js
    - Wrap axios calls in exchangeGoogleCode and exchangeGithubCode with try-catch
    - Catch ECONNREFUSED, ETIMEDOUT, ENOTFOUND errors
    - Throw AuthServiceError with user-friendly messages (e.g., "Unable to connect to GitHub. Please try again later.")
    - Add detailed error logging for GitHub OAuth failures
    - Verify GitHub access_token is present and provide specific error if missing
    - _Bug_Condition: Network errors during OAuth token exchange_
    - _Expected_Behavior: User-friendly error messages for network failures (Property 2 from design)_
    - _Preservation: Existing OAuth flow and error handling must remain unchanged (Property 4 from design)_
    - _Requirements: 2.5, 2.6, 2.7, 2.8, 2.9, 2.10, 3.1_

  - [x] 3.6 Improve backend error messages in authRoutes.js
    - Enhance error messages in handleOAuthCallback to include more context
    - Ensure all errors are caught and converted to user-friendly messages
    - Add specific error handling for token exchange failures, user creation errors
    - _Bug_Condition: OAuth errors without clear user feedback_
    - _Expected_Behavior: Clear, actionable error messages (Property 2 from design)_
    - _Preservation: OAuth state validation and error redirect behavior must remain unchanged (Property 4 from design)_
    - _Requirements: 2.6, 2.7, 3.1, 3.2, 3.8, 3.9, 3.10_

  - [x] 3.7 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - OAuth Redirect and Network Error Handling
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior
    - When this test passes, it confirms the expected behavior is satisfied
    - Run bug condition exploration test from step 1
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
    - Verify OAuth callbacks with valid tokens navigate to homepage immediately
    - Verify network errors display user-friendly messages
    - Verify email/password login redirects to homepage
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.8, 2.9, 2.10, 2.11, 2.12, 2.13_

  - [x] 3.8 Verify preservation tests still pass
    - **Property 2: Preservation** - Error Handling and Authentication State Management
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run preservation property tests from step 2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm OAuth error handling still works correctly
    - Confirm token validation and expiration handling unchanged
    - Confirm user data storage and OAuth account linking unchanged
    - Confirm all tests still pass after fix (no regressions)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10, 3.11, 3.12, 3.13_

- [x] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise
  - Verify OAuth redirect works for both Google and GitHub
  - Verify network errors are handled gracefully with user-friendly messages
  - Verify email/password authentication redirects correctly
  - Verify all preservation requirements are met (no regressions)
