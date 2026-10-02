-- CreateTable
CREATE TABLE "Job" (
    "workNo" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "clientCode" TEXT,
    "clientName" TEXT,
    "contractDate" DATE,
    "startDate" DATE,
    "plannedDate" DATE,
    "completedDate" DATE,
    "amount" DOUBLE PRECISION,
    "period" TEXT,
    "memo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("workNo")
);

-- CreateTable
CREATE TABLE "PeriodExport" (
    "period" TEXT NOT NULL,
    "exportedAt" TIMESTAMP(3) NOT NULL,
    "rowCount" INTEGER NOT NULL,

    CONSTRAINT "PeriodExport_pkey" PRIMARY KEY ("period")
);

-- CreateIndex
CREATE INDEX "Job_period_createdAt_idx" ON "Job"("period", "createdAt");

-- CreateIndex
CREATE INDEX "Job_kind_idx" ON "Job"("kind");
