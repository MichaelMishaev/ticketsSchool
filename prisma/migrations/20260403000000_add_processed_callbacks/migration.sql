-- CreateTable
CREATE TABLE "ProcessedCallback" (
    "id" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProcessedCallback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProcessedCallback_fingerprint_key" ON "ProcessedCallback"("fingerprint");

-- CreateIndex
CREATE INDEX "ProcessedCallback_createdAt_idx" ON "ProcessedCallback"("createdAt");
