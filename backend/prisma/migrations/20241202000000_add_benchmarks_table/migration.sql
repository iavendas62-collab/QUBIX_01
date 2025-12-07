-- CreateTable
CREATE TABLE "Benchmark" (
    "id" TEXT NOT NULL,
    "jobType" TEXT NOT NULL,
    "gpuModel" TEXT NOT NULL,
    "baseTimeSeconds" INTEGER NOT NULL,
    "epochs" INTEGER,
    "resolution" INTEGER,
    "datasetSize" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Benchmark_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Benchmark_jobType_idx" ON "Benchmark"("jobType");

-- CreateIndex
CREATE INDEX "Benchmark_gpuModel_idx" ON "Benchmark"("gpuModel");

-- CreateIndex
CREATE UNIQUE INDEX "Benchmark_jobType_gpuModel_key" ON "Benchmark"("jobType", "gpuModel");
