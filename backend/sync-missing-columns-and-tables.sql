-- ============================================
-- SQL para sincronizar schema do Supabase com Prisma
-- Adiciona colunas faltantes e tabelas novas
-- ============================================

-- ============================================
-- PARTE 1: Adicionar colunas faltantes nas tabelas existentes
-- ============================================

-- Tabela Job - Adicionar colunas faltantes
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "jobType" TEXT NOT NULL DEFAULT 'custom_script';
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "framework" TEXT;
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "fileName" TEXT NOT NULL DEFAULT 'unknown';
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "fileUrl" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "requiredVRAM" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "requiredCompute" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "requiredRAM" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "advancedConfig" JSONB;
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "currentOperation" TEXT;
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "estimatedDuration" INTEGER;
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "actualDuration" INTEGER;
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "escrowTxHash" TEXT;
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "releaseTxHash" TEXT;

-- Tabela Transaction - Adicionar coluna faltante
ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS "confirmations" INTEGER NOT NULL DEFAULT 0;

-- ============================================
-- PARTE 2: Criar índices faltantes
-- ============================================

-- Índices para Transaction
CREATE INDEX IF NOT EXISTS "Transaction_userId_createdAt_idx" ON "Transaction"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "Transaction_qubicTxHash_idx" ON "Transaction"("qubicTxHash");

-- Índice para ProviderMetric
CREATE INDEX IF NOT EXISTS "ProviderMetric_providerId_timestamp_idx" ON "ProviderMetric"("providerId", "timestamp");

-- ============================================
-- PARTE 3: Criar tabelas faltantes
-- ============================================

-- Tabela: JobLog
-- Armazena logs de execução dos jobs
CREATE TABLE IF NOT EXISTS "JobLog" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "jobId" TEXT NOT NULL,
  "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "level" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  
  CONSTRAINT "JobLog_jobId_fkey" FOREIGN KEY ("jobId") 
    REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "JobLog_jobId_timestamp_idx" ON "JobLog"("jobId", "timestamp");

-- Tabela: JobMetric
-- Armazena métricas em tempo real dos jobs (GPU, memória, etc)
CREATE TABLE IF NOT EXISTS "JobMetric" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "jobId" TEXT NOT NULL,
  "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "gpuUtilization" DOUBLE PRECISION,
  "gpuMemoryUsed" DOUBLE PRECISION,
  "gpuMemoryTotal" DOUBLE PRECISION,
  "gpuTemperature" DOUBLE PRECISION,
  "powerUsage" DOUBLE PRECISION,
  
  CONSTRAINT "JobMetric_jobId_fkey" FOREIGN KEY ("jobId") 
    REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "JobMetric_jobId_timestamp_idx" ON "JobMetric"("jobId", "timestamp");

-- Tabela: Benchmark
-- Armazena benchmarks de performance por tipo de job e modelo de GPU
CREATE TABLE IF NOT EXISTS "Benchmark" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "jobType" TEXT NOT NULL,
  "gpuModel" TEXT NOT NULL,
  "baseTimeSeconds" INTEGER NOT NULL,
  "epochs" INTEGER,
  "resolution" INTEGER,
  "datasetSize" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "Benchmark_jobType_gpuModel_key" UNIQUE ("jobType", "gpuModel")
);

CREATE INDEX IF NOT EXISTS "Benchmark_jobType_idx" ON "Benchmark"("jobType");
CREATE INDEX IF NOT EXISTS "Benchmark_gpuModel_idx" ON "Benchmark"("gpuModel");

-- ============================================
-- PARTE 4: Comentários explicativos
-- ============================================

COMMENT ON TABLE "JobLog" IS 'Logs de execução dos jobs (info, warning, error)';
COMMENT ON TABLE "JobMetric" IS 'Métricas em tempo real de GPU durante execução dos jobs';
COMMENT ON TABLE "Benchmark" IS 'Benchmarks de performance por tipo de job e GPU';

COMMENT ON COLUMN "Job"."jobType" IS 'Tipo do job: training, inference, custom_script, etc';
COMMENT ON COLUMN "Job"."framework" IS 'Framework usado: pytorch, tensorflow, etc';
COMMENT ON COLUMN "Job"."fileName" IS 'Nome do arquivo enviado pelo usuário';
COMMENT ON COLUMN "Job"."fileUrl" IS 'URL do arquivo no storage';
COMMENT ON COLUMN "Job"."requiredVRAM" IS 'VRAM mínima necessária em GB';
COMMENT ON COLUMN "Job"."requiredCompute" IS 'Poder computacional necessário';
COMMENT ON COLUMN "Job"."requiredRAM" IS 'RAM mínima necessária em GB';
COMMENT ON COLUMN "Job"."escrowTxHash" IS 'Hash da transação de escrow no Qubic';
COMMENT ON COLUMN "Job"."releaseTxHash" IS 'Hash da transação de release do escrow';

-- ============================================
-- PARTE 5: Verificação final
-- ============================================

-- Liste todas as tabelas QUBIX
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('User', 'Provider', 'Job', 'Transaction', 'ProviderMetric', 'JobLog', 'JobMetric', 'Benchmark')
ORDER BY table_name;

-- Conte as colunas da tabela Job
SELECT COUNT(*) as total_colunas_job
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'Job';
