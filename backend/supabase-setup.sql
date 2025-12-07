-- ============================================
-- QUBIX - SQL para executar no Supabase Dashboard
-- ============================================
-- INSTRUÇÕES:
-- 1. Acesse: https://supabase.com/dashboard
-- 2. Selecione seu projeto
-- 3. Vá em "SQL Editor"
-- 4. Cole este SQL e clique em "RUN"
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create ENUMS
CREATE TYPE "Role" AS ENUM ('CONSUMER', 'PROVIDER', 'BOTH');
CREATE TYPE "ProviderType" AS ENUM ('BROWSER', 'NATIVE');
CREATE TYPE "JobStatus" AS ENUM ('PENDING', 'ASSIGNED', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED');
CREATE TYPE "TransactionType" AS ENUM ('DEPOSIT', 'WITHDRAWAL', 'PAYMENT', 'REFUND', 'ESCROW_HOLD', 'ESCROW_RELEASE');
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- Users Table
CREATE TABLE "User" (
    "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    "qubicAddress" TEXT UNIQUE NOT NULL,
    "email" TEXT UNIQUE,
    "username" TEXT,
    "role" "Role" DEFAULT 'CONSUMER' NOT NULL,
    "balance" DOUBLE PRECISION DEFAULT 0 NOT NULL,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Providers Table
CREATE TABLE "Provider" (
    "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    "workerId" TEXT UNIQUE NOT NULL,
    "userId" TEXT NOT NULL,
    "qubicAddress" TEXT NOT NULL,
    "type" "ProviderType" NOT NULL,
    "name" TEXT,
    "gpuModel" TEXT NOT NULL,
    "gpuVram" DOUBLE PRECISION NOT NULL,
    "cpuModel" TEXT,
    "cpuCores" INTEGER,
    "ramTotal" DOUBLE PRECISION,
    "location" TEXT,
    "pricePerHour" DOUBLE PRECISION NOT NULL,
    "isOnline" BOOLEAN DEFAULT false NOT NULL,
    "isAvailable" BOOLEAN DEFAULT true NOT NULL,
    "totalEarnings" DOUBLE PRECISION DEFAULT 0 NOT NULL,
    "totalJobs" INTEGER DEFAULT 0 NOT NULL,
    "registeredAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "lastHeartbeat" TIMESTAMP(3),
    CONSTRAINT "Provider_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

-- Provider Metrics Table
CREATE TABLE "ProviderMetric" (
    "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    "providerId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "cpuPercent" DOUBLE PRECISION,
    "ramPercent" DOUBLE PRECISION,
    "gpuPercent" DOUBLE PRECISION,
    "gpuTemp" DOUBLE PRECISION,
    "gpuMemUsed" DOUBLE PRECISION,
    CONSTRAINT "ProviderMetric_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE CASCADE
);

-- Jobs Table
CREATE TABLE "Job" (
    "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    "userId" TEXT NOT NULL,
    "providerId" TEXT,
    "modelType" TEXT NOT NULL,
    "status" "JobStatus" DEFAULT 'PENDING' NOT NULL,
    "progress" INTEGER DEFAULT 0 NOT NULL,
    "inputData" JSONB,
    "outputData" JSONB,
    "estimatedCost" DOUBLE PRECISION NOT NULL,
    "actualCost" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "error" TEXT,
    CONSTRAINT "Job_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
    CONSTRAINT "Job_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE SET NULL
);

-- Transactions Table
CREATE TABLE "Transaction" (
    "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    "userId" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" "TransactionStatus" DEFAULT 'PENDING' NOT NULL,
    "qubicTxHash" TEXT,
    "jobId" TEXT,
    "providerId" TEXT,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "completedAt" TIMESTAMP(3),
    "metadata" JSONB,
    CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
    CONSTRAINT "Transaction_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE SET NULL,
    CONSTRAINT "Transaction_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE SET NULL
);

-- Create Indexes
CREATE INDEX "Provider_userId_idx" ON "Provider"("userId");
CREATE INDEX "Provider_qubicAddress_idx" ON "Provider"("qubicAddress");
CREATE INDEX "Provider_isOnline_isAvailable_idx" ON "Provider"("isOnline", "isAvailable");
CREATE INDEX "ProviderMetric_providerId_timestamp_idx" ON "ProviderMetric"("providerId", "timestamp");
CREATE INDEX "Job_userId_idx" ON "Job"("userId");
CREATE INDEX "Job_providerId_idx" ON "Job"("providerId");
CREATE INDEX "Job_status_idx" ON "Job"("status");
CREATE INDEX "Transaction_userId_idx" ON "Transaction"("userId");
CREATE INDEX "Transaction_jobId_idx" ON "Transaction"("jobId");
CREATE INDEX "Transaction_providerId_idx" ON "Transaction"("providerId");

-- Insert test data
INSERT INTO "User" ("id", "qubicAddress", "username", "role", "balance", "updatedAt")
VALUES ('test-user-1', 'TESTQUBICADDRESS1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ12345', 'demo_user', 'BOTH', 1000.0, CURRENT_TIMESTAMP);

INSERT INTO "Provider" ("id", "workerId", "userId", "qubicAddress", "type", "name", "gpuModel", "gpuVram", "cpuModel", "cpuCores", "ramTotal", "location", "pricePerHour", "isOnline", "isAvailable")
VALUES ('test-provider-1', 'worker-demo-001', 'test-user-1', 'TESTQUBICADDRESS1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ12345', 'NATIVE', 'Demo GPU', 'NVIDIA RTX 4090', 24.0, 'AMD Ryzen 9 5950X', 16, 64.0, 'São Paulo, Brazil', 1.5, true, true);

-- Verify
SELECT 'Setup Complete!' as status, 
       (SELECT COUNT(*) FROM "User") as users,
       (SELECT COUNT(*) FROM "Provider") as providers;
