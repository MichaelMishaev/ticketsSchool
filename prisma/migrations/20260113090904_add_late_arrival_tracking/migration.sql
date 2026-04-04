-- AlterTable: Add late arrival tracking fields to CheckIn table
ALTER TABLE "CheckIn" ADD COLUMN "isLate" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "minutesLate" INTEGER;

-- CreateIndex: Add index on isLate for filtering late arrivals
CREATE INDEX "CheckIn_isLate_idx" ON "CheckIn"("isLate");
