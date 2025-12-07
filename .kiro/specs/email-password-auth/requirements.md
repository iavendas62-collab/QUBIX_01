# Requirements Document

## Introduction

This document outlines the requirements for implementing a modern email/password authentication system for QUBIX that automatically creates and manages Qubic wallets behind the scenes. The system will provide a familiar Web2 user experience while maintaining Web3 security through automatic wallet generation, encrypted seed storage, and seamless blockchain integration.

## Glossary

- **QUBIX Platform**: The GPU marketplace system that connects GPU providers with consumers
- **Qubic Wallet**: A blockchain wallet for storing and transacting QUBIC tokens
- **Seed Phrase**: A cryptographic seed used to generate and recover a Qubic wallet
- **Encrypted Seed**: The seed phrase encrypted using the user's password as the encryption key
- **Backend System**: The Node.js/Express server managing authentication and data
- **Prisma ORM**: The database abstraction layer for PostgreSQL
- **User**: Any person registering or logging into the QUBIX platform
- **Registration Flow**: The process of creating a new user account with email and password
- **Login Flow**: The process of authenticating an existing user with email and password

## Requirements

### Requirement 1: Email/Password Registration

**User Story:** As a new user, I want to register with my email and password like any modern website, so that I can access the platform without understanding blockchain wallets.

#### Acceptance Criteria

1. WHEN a user submits registration with email and password THEN the system SHALL validate the email format
2. WHEN email validation succeeds THEN the system SHALL verify the password meets minimum security requirements (8+ characters, mixed case, numbers)
3. WHEN credentials are valid THEN the system SHALL generate a new Qubic wallet automatically
4. WHEN wallet generation completes THEN the system SHALL encrypt the seed phrase using the user's password
5. WHEN encryption completes THEN the system SHALL store the user record with email, password hash, encrypted seed, and wallet address
6. WHEN storage succeeds THEN the system SHALL display the seed phrase to the user exactly once with a warning to save it
7. IF email already exists THEN the system SHALL reject registration with a clear error message

### Requirement 2: Automatic Wallet Creation

**User Story:** As a new user, I want my blockchain wallet created automatically during registration, so that I don't need to understand wallet setup.

#### Acceptance Criteria

1. WHEN a user registers THEN the system SHALL generate a new Qubic wallet seed phrase
2. WHEN seed generation completes THEN the system SHALL derive the wallet address from the seed
3. WHEN wallet creation succeeds THEN the system SHALL encrypt the seed using AES-256-GCM encryption
4. WHEN encryption completes THEN the system SHALL use the user's password as the encryption key derivation input
5. WHEN the wallet is created THEN the system SHALL store the encrypted seed in the database
6. WHEN storage completes THEN the system SHALL never store the unencrypted seed phrase

### Requirement 3: Seed Phrase Display and Warning

**User Story:** As a new user, I want to see my wallet seed phrase once during registration, so that I can back it up for account recovery.

#### Acceptance Criteria

1. WHEN registration completes successfully THEN the system SHALL display the seed phrase in a prominent modal dialog
2. WHEN displaying the seed phrase THEN the system SHALL include a clear warning that this is shown only once
3. WHEN displaying the seed phrase THEN the system SHALL provide a "Copy to Clipboard" button
4. WHEN displaying the seed phrase THEN the system SHALL require user confirmation before dismissing the modal
5. WHEN the user dismisses the modal THEN the system SHALL never display the seed phrase again through the UI

### Requirement 4: Email/Password Login

**User Story:** As a returning user, I want to login with my email and password, so that I can access my account without remembering my wallet address.

#### Acceptance Criteria

1. WHEN a user submits login credentials THEN the system SHALL validate the email format
2. WHEN email format is valid THEN the system SHALL query the database for a matching user record
3. WHEN a user record is found THEN the system SHALL verify the password against the stored hash using bcrypt
4. WHEN password verification succeeds THEN the system SHALL create a session token (JWT)
5. WHEN session token is created THEN the system SHALL return the token with user data including wallet address
6. IF email is not found OR password is incorrect THEN the system SHALL return a generic "Invalid credentials" error

### Requirement 5: Database Schema Updates

**User Story:** As a system administrator, I want the database schema to support email/password authentication, so that user credentials are stored securely.

#### Acceptance Criteria

1. WHEN the database migration runs THEN the system SHALL add an email column to the User table
2. WHEN the migration runs THEN the system SHALL add a passwordHash column to the User table
3. WHEN the migration runs THEN the system SHALL add a qubicSeedEncrypted column to the User table
4. WHEN the migration runs THEN the system SHALL create a unique index on the email column
5. WHEN the migration runs THEN the system SHALL make qubicAddress nullable for backward compatibility
6. WHEN the migration completes THEN the system SHALL maintain all existing user data

### Requirement 6: Password Security

**User Story:** As a security-conscious user, I want my password stored securely, so that my account cannot be compromised if the database is breached.

#### Acceptance Criteria

1. WHEN a user registers THEN the system SHALL hash the password using bcrypt with a cost factor of 10 or higher
2. WHEN storing the password THEN the system SHALL never store the plaintext password
3. WHEN a user logs in THEN the system SHALL use constant-time comparison for password verification
4. WHEN password hashing fails THEN the system SHALL reject the registration with an error message
5. WHEN the system processes passwords THEN the system SHALL clear password strings from memory after use

### Requirement 7: Seed Encryption Security

**User Story:** As a user, I want my wallet seed encrypted with my password, so that only I can access my funds even if the database is compromised.

#### Acceptance Criteria

1. WHEN encrypting a seed phrase THEN the system SHALL use AES-256-GCM encryption algorithm
2. WHEN deriving the encryption key THEN the system SHALL use PBKDF2 with at least 100,000 iterations
3. WHEN deriving the encryption key THEN the system SHALL use a unique salt per user stored alongside the encrypted seed
4. WHEN encrypting THEN the system SHALL generate a unique initialization vector (IV) for each encryption
5. WHEN storing encrypted data THEN the system SHALL store the salt, IV, and encrypted seed together
6. WHEN decryption is needed THEN the system SHALL use the user's password to derive the same encryption key

### Requirement 8: Frontend Registration Updates

**User Story:** As a new user, I want a simple registration form with email and password fields, so that I can sign up quickly.

#### Acceptance Criteria

1. WHEN a user visits the registration page THEN the system SHALL display email and password input fields
2. WHEN a user enters credentials THEN the system SHALL provide real-time validation feedback
3. WHEN a user submits the form THEN the system SHALL call the /api/auth/register-email endpoint
4. WHEN registration succeeds THEN the system SHALL display the seed phrase modal
5. WHEN the user confirms the seed phrase THEN the system SHALL redirect to the dashboard
6. IF registration fails THEN the system SHALL display the error message without clearing the form

### Requirement 9: Frontend Login Updates

**User Story:** As a returning user, I want a simple login form with email and password fields, so that I can access my account quickly.

#### Acceptance Criteria

1. WHEN a user visits the login page THEN the system SHALL display email and password input fields
2. WHEN a user enters credentials THEN the system SHALL provide real-time validation feedback
3. WHEN a user submits the form THEN the system SHALL call the /api/auth/login-email endpoint
4. WHEN login succeeds THEN the system SHALL store the session token
5. WHEN token is stored THEN the system SHALL redirect to the dashboard
6. IF login fails THEN the system SHALL display the error message and clear the password field

### Requirement 10: Backward Compatibility

**User Story:** As an existing user with a wallet address, I want to continue using the platform, so that my account is not disrupted by the new authentication system.

#### Acceptance Criteria

1. WHEN the system updates THEN existing users with qubicAddress SHALL remain functional
2. WHEN an existing user logs in THEN the system SHALL support both wallet-based and email-based authentication
3. WHEN querying users THEN the system SHALL handle users with or without email addresses
4. WHEN displaying user information THEN the system SHALL show wallet address for all users
5. WHEN the migration runs THEN the system SHALL not require email for existing users
