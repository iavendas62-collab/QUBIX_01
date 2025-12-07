# Qubic Wallet Integration

This document describes the Qubic wallet integration implementation for the QUBIX platform.

## Overview

The wallet integration provides:
- Wallet address validation
- Wallet connection and user management
- Balance queries from the Qubic blockchain
- Transaction history tracking

## Requirements Implemented

- **Requirement 2.1**: Provide Qubic wallet connection option
- **Requirement 2.2**: Verify wallet address format
- **Requirement 2.3**: Display user's QUBIC balance

## Architecture

### Components

1. **WalletService** (`src/services/wallet.service.ts`)
   - Core wallet operations
   - Address validation
   - Balance queries
   - User management

2. **Wallet Routes** (`src/routes/wallet.ts`)
   - REST API endpoints
   - Request validation
   - Error handling

3. **Qubic Integration**
   - `qubic-real.ts`: Real blockchain integration
   - `qubic-wallet.ts`: Wallet operations using @qubic-lib/qubic-ts-library

## API Endpoints

### POST /api/wallet/connect

Connect a Qubic wallet and create/retrieve user account.

**Request:**
```json
{
  "qubicAddress": "ABCD...XYZ",  // 60 uppercase characters
  "email": "user@example.com",    // Optional
  "username": "username",         // Optional
  "signature": "..."              // Optional (for future auth)
}
```

**Response (Success):**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "qubicAddress": "ABCD...XYZ",
    "email": "user@example.com",
    "username": "username",
    "role": "CONSUMER",
    "balance": 1000000
  },
  "balance": 1000000,
  "message": "Wallet connected successfully"
}
```

**Response (Error):**
```json
{
  "success": false,
  "message": "Invalid Qubic address format. Address must be 60 uppercase characters."
}
```

### GET /api/wallet/:address/balance

Get balance for a Qubic address.

**Response:**
```json
{
  "success": true,
  "qubicAddress": "ABCD...XYZ",
  "balance": 1000000,
  "pendingEarnings": 5000,
  "lastUpdated": "2024-11-30T12:00:00.000Z"
}
```

### POST /api/wallet/validate

Validate a Qubic address format.

**Request:**
```json
{
  "address": "ABCD...XYZ"
}
```

**Response:**
```json
{
  "success": true,
  "valid": true,
  "message": "Valid Qubic address"
}
```

### GET /api/wallet/:address/transactions

Get transaction history for an address.

**Query Parameters:**
- `limit`: Maximum number of transactions (default: 50)

**Response:**
```json
{
  "success": true,
  "transactions": [
    {
      "id": "uuid",
      "type": "EARNING",
      "amount": 100,
      "status": "COMPLETED",
      "qubicTxHash": "QBX...",
      "createdAt": "2024-11-30T12:00:00.000Z",
      "job": {
        "id": "uuid",
        "modelType": "llama-2",
        "status": "COMPLETED"
      }
    }
  ],
  "count": 1
}
```

### POST /api/wallet/disconnect

Disconnect wallet (cleanup).

**Response:**
```json
{
  "success": true,
  "message": "Wallet disconnected successfully"
}
```

## Address Validation

Qubic addresses must meet the following criteria:
- Exactly 60 characters long
- Uppercase letters only (A-Z)
- Valid checksum (verified by qubic-wallet service)

Example valid address:
```
ABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGH
```

## Balance Queries

The wallet service attempts to fetch balances in the following order:

1. **qubic-real service**: Direct RPC call to Qubic network
2. **qubic-wallet service**: Using QubicConnector (if initialized)
3. **Database fallback**: Cached balance from last successful query

This ensures the system remains functional even if blockchain connectivity is temporarily unavailable.

## Database Schema

The wallet integration uses the following Prisma models:

```prisma
model User {
  id            String    @id @default(uuid())
  qubicAddress  String    @unique
  email         String?   @unique
  username      String?
  role          Role      @default(CONSUMER)
  balance       Float     @default(0)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  providers     Provider[]
  jobs          Job[]
  transactions  Transaction[]
}

model Transaction {
  id              String    @id @default(uuid())
  userId          String
  user            User      @relation(fields: [userId], references: [id])
  jobId           String?   @unique
  job             Job?      @relation(fields: [jobId], references: [id])
  
  type            TransactionType
  amount          Float
  status          TransactionStatus
  
  qubicTxHash     String?
  
  createdAt       DateTime  @default(now())
  completedAt     DateTime?
}
```

## Usage Examples

### Frontend Integration

```typescript
// Connect wallet
const connectWallet = async (address: string) => {
  const response = await fetch('/api/wallet/connect', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      qubicAddress: address,
      email: 'user@example.com',
      username: 'myusername'
    })
  });
  
  const data = await response.json();
  
  if (data.success) {
    console.log('Connected!', data.user);
    console.log('Balance:', data.balance, 'QUBIC');
  } else {
    console.error('Connection failed:', data.message);
  }
};

// Get balance
const getBalance = async (address: string) => {
  const response = await fetch(`/api/wallet/${address}/balance`);
  const data = await response.json();
  
  if (data.success) {
    console.log('Balance:', data.balance, 'QUBIC');
    console.log('Pending:', data.pendingEarnings, 'QUBIC');
  }
};

// Validate address
const validateAddress = async (address: string) => {
  const response = await fetch('/api/wallet/validate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address })
  });
  
  const data = await response.json();
  return data.valid;
};
```

### Backend Service Usage

```typescript
import { walletService } from './services/wallet.service';

// Validate address
const isValid = walletService.validateAddress(address);

// Connect wallet
const result = await walletService.connectWallet({
  qubicAddress: address,
  email: 'user@example.com'
});

// Get balance
const balance = await walletService.getBalance(address);

// Update balance after transaction
await walletService.updateBalance(userId, 100, 'EARNING');
```

## Testing

### Run Integration Tests

```bash
# Test wallet service
npm run tsx src/scripts/test-wallet-integration.ts

# Test wallet API
npm run tsx src/scripts/test-wallet-api.ts
```

### Manual Testing with curl

```bash
# Validate address
curl -X POST http://localhost:3001/api/wallet/validate \
  -H "Content-Type: application/json" \
  -d '{"address":"ABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGH"}'

# Connect wallet
curl -X POST http://localhost:3001/api/wallet/connect \
  -H "Content-Type: application/json" \
  -d '{
    "qubicAddress":"ABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGH",
    "email":"test@example.com",
    "username":"testuser"
  }'

# Get balance
curl http://localhost:3001/api/wallet/ABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGH/balance
```

## Error Handling

The wallet integration includes comprehensive error handling:

1. **Invalid Address Format**: Returns 400 with clear error message
2. **Blockchain Connection Failure**: Falls back to cached balance
3. **Database Errors**: Logged and returned as 500 errors
4. **Missing Required Fields**: Returns 400 with validation error

## Security Considerations

1. **Address Validation**: All addresses are validated before processing
2. **SQL Injection**: Protected by Prisma ORM parameterized queries
3. **Rate Limiting**: Should be added in production (not yet implemented)
4. **Signature Verification**: Placeholder for future authentication

## Future Enhancements

1. **Signature-based Authentication**: Verify wallet ownership via signed messages
2. **WebSocket Balance Updates**: Real-time balance notifications
3. **Multi-wallet Support**: Allow users to connect multiple wallets
4. **Transaction Broadcasting**: Direct transaction submission to blockchain
5. **Gas Fee Estimation**: Calculate transaction costs before submission

## Dependencies

- `@prisma/client`: Database ORM
- `@qubic-lib/qubic-ts-library`: Qubic blockchain integration
- `express`: Web framework
- `dotenv`: Environment configuration

## Environment Variables

```env
DATABASE_URL=postgresql://user:password@localhost:5432/qubix
QUBIC_NETWORK=testnet
QUBIC_RPC_URL=https://testnet-rpc.qubic.org
```

## Troubleshooting

### "Invalid Qubic address format" error
- Ensure address is exactly 60 uppercase characters
- Check for any whitespace or special characters

### Balance returns 0
- Verify blockchain connectivity
- Check if address has been funded
- Confirm RPC endpoint is accessible

### Database connection errors
- Verify DATABASE_URL is correct
- Ensure PostgreSQL is running
- Run `npm run migrate` to apply schema

## Support

For issues or questions:
1. Check the logs for detailed error messages
2. Verify environment configuration
3. Test with the provided test scripts
4. Review the Qubic SDK documentation

