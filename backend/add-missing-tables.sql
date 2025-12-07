-- ============================================
-- SQL para adicionar tabelas faltantes no Supabase
-- Execute este SQL no Supabase SQL Editor
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

-- Índice para melhorar performance de queries por jobId e timestamp
CREATE INDEX IF NOT EXISTS "JobLog_jobId_timestamp_idx" ON "JobLog"("jobId", "timestamp");

-- ============================================

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

-- Índice para melhorar performance de queries por jobId e timestamp
CREATE INDEX IF NOT EXISTS "JobMetric_jobId_timestamp_idx" ON "JobMetric"("jobId", "timestamp");

-- ============================================

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
  
  -- Constraint único para evitar duplicatas
  CONSTRAINT "Benchmark_jobType_gpuModel_key" UNIQUE ("jobType", "gpuModel")
);

-- Índices para melhorar performance de queries
CREATE INDEX IF NOT EXISTS "Benchmark_jobType_idx" ON "Benchmark"("jobType");
CREATE INDEX IF NOT EXISTS "Benchmark_gpuModel_idx" ON "Benchmark"("gpuModel");

-- ============================================
-- Comentários explicativos
-- ============================================

COMMENT ON TABLE "JobLog" IS 'Logs de execução dos jobs (info, warning, error)';
COMMENT ON TABLE "JobMetric" IS 'Métricas em tempo real de GPU durante execução dos jobs';
COMMENT ON TABLE "Benchmark" IS 'Benchmarks de performance por tipo de job e GPU';

-- ============================================
-- Verificação final
-- ============================================

-- Liste todas as tabelas para confirmar
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('JobLog', 'JobMetric', 'Benchmark')
ORDER BY table_name;
