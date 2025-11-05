-- AlterTable
ALTER TABLE "Registration" DROP CONSTRAINT "Registration_eventId_phoneNumber_key";

-- CreateIndex
CREATE INDEX "Registration_eventId_phoneNumber_idx" ON "Registration"("eventId", "phoneNumber");

