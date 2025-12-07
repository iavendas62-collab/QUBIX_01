# Design Document

## Overview

The email/password authentication system provides a modern Web2-style user experience while maintaining Web3 security through automatic Qubic wallet generation and encrypted seed storage. Users register with familiar email/password credentials, and the system automatically creates a Qubic wallet behind the scenes, encrypts the seed phrase with the user's password, and stores it securely in the database. The seed phrase is displayed once during registration for backup purposes, after which users can login using only their email and password without needing to remember their wallet address.

## Architecture

### High-Level Authentication Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React)                         │
│  ┌──────────────┐                    ┌──────────────┐       │
│  │  Register    │                    │  Login       │       │
│  │  Page        │                    │  Page        │       │
│  └──────┬───────┘                    └──────┬───────┘       │
│         │                                    │               │
│         │ POST /api/auth/register-email      │               │
│         │ {email, password, username, role}  │               │
│         │                                    │               │
│         │                POST /api/auth/login-email          │
│         │                {email, password}   │               │
│         │                                    │               │
└─────────┼────────────────────────────────────┼───────────────┘
          │                                    │
          ▼                                    ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend (Node.js/Express)                 │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Authentication Routes                    │   │
│  │  /api/auth/register-email                            │   │
│  │  /api/auth/login-email                               │   │
│  └──────┬───────────────────────────────────┬───────────┘   │
│         │                                    │               │
│         ▼                                    ▼               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  bcrypt      │  │  Qubic       │  │  Crypto      │      │
│  │  Password    │  │  Wallet      │  │  Encryption  │      │
│  │  Hashing     │  │  Service     │  │  (AES-256)   │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │              │
│         └──────────────────┴──────────────────┘              │
│                            │                                 │
│                   ┌────────▼────────┐                        │
│                   │  Prisma ORM     │                        │
│                   └────────┬────────┘                        │
└────────────────────────────┬────────────────────────────────┘
                             │
                    ┌────────▼────────┐
                    │  PostgreSQL     │
                    │  Database       │
                    │  - User table   │
                    │    - email      │
                    │    - passwordHash│
                    │    - qubicAddress│
                    │    - qubicSeedEnc│
                    └─────────────────┘
```

### Registration Flow Sequence

```
User → Frontend → Backend → Qubic Wallet → Crypto → Database
  │       │          │           │            │         │
  │       │          │           │            │         │
  ├─1─────┤          │           │            │         │
  │  Enter email/pwd │           │            │         │
  │       │          │           │            │         │
  │       ├─2────────┤           │            │         │
  │       │  POST    │           │            │         │
  │       │  register│           │            │         │
  │       │          │           │            │         │
  │       │          ├─3─────────┤            │         │
  │       │          │  Hash pwd │            │         │
  │       │          │  (bcrypt) │            │         │
  │       │          │           │            │         │
  │       │          ├─4─────────┼────────────┤         │
  │       │          │  Create   │            │         │
  │       │          │  wallet   │            │         │
  │       │          │           │            │         │
  │       │          ├─5─────────┼────────────┼─────────┤
  │       │          │  Encrypt  │            │         │
  │       │          │  seed     │            │         │
  │       │          │           │            │         │
  │       │          ├─6─────────┴────────────┴─────────┤
  │       │          │  Store user record                │
  │       │          │  (email, hash, address, enc seed) │
  │       │          │                                   │
  │       ├─7────────┤                                   │
  │       │  Return  │                                   │
  │       │  token + │                                   │
  │       │  seed    │                                   │
  │       │          │                                   │
  ├─8─────┤          │                                   │
  │  Show seed modal│                                   │
  │  (ONE TIME)     │                                   │
  └─────────────────┴───────────────────────────────────┘
```

### Login Flow Sequence

```
User → Frontend → Backend → Database → JWT
  │       │          │           │        │
  │       │          │           │        │
  ├─1─────┤          │           │        │
  │  Enter email/pwd │           │        │
  │       │          │           │        │
  │       ├─2────────┤           │        │
  │       │  POST    │           │        │
  │       │  login   │           │        │
  │       │          │           │        │
  │       │          ├─3─────────┤        │
  │       │          │  Find user│        │
  │       │          │  by email │        │
  │       │          │           │        │
  │       │          ├─4─────────┤        │
  │       │          │  Verify   │        │
  │       │          │  password │        │
  │       │          │  (bcrypt) │        │
  │       │          │           │        │
  │       │          ├─5─────────┴────────┤
  │       │          │  Generate JWT      │
  │       │          │                    │
  │       ├─6────────┤                    │
  │       │  Return  │                    │
  │       │  token + │                    │
  │       │  user    │                    │
  │       │          │                    │
  ├─7─────┤          │                    │
  │  Store token     │                    │
  │  Redirect        │                    │
  └──────────────────┴────────────────────┘
```

## Components and Interfaces

### Backend Components

#### Authentication Routes (`/api/auth`)

**POST /api/auth/register-email**

Creates a new user account with email/password and automatically generates a Qubic wallet.

```typescript
Request: {
  email: string;
  password: string;
  username?: string;
  role?: 'CONSUMER' | 'PROVIDER' | 'BOTH';
}

Response: {
  success: boolean;
  message: string;
  token: string;  // JWT for session
  user: {
    id: string;
    email: string;
    username: string | null;
    qubicAddress: string;
    role: string;
  };
  wallet: {
    identity: string;  // Qubic address
    seed: string;      // SHOWN ONLY ONCE
  };
  warning: string;  // Warning to save seed phrase
}

Errors:
- 400: Email/password missing or invalid
- 400: Email already registered
- 500: Server error during registration
```

**POST /api/auth/login-email**

Authenticates a user with email and password.

```typescript
Request: {
  email: string;
  password: string;
}

Response: {
  success: boolean;
  message: string;
  token: string;  // JWT for session
  user: {
    id: string;
    email: string;
    username: string | null;
    qubicAddress: string;
    role: string;
    balance: number;
  };
}

Errors:
- 400: Email/password missing
- 401: Invalid credentials
- 500: Server error during login
```

#### Crypto Utilities (`backend/src/utils/crypto.ts`)

**encryptSeed(seed: string, password: string): string**

Encrypts a Qubic seed phrase using AES-256-GCM with PBKDF2 key derivation.

```typescript
interface EncryptedData {
  salt: string;      // Base64 encoded salt for PBKDF2
  iv: string;        // Base64 encoded initialization vector
  encrypted: string; // Base64 encoded ciphertext
  tag: string;       // Base64 encoded authentication tag
}

// Returns JSON string of EncryptedData
function encryptSeed(seed: string, password: string): string;
```

**decryptSeed(encryptedData: string, password: string): string**

Decrypts an encrypted seed phrase using the user's password.

```typescript
// Takes JSON string of EncryptedData
// Returns plaintext seed phrase
function decryptSeed(encryptedData: string, password: string): string;
```

#### Qubic Wallet Service

**createWallet(): Promise<Wallet>**

Generates a new Qubic wallet with seed phrase and address.

```typescript
interface Wallet {
  identity: string;  // Qubic address (60 uppercase chars)
  seed: string;      // 55-character seed phrase
}

async function createWallet(): Promise<Wallet>;
```

### Frontend Components

#### Register Component (`frontend/src/pages/Register.tsx`)

**State:**
```typescript
interface RegisterState {
  formData: {
    email: string;
    password: string;
    confirmPassword: string;
    name: string;
    type: 'consumer' | 'provider';
  };
  loading: boolean;
  error: string | null;
  showSeedModal: boolean;
  seedPhrase: string | null;
}
```

**Methods:**
- `handleSubmit()`: Submits registration to `/api/auth/register-email`
- `handleSeedModalClose()`: Closes seed phrase modal after user confirmation
- `copySeedToClipboard()`: Copies seed phrase to clipboard

**UI Flow:**
1. User fills email, password, name, and role
2. On submit, calls `/api/auth/register-email`
3. On success, displays seed phrase modal with:
   - Large, readable seed phrase display
   - "Copy to Clipboard" button
   - Warning message about saving seed
   - "I have saved my seed phrase" checkbox
   - "Continue" button (disabled until checkbox checked)
4. After modal dismissed, redirects to dashboard

#### Login Component (`frontend/src/pages/Login.tsx`)

**State:**
```typescript
interface LoginState {
  formData: {
    email: string;
    password: string;
  };
  loading: boolean;
  error: string | null;
}
```

**Methods:**
- `handleSubmit()`: Submits login to `/api/auth/login-email`
- `handleSuccess()`: Stores JWT token and redirects to dashboard

**UI Flow:**
1. User enters email and password
2. On submit, calls `/api/auth/login-email`
3. On success, stores token in localStorage
4. Redirects to appropriate dashboard based on role

#### Seed Phrase Modal Component

**Props:**
```typescript
interface SeedPhraseModalProps {
  seedPhrase: string;
  onClose: () => void;
  open: boolean;
}
```

**Features:**
- Non-dismissible (must check confirmation)
- Copy to clipboard functionality
- Clear warning about one-time display
- Confirmation checkbox
- Responsive design

## Data Models

### Database Schema Updates

The Prisma schema already includes the necessary fields:

```prisma
model User {
  id            String    @id @default(uuid())
  email         String    @unique
  passwordHash  String
  qubicAddress  String    @unique
  qubicSeedEnc  String?   // Encrypted seed phrase
  username      String?
  role          Role      @default(CONSUMER)
  balance       Float     @default(0)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  providers     Provider[]
  jobs          Job[]
  transactions  Transaction[]
}
```

**Field Descriptions:**
- `email`: User's email address (unique, indexed)
- `passwordHash`: bcrypt hash of user's password (cost factor 10)
- `qubicAddress`: Generated Qubic wallet address (60 uppercase chars)
- `qubicSeedEnc`: Encrypted seed phrase (JSON string of EncryptedData)
- `username`: Optional display name
- `role`: User role (CONSUMER, PROVIDER, or BOTH)

### Encryption Data Structure

```typescript
interface EncryptedSeedData {
  version: number;      // Encryption version (for future upgrades)
  algorithm: string;    // "AES-256-GCM"
  kdf: string;          // "PBKDF2"
  kdfIterations: number; // 100,000
  salt: string;         // Base64 encoded (32 bytes)
  iv: string;           // Base64 encoded (16 bytes)
  encrypted: string;    // Base64 encoded ciphertext
  tag: string;          // Base64 encoded auth tag (16 bytes)
}
```

### JWT Token Payload

```typescript
interface JWTPayload {
  userId: string;
  qubicAddress: string;
  iat: number;  // Issued at
  exp: number;  // Expires at (7 days)
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property 1: Email Format Validation
*For any* string input, the email validation should accept valid email formats and reject invalid formats according to RFC 5322 standards
**Validates: Requirements 1.1, 4.1**

### Property 2: Password Security Requirements
*For any* password string, the validation should accept passwords with 8+ characters containing mixed case and numbers, and reject those that don't meet requirements
**Validates: Requirements 1.2**

### Property 3: Automatic Wallet Generation
*For any* valid registration credentials, the system should generate a new Qubic wallet with a unique address and seed phrase
**Validates: Requirements 1.3, 2.1**

### Property 4: Seed-Address Determinism
*For any* Qubic seed phrase, deriving the wallet address multiple times should always produce the same address
**Validates: Requirements 2.2**

### Property 5: Seed Encryption Round-Trip
*For any* seed phrase and password, encrypting then decrypting with the same password should return the original seed phrase
**Validates: Requirements 1.4, 2.4, 7.6**

### Property 6: Complete User Record Storage
*For any* successful registration, the database record should contain email, passwordHash, qubicAddress, and qubicSeedEnc fields
**Validates: Requirements 1.5**

### Property 7: No Plaintext Seed Storage
*For any* user record in the database, the qubicSeedEnc field should contain encrypted data, never plaintext seed phrases
**Validates: Requirements 2.6**

### Property 8: Password Hashing Security
*For any* password, the stored hash should use bcrypt with cost factor 10 or higher, and never store plaintext passwords
**Validates: Requirements 6.1, 6.2**

### Property 9: Password Verification Correctness
*For any* user account, verifying with the correct password should succeed, and verifying with any incorrect password should fail
**Validates: Requirements 4.3**

### Property 10: JWT Token Generation
*For any* successful login, the system should generate a valid JWT token containing userId and qubicAddress
**Validates: Requirements 4.4, 4.5**

### Property 11: Encryption Algorithm Compliance
*For any* encrypted seed, the encryption metadata should indicate AES-256-GCM algorithm usage
**Validates: Requirements 7.1**

### Property 12: Key Derivation Parameters
*For any* encrypted seed, the KDF metadata should indicate PBKDF2 with at least 100,000 iterations
**Validates: Requirements 7.2**

### Property 13: Salt Uniqueness
*For any* two different user registrations, the encryption salts should be unique
**Validates: Requirements 7.3**

### Property 14: IV Uniqueness
*For any* two encryption operations, the initialization vectors should be unique
**Validates: Requirements 7.4**

### Property 15: Encryption Data Completeness
*For any* encrypted seed, the stored data should contain salt, IV, encrypted ciphertext, and authentication tag
**Validates: Requirements 7.5**

### Property 16: Seed Phrase Confidentiality
*For any* API call after registration, the response should never include the plaintext seed phrase
**Validates: Requirements 3.5**

### Property 17: Backward Compatibility
*For any* existing user with qubicAddress but no email, the system should handle queries and operations without errors
**Validates: Requirements 10.3, 10.4**

## Error Handling

### Registration Errors

**Email Validation Failures:**
- Return 400 status with message: "Invalid email format"
- Preserve form data except password
- Highlight email field with error styling

**Password Validation Failures:**
- Return 400 status with specific message:
  - "Password must be at least 8 characters"
  - "Password must contain uppercase and lowercase letters"
  - "Password must contain at least one number"
- Preserve form data except password
- Highlight password field with error styling

**Duplicate Email:**
- Return 400 status with message: "Email already registered"
- Suggest login instead
- Provide "Forgot Password?" link

**Wallet Generation Failures:**
- Return 500 status with message: "Failed to create wallet. Please try again."
- Log error details for debugging
- Retry up to 3 times before failing
- Do not create user record if wallet generation fails

**Encryption Failures:**
- Return 500 status with message: "Failed to secure account. Please try again."
- Log error details for debugging
- Clean up any partial user records
- Do not expose encryption details to user

**Database Errors:**
- Return 500 status with message: "Registration failed. Please try again."
- Log error details with context
- Implement transaction rollback
- Retry transient failures (connection timeouts)

### Login Errors

**Invalid Credentials:**
- Return 401 status with generic message: "Invalid email or password"
- Never indicate whether email exists
- Clear password field
- Rate limit login attempts (5 per minute per IP)

**Account Locked:**
- Return 403 status with message: "Account temporarily locked due to multiple failed login attempts"
- Provide unlock time estimate
- Send email notification to user

**Database Errors:**
- Return 500 status with message: "Login failed. Please try again."
- Log error details
- Retry transient failures

**JWT Generation Failures:**
- Return 500 status with message: "Authentication failed. Please try again."
- Log error details
- Do not expose JWT secret or implementation details

### Decryption Errors

**Wrong Password:**
- Fail silently during login (covered by password verification)
- Never expose that decryption failed

**Corrupted Encrypted Data:**
- Return 500 status with message: "Account recovery required. Please contact support."
- Log error with user ID for support investigation
- Provide support contact information

## Testing Strategy

### Unit Testing

**Backend Unit Tests:**
- Email validation with valid and invalid formats
- Password validation with various password combinations
- bcrypt hashing and verification
- Wallet generation (mocked Qubic SDK)
- Encryption/decryption with various inputs
- JWT token generation and verification
- Database operations with test database
- Error handling for all failure scenarios

**Frontend Unit Tests:**
- Form validation logic
- API client methods
- State management (registration/login flows)
- Seed phrase modal behavior
- Error message display
- Token storage and retrieval

**Integration Tests:**
- Complete registration flow (API → Database)
- Complete login flow (API → Database)
- Wallet generation integration with Qubic SDK
- Database transaction rollback on failures
- JWT authentication middleware

### Property-Based Testing

Use **fast-check** for JavaScript/TypeScript property-based tests.

**Configuration:**
- Minimum 100 iterations per property test
- Each test tagged with format: `**Feature: email-password-auth, Property {number}: {property_text}**`

**Property Tests:**

1. **Email Format Validation** - Generate random strings, verify valid emails pass and invalid fail
2. **Password Security Requirements** - Generate random passwords, verify requirement enforcement
3. **Automatic Wallet Generation** - Generate random credentials, verify wallet creation
4. **Seed-Address Determinism** - Generate random seeds, verify address derivation consistency
5. **Seed Encryption Round-Trip** - Generate random seeds and passwords, verify encrypt/decrypt identity
6. **Complete User Record Storage** - Generate random registrations, verify all fields stored
7. **No Plaintext Seed Storage** - Generate random registrations, verify seeds are encrypted
8. **Password Hashing Security** - Generate random passwords, verify bcrypt usage and no plaintext
9. **Password Verification Correctness** - Generate random passwords, verify correct/incorrect verification
10. **JWT Token Generation** - Generate random logins, verify token structure and payload
11. **Encryption Algorithm Compliance** - Generate random encryptions, verify AES-256-GCM metadata
12. **Key Derivation Parameters** - Generate random encryptions, verify PBKDF2 parameters
13. **Salt Uniqueness** - Generate multiple registrations, verify unique salts
14. **IV Uniqueness** - Generate multiple encryptions, verify unique IVs
15. **Encryption Data Completeness** - Generate random encryptions, verify all components present
16. **Seed Phrase Confidentiality** - Generate random API calls, verify no plaintext seeds returned
17. **Backward Compatibility** - Generate users with/without email, verify operations succeed

### Security Testing

**Password Security:**
- Test bcrypt cost factor is 10 or higher
- Verify no plaintext passwords in logs or database
- Test timing attack resistance (constant-time comparison)
- Verify password field is cleared from memory

**Encryption Security:**
- Test AES-256-GCM implementation
- Verify PBKDF2 with 100,000+ iterations
- Test salt and IV uniqueness
- Verify authentication tag validation
- Test resistance to padding oracle attacks

**Authentication Security:**
- Test JWT secret strength (256+ bits)
- Verify JWT expiration (7 days)
- Test token refresh mechanism
- Verify session invalidation on logout
- Test CSRF protection

**Rate Limiting:**
- Test login rate limiting (5 attempts per minute)
- Test registration rate limiting (3 per hour per IP)
- Verify rate limit bypass prevention

### Manual Testing

**User Experience:**
- Test registration flow on multiple browsers
- Test login flow on multiple browsers
- Verify seed phrase modal UX
- Test error message clarity
- Verify responsive design on mobile

**Security Scenarios:**
- Test with weak passwords
- Test with SQL injection attempts
- Test with XSS attempts
- Test with CSRF attempts
- Verify secure password storage

**Edge Cases:**
- Test with very long emails
- Test with special characters in passwords
- Test with Unicode characters
- Test with concurrent registrations
- Test with database connection failures

## Security Considerations

### Password Security

**Hashing:**
- Use bcrypt with cost factor 10 (adjustable for future hardware)
- Never store plaintext passwords
- Clear password strings from memory after hashing
- Use constant-time comparison for verification

**Validation:**
- Minimum 8 characters
- Require mixed case (uppercase and lowercase)
- Require at least one number
- Consider adding special character requirement
- Implement password strength meter in UI

### Seed Phrase Encryption

**Encryption Algorithm:**
- AES-256-GCM for authenticated encryption
- Provides both confidentiality and integrity
- Resistant to padding oracle attacks

**Key Derivation:**
- PBKDF2 with 100,000 iterations
- Unique salt per user (32 bytes)
- Prevents rainbow table attacks
- Adjustable iteration count for future security

**Storage:**
- Store salt, IV, ciphertext, and auth tag together
- Never store plaintext seeds
- Include version number for future algorithm upgrades

### JWT Security

**Token Generation:**
- Use strong secret (256+ bits)
- Include minimal claims (userId, qubicAddress)
- Set reasonable expiration (7 days)
- Sign with HS256 algorithm

**Token Storage:**
- Store in httpOnly cookies (preferred)
- Or localStorage with XSS protection
- Never expose in URLs
- Implement token refresh mechanism

### Database Security

**Connection:**
- Use SSL/TLS for database connections
- Implement connection pooling
- Use prepared statements (Prisma handles this)
- Limit database user permissions

**Data Protection:**
- Encrypt sensitive data at rest
- Implement row-level security
- Regular backups with encryption
- Audit logging for sensitive operations

### API Security

**Rate Limiting:**
- Login: 5 attempts per minute per IP
- Registration: 3 per hour per IP
- Implement exponential backoff
- Use Redis for distributed rate limiting

**Input Validation:**
- Validate all inputs server-side
- Sanitize inputs to prevent injection
- Use Prisma's built-in protection
- Implement request size limits

**CORS:**
- Whitelist allowed origins
- Restrict methods and headers
- Include credentials only when needed
- Implement preflight caching

## Deployment Considerations

### Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:password@host:5432/qubix
DIRECT_URL=postgresql://user:password@host:5432/qubix

# JWT
JWT_SECRET=<256-bit-random-string>
JWT_EXPIRES_IN=7d

# Encryption
ENCRYPTION_VERSION=1

# Rate Limiting
REDIS_URL=redis://localhost:6379

# Qubic
QUBIC_NODE_URL=https://rpc.qubic.org
```

### Database Migration

**Migration Steps:**
1. Backup existing database
2. Run Prisma migration: `npx prisma migrate deploy`
3. Verify schema changes
4. Test with existing users
5. Monitor for errors

**Rollback Plan:**
1. Restore database from backup
2. Revert code deployment
3. Verify system functionality

### Monitoring

**Metrics to Track:**
- Registration success/failure rate
- Login success/failure rate
- Average registration time
- Average login time
- JWT token generation rate
- Encryption/decryption performance
- Database query performance

**Alerts:**
- High registration failure rate (>5%)
- High login failure rate (>10%)
- Slow response times (>2s)
- Database connection errors
- Encryption failures

### Performance Optimization

**Caching:**
- Cache user sessions in Redis
- Cache JWT validation results
- Implement connection pooling
- Use database query optimization

**Async Operations:**
- Wallet generation (can be async)
- Balance fetching (can be async)
- Email notifications (async)
- Audit logging (async)

## Future Enhancements

### Password Recovery

**Forgot Password Flow:**
1. User enters email
2. System sends reset link to email
3. User clicks link with token
4. User enters new password
5. System re-encrypts seed with new password
6. System invalidates old sessions

**Challenges:**
- Seed phrase is encrypted with old password
- Need to decrypt with old password, re-encrypt with new
- Requires storing temporary decryption capability
- Security implications of password reset

### Two-Factor Authentication

**TOTP (Time-based One-Time Password):**
- Generate QR code during setup
- Store encrypted TOTP secret
- Verify 6-digit code on login
- Provide backup codes

### Social Login

**OAuth Integration:**
- Google, GitHub, Twitter login
- Link social accounts to existing accounts
- Still generate Qubic wallet automatically
- Store OAuth tokens securely

### Hardware Wallet Support

**Ledger/Trezor Integration:**
- Allow users to connect hardware wallets
- Use hardware wallet for transaction signing
- Keep seed phrase on hardware device
- Provide migration path from software wallet
