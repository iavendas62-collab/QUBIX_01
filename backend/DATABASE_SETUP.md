# PostgreSQL Database Setup for QUBIX

This guide will help you set up PostgreSQL for the QUBIX platform.

## Option 1: Using Docker (Recommended)

### Prerequisites
- Docker Desktop installed and running

### Steps

1. **Start PostgreSQL with Docker Compose**
   ```bash
   # From the project root directory
   docker-compose up -d postgres
   ```

2. **Verify PostgreSQL is running**
   ```bash
   docker ps | grep postgres
   ```

3. **Run Prisma migrations**
   ```bash
   cd backend
   npm run migrate
   ```

4. **Seed the database (optional)**
   ```bash
   npm run seed
   ```

## Option 2: Local PostgreSQL Installation

### Windows

1. **Download PostgreSQL**
   - Visit https://www.postgresql.org/download/windows/
   - Download PostgreSQL 14 or higher
   - Run the installer

2. **During installation**
   - Set password for postgres user: `qubix_dev_password`
   - Port: `5432` (default)
   - Remember the installation directory

3. **Add PostgreSQL to PATH**
   - Add `C:\Program Files\PostgreSQL\15\bin` to your system PATH
   - Restart your terminal

4. **Create the database**
   ```cmd
   psql -U postgres
   CREATE DATABASE qubix;
   CREATE USER qubix WITH PASSWORD 'qubix_dev_password';
   GRANT ALL PRIVILEGES ON DATABASE qubix TO qubix;
   \q
   ```

5. **Update .env file**
   ```
   DATABASE_URL="postgresql://qubix:qubix_dev_password@localhost:5432/qubix?schema=public"
   ```

6. **Run Prisma migrations**
   ```bash
   cd backend
   npm run migrate
   ```

### macOS

1. **Install PostgreSQL using Homebrew**
   ```bash
   brew install postgresql@15
   brew services start postgresql@15
   ```

2. **Create the database**
   ```bash
   psql postgres
   CREATE DATABASE qubix;
   CREATE USER qubix WITH PASSWORD 'qubix_dev_password';
   GRANT ALL PRIVILEGES ON DATABASE qubix TO qubix;
   \q
   ```

3. **Update .env file**
   ```
   DATABASE_URL="postgresql://qubix:qubix_dev_password@localhost:5432/qubix?schema=public"
   ```

4. **Run Prisma migrations**
   ```bash
   cd backend
   npm run migrate
   ```

### Linux (Ubuntu/Debian)

1. **Install PostgreSQL**
   ```bash
   sudo apt update
   sudo apt install postgresql postgresql-contrib
   sudo systemctl start postgresql
   sudo systemctl enable postgresql
   ```

2. **Create the database**
   ```bash
   sudo -u postgres psql
   CREATE DATABASE qubix;
   CREATE USER qubix WITH PASSWORD 'qubix_dev_password';
   GRANT ALL PRIVILEGES ON DATABASE qubix TO qubix;
   \q
   ```

3. **Update .env file**
   ```
   DATABASE_URL="postgresql://qubix:qubix_dev_password@localhost:5432/qubix?schema=public"
   ```

4. **Run Prisma migrations**
   ```bash
   cd backend
   npm run migrate
   ```

## Verifying the Setup

1. **Check database connection**
   ```bash
   cd backend
   npx prisma db pull
   ```

2. **View database in Prisma Studio**
   ```bash
   npx prisma studio
   ```
   This will open a web interface at http://localhost:5555

## Database Schema

The database includes the following tables:

- **User**: Platform users (consumers and providers)
- **Provider**: GPU providers with hardware specifications
- **Job**: Compute jobs submitted by consumers
- **Transaction**: Payment transactions on Qubic blockchain
- **ProviderMetric**: Real-time GPU metrics from providers

## Troubleshooting

### Connection refused
- Ensure PostgreSQL is running: `docker ps` or `sudo systemctl status postgresql`
- Check if port 5432 is available: `netstat -an | grep 5432`

### Authentication failed
- Verify credentials in `.env` match your PostgreSQL setup
- Check `pg_hba.conf` for authentication settings

### Migration errors
- Drop and recreate database if needed:
  ```bash
  npx prisma migrate reset
  ```

## Production Setup

For production environments:

1. Use a managed PostgreSQL service (AWS RDS, Google Cloud SQL, etc.)
2. Update `DATABASE_URL` with production credentials
3. Enable SSL: Add `?sslmode=require` to DATABASE_URL
4. Run migrations: `npx prisma migrate deploy`
5. Never commit `.env` file with production credentials
