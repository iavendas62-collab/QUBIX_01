# Implementation Plan

- [ ] 1. Update database schema and run migration




  - Verify Prisma schema has email, passwordHash, and qubicSeedEnc fields
  - Run Prisma migration: `npx prisma migrate dev --name add_email_password_wallet`
  - Generate Prisma client: `npx prisma generate`
  - Verify migration applied successfully in database
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

- [ ]* 1.1 Write property test for database schema
  - **Property 6: Complete User Record Storage**
  - **Validates: Requirements 1.5**

- [ ] 2. Implement crypto utilities for seed encryption
  - Create `backend/src/utils/crypto.ts` if not exists
  - Implement `encryptSeed(seed: string, password: string): string` using AES-256-GCM
  - Implement `decryptSeed(encryptedData: string, password: string): string`
  - Use PBKDF2 with 100,000 iterations for key derivation
  - Generate unique salt and IV for each encryption
  - Store encryption metadata (version, algorithm, KDF, iterations, salt, IV, ciphertext, tag)
  - _Requirements: 1.4, 2.3, 2.4, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

- [ ]* 2.1 Write property test for seed encryption round-trip
  - **Property 5: Seed Encryption Round-Trip**
  - **Validates: Requirements 1.4, 2.4, 7.6**

- [ ]* 2.2 Write property test for encryption algorithm compliance
  - **Property 11: Encryption Algorithm Compliance**
  - **Validates: Requirements 7.1**

- [ ]* 2.3 Write property test for key derivation parameters
  - **Property 12: Key Derivation Parameters**
  - **Validates: Requirements 7.2**

- [ ]* 2.4 Write property test for salt uniqueness
  - **Property 13: Salt Uniqueness**
  - **Validates: Requirements 7.3**

- [ ]* 2.5 Write property test for IV uniqueness
  - **Property 14: IV Uniqueness**
  - **Validates: Requirements 7.4**

- [ ]* 2.6 Write property test for encryption data completeness
  - **Property 15: Encryption Data Completeness**
  - **Validates: Requirements 7.5**

- [ ] 3. Update authentication routes for email/password
  - Review existing `/api/auth/register-email` endpoint in `backend/src/routes/auth.ts`
  - Ensure email format validation (RFC 5322)
  - Ensure password validation (8+ chars, mixed case, numbers)
  - Verify bcrypt hashing with cost factor 10
  - Verify automatic Qubic wallet creation
  - Verify seed encryption using crypto utils
  - Verify user record storage with all required fields
  - Ensure seed phrase returned in response (one time only)
  - Add duplicate email check with appropriate error
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 2.1, 2.2, 6.1, 6.2_

- [ ]* 3.1 Write property test for email format validation
  - **Property 1: Email Format Validation**
  - **Validates: Requirements 1.1, 4.1**

- [ ]* 3.2 Write property test for password security requirements
  - **Property 2: Password Security Requirements**
  - **Validates: Requirements 1.2**

- [ ]* 3.3 Write property test for automatic wallet generation
  - **Property 3: Automatic Wallet Generation**
  - **Validates: Requirements 1.3, 2.1**

- [ ]* 3.4 Write property test for seed-address determinism
  - **Property 4: Seed-Address Determinism**
  - **Validates: Requirements 2.2**

- [ ]* 3.5 Write property test for no plaintext seed storage
  - **Property 7: No Plaintext Seed Storage**
  - **Validates: Requirements 2.6**

- [ ]* 3.6 Write property test for password hashing security
  - **Property 8: Password Hashing Security**
  - **Validates: Requirements 6.1, 6.2**

- [ ] 4. Update login endpoint for email/password authentication
  - Review existing `/api/auth/login-email` endpoint in `backend/src/routes/auth.ts`
  - Ensure email format validation
  - Verify user lookup by email
  - Verify bcrypt password verification
  - Ensure JWT token generation with userId and qubicAddress
  - Return user data including wallet address and balance
  - Implement generic error message for invalid credentials
  - Add rate limiting (5 attempts per minute per IP)
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

- [ ]* 4.1 Write property test for password verification correctness
  - **Property 9: Password Verification Correctness**
  - **Validates: Requirements 4.3**

- [ ]* 4.2 Write property test for JWT token generation
  - **Property 10: JWT Token Generation**
  - **Validates: Requirements 4.4, 4.5**

- [ ]* 4.3 Write property test for seed phrase confidentiality
  - **Property 16: Seed Phrase Confidentiality**
  - **Validates: Requirements 3.5**

- [ ] 5. Create seed phrase modal component
  - Create `frontend/src/components/SeedPhraseModal.tsx`
  - Display seed phrase in large, readable format
  - Add "Copy to Clipboard" button with visual feedback
  - Display prominent warning: "⚠️ IMPORTANT: Save your seed phrase! This is the only time it will be shown."
  - Add "I have saved my seed phrase" checkbox
  - Disable "Continue" button until checkbox is checked
  - Make modal non-dismissible (no close on backdrop click)
  - Implement responsive design for mobile
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [ ] 6. Update Register.tsx to use email/password flow
  - Update form to include email and password fields
  - Remove wallet address input field
  - Add password confirmation field
  - Implement real-time validation feedback
  - Update submit handler to call `/api/auth/register-email`
  - Handle successful registration response
  - Display SeedPhraseModal with returned seed phrase
  - Store JWT token after modal dismissed
  - Redirect to dashboard after confirmation
  - Handle registration errors (duplicate email, validation failures)
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

- [ ] 7. Update Login.tsx to use email/password flow
  - Update form to use email and password fields
  - Remove wallet address input field
  - Implement real-time validation feedback
  - Update submit handler to call `/api/auth/login-email`
  - Store JWT token on successful login
  - Redirect to appropriate dashboard based on role
  - Handle login errors (invalid credentials, account locked)
  - Clear password field on error
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_

- [ ] 8. Ensure backward compatibility with existing users
  - Verify existing wallet-based login still works (`/api/auth/login`)
  - Test that users without email can still use the platform
  - Verify database queries handle nullable email field
  - Ensure wallet address is displayed for all users
  - Test mixed authentication scenarios (some users with email, some without)
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ]* 8.1 Write property test for backward compatibility
  - **Property 17: Backward Compatibility**
  - **Validates: Requirements 10.3, 10.4**

- [ ] 9. Add rate limiting middleware
  - Install express-rate-limit package if not present
  - Create rate limiter for login endpoint (5 attempts per minute per IP)
  - Create rate limiter for registration endpoint (3 per hour per IP)
  - Apply rate limiters to authentication routes
  - Return 429 status with appropriate error message
  - Consider using Redis for distributed rate limiting
  - _Requirements: 4.6_

- [ ] 10. Implement comprehensive error handling
  - Add try-catch blocks for all async operations
  - Implement transaction rollback on registration failures
  - Add detailed error logging with context
  - Return user-friendly error messages
  - Implement retry logic for transient failures
  - Add error monitoring integration (Sentry or similar)
  - _Requirements: 1.4, 6.4_

- [ ] 11. Add security headers and CORS configuration
  - Configure CORS with whitelist of allowed origins
  - Add helmet middleware for security headers
  - Implement CSRF protection
  - Configure secure cookie settings for JWT
  - Add request size limits
  - Implement input sanitization
  - _Requirements: All security requirements_

- [ ] 12. Checkpoint - Ensure all tests pass
  - Run all unit tests
  - Run all property-based tests
  - Run integration tests for registration flow
  - Run integration tests for login flow
  - Test backward compatibility with existing users
  - Verify all security measures in place
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 13. Update API documentation
  - Document `/api/auth/register-email` endpoint
  - Document `/api/auth/login-email` endpoint
  - Document request/response formats
  - Document error codes and messages
  - Add authentication flow diagrams
  - Document JWT token usage
  - _Requirements: All_

- [ ] 14. Manual testing and validation
  - Test registration flow in browser
  - Test login flow in browser
  - Verify seed phrase modal UX
  - Test error scenarios (duplicate email, wrong password)
  - Test on multiple browsers (Chrome, Firefox, Safari, Edge)
  - Test responsive design on mobile devices
  - Verify rate limiting works
  - Test backward compatibility with existing accounts
  - _Requirements: All_

- [ ] 15. Final Checkpoint - Production readiness
  - Verify all features working correctly
  - Check security configurations
  - Verify database migration successful
  - Test performance under load
  - Verify monitoring and logging in place
  - Ensure all tests pass, ask the user if questions arise.
