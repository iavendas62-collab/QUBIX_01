# QUBIX Database Setup - Complete Guide

## Overview

This guide covers the complete PostgreSQL database setup for the QUBIX Enterprise Upgrade. The database uses Prisma ORM for type-safe database access and includes all models required for the enterprise-grade GPU marketplace.

## Database Schema

The database includes the following models:

### Core Models

1. **User** - Platform users (consumers, providers, or both)
   - Qubic wallet integration
   - Balance tracking
   - Role-based access

2. **Provider** - GPU providers with hardware specifications
   - Worker identification
   - Hardware specs (GPU, CPU, RAM)
   - Availability and status tracking
   - Earnings and job history

3. **Job** - Compute jobs submitted by consumers
   - Model type and compute requirements
   - Status tracking (PENDING → ASSIGNED → RUNNING → COMPLETED/FAILED)
   - Progress monitoring
   - Cost estimation and actual cost

4. **Transaction** - Payment transactions on Qubic blockchain
   - Escrow lock/release
   - Payment and earning tracking
   - Qubic transaction hash references

5. **ProviderMetric** - Real-time GPU metrics
   - CPU, RAM, GPU utilization
   - Temperature monitoring
   - Time-series data for analytics

## Quick Setup

### Prerequisites

Choose ONE of the following:
- **Option A**: Docker Desktop (recommended for development)
- **Option B**: PostgreSQL 14+ installed locally

### Automated Setup

**Windows:**
```cmd
cd backend
setup-database.bat
```

**Linux/macOS:**
```bash
cd backend
chmod +x setup-database.sh
./setup-database.sh
```

This will:
1. Start PostgreSQL (via Docker or check local installation)
2. Run Prisma migrations
3. Generate Prisma client
4. Optionally seed the database

### Manual Setup

If the automated setup doesn't work, follow these steps:

#### 1. Start PostgreSQL

**Using Docker:**
```bash
# From project root
docker-compose up -d postgres
```

**Using Local PostgreSQL:**
- Ensure PostgreSQL is running
- Create database: `createdb qubix`
- Update `.env` with correct credentials

#### 2. Verify Database Connection

```bash
cd backend
npm run db:verify
```

#### 3. Run Migrations

```bash
npm run migrate
```

This creates all tables, indexes, and relationships.

#### 4. Generate Prisma Client

```bash
npm run generate
```

This generates TypeScript types for database access.

#### 5. Seed Database (Optional)

```bash
npm run seed
```

This creates sample data for testing:
- 3 users (1 consumer, 2 providers)
- 3 GPU providers with different specs
- 4 sample jobs in various states
- 3 transactions
- 10 provider metrics

## Configuration

### Environment Variables

The `.env` file contains database configuration:

```env
DATABASE_URL="postgresql://qubix:qubix_dev_password@localhost:5432/qubix?schema=public"
```

**Format:**
```
postgresql://[user]:[password]@[host]:[port]/[database]?schema=public
```

### Docker Configuration

The `docker-compose.yml` includes PostgreSQL setup:

```yaml
postgres:
  image: postgres:15-alpine
  environment:
    POSTGRES_DB: qubix
    POSTGRES_USER: qubix
    POSTGRES_PASSWORD: qubix_dev_password
  ports:
    - "5432:5432"
```

## Using Prisma

### Basic Usage

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Create a user
const user = await prisma.user.create({
  data: {
    qubicAddress: 'QUBIC_ADDRESS_123',
    email: 'user@example.com',
    role: 'CONSUMER',
    balance: 100.0,
  },
});

// Query providers
const providers = await prisma.provider.findMany({
  where: {
    isOnline: true,
    isAvailable: true,
  },
  include: {
    user: true,
  },
});

// Create a job
const job = await prisma.job.create({
  data: {
    userId: user.id,
    modelType: 'stable-diffusion',
    computeNeeded: 10.0,
    inputData: { prompt: 'A beautiful landscape' },
    estimatedCost: 25.0,
  },
});
```

### Relationships

The schema includes these relationships:

- User → Provider (one-to-many)
- User → Job (one-to-many)
- User → Transaction (one-to-many)
- Provider → Job (one-to-many)
- Provider → ProviderMetric (one-to-many)
- Job → Transaction (one-to-one)

### Querying with Relations

```typescript
// Get user with all their providers
const userWithProviders = await prisma.user.findUnique({
  where: { id: userId },
  include: {
    providers: {
      include: {
        metrics: {
          orderBy: { timestamp: 'desc' },
          take: 10,
        },
      },
    },
  },
});

// Get job with user and provider details
const jobDetails = await prisma.job.findUnique({
  where: { id: jobId },
  include: {
    user: true,
    provider: {
      include: {
        user: true,
      },
    },
    transaction: true,
  },
});
```

## Database Management

### View Database in Prisma Studio

```bash
npm run db:studio
```

Opens a web interface at http://localhost:5555 where you can:
- Browse all tables
- View and edit records
- Run queries
- Inspect relationships

### Create New Migration

After modifying `prisma/schema.prisma`:

```bash
npm run migrate
```

Or with a custom name:

```bash
npx prisma migrate dev --name add_new_field
```

### Reset Database

**Warning: This deletes all data!**

```bash
npm run db:reset
```

This will:
1. Drop all tables
2. Run all migrations
3. Run seed script

### Check Migration Status

```bash
npx prisma migrate status
```

### Deploy Migrations (Production)

```bash
npx prisma migrate deploy
```

## Troubleshooting

### Connection Refused

**Problem:** Can't connect to PostgreSQL

**Solutions:**
1. Check if PostgreSQL is running:
   ```bash
   docker ps | grep postgres
   # OR
   sudo systemctl status postgresql
   ```

2. Verify port 5432 is available:
   ```bash
   netstat -an | grep 5432
   ```

3. Check DATABASE_URL in `.env`

### Authentication Failed

**Problem:** Password authentication failed

**Solutions:**
1. Verify credentials match between `.env` and PostgreSQL
2. For Docker: credentials are in `docker-compose.yml`
3. For local: check `pg_hba.conf` authentication settings

### Migration Errors

**Problem:** Migration fails or schema is out of sync

**Solutions:**
1. Check migration status:
   ```bash
   npx prisma migrate status
   ```

2. Reset database (development only):
   ```bash
   npm run db:reset
   ```

3. Force push schema (development only):
   ```bash
   npx prisma db push --force-reset
   ```

### Prisma Client Not Generated

**Problem:** Import errors for `@prisma/client`

**Solution:**
```bash
npm run generate
```

### Port Already in Use

**Problem:** Port 5432 is already in use

**Solutions:**
1. Stop existing PostgreSQL:
   ```bash
   docker stop $(docker ps -q --filter "ancestor=postgres")
   # OR
   sudo systemctl stop postgresql
   ```

2. Change port in `docker-compose.yml` and `.env`

## Production Deployment

### Preparation

1. **Use Managed Database Service**
   - AWS RDS
   - Google Cloud SQL
   - Azure Database for PostgreSQL
   - DigitalOcean Managed Databases

2. **Update Environment Variables**
   ```env
   DATABASE_URL="postgresql://user:password@production-host:5432/qubix?sslmode=require"
   ```

3. **Enable SSL**
   Add `?sslmode=require` to DATABASE_URL

### Deployment Steps

1. **Run Migrations**
   ```bash
   npx prisma migrate deploy
   ```

2. **Generate Client**
   ```bash
   npx prisma generate
   ```

3. **Verify Connection**
   ```bash
   npx prisma db pull
   ```

### Security Best Practices

1. **Never commit `.env` files**
   - Use environment variables
   - Use secrets management (AWS Secrets Manager, etc.)

2. **Use strong passwords**
   - Minimum 16 characters
   - Mix of letters, numbers, symbols

3. **Enable SSL/TLS**
   - Required for production
   - Use certificate verification

4. **Restrict database access**
   - Whitelist IP addresses
   - Use VPC/private networks
   - Enable firewall rules

5. **Regular backups**
   - Automated daily backups
   - Test restore procedures
   - Keep backups encrypted

6. **Monitor database**
   - Set up alerts for errors
   - Monitor connection pool
   - Track query performance

## Performance Optimization

### Indexes

The schema includes indexes on:
- `ProviderMetric.providerId` and `timestamp` (composite)
- All foreign keys (automatic)
- Unique constraints (automatic)

### Connection Pooling

Configure in Prisma:

```typescript
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: ['query', 'error', 'warn'],
});
```

### Query Optimization

1. **Use `select` to limit fields**
   ```typescript
   const users = await prisma.user.findMany({
     select: { id: true, email: true },
   });
   ```

2. **Use `include` carefully**
   - Only include needed relations
   - Avoid deep nesting

3. **Use pagination**
   ```typescript
   const providers = await prisma.provider.findMany({
     take: 20,
     skip: page * 20,
   });
   ```

## Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [DATABASE_SETUP.md](./DATABASE_SETUP.md) - Detailed setup instructions
- [QUICK_START.md](./QUICK_START.md) - Quick start guide

## Support

If you encounter issues:

1. Check this documentation
2. Run `npm run db:verify` to diagnose issues
3. Check Prisma logs in console
4. Review PostgreSQL logs
5. Consult the team or create an issue

---

**Last Updated:** November 30, 2024
**Schema Version:** 1.0.0 (Initial Migration)
