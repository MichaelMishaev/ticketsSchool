-- CreateEnum
CREATE TYPE "public"."UsageResourceType" AS ENUM ('EVENT_CREATED', 'REGISTRATION_PROCESSED', 'EMAIL_SENT', 'SMS_SENT', 'API_CALL', 'STORAGE_MB');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."AdminRole" ADD VALUE 'ADMIN';
ALTER TYPE "public"."AdminRole" ADD VALUE 'MANAGER';
ALTER TYPE "public"."AdminRole" ADD VALUE 'VIEWER';

-- AlterEnum
BEGIN;
CREATE TYPE "public"."InvitationStatus_new" AS ENUM ('PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED');
ALTER TABLE "public"."TeamInvitation" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "public"."TeamInvitation" ALTER COLUMN "status" TYPE "public"."InvitationStatus_new" USING ("status"::text::"public"."InvitationStatus_new");
ALTER TYPE "public"."InvitationStatus" RENAME TO "InvitationStatus_old";
ALTER TYPE "public"."InvitationStatus_new" RENAME TO "InvitationStatus";
DROP TYPE "public"."InvitationStatus_old";
ALTER TABLE "public"."TeamInvitation" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "public"."TableStatus_new" AS ENUM ('AVAILABLE', 'RESERVED', 'INACTIVE');
ALTER TABLE "public"."Table" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "public"."Table" ALTER COLUMN "status" TYPE "public"."TableStatus_new" USING ("status"::text::"public"."TableStatus_new");
ALTER TYPE "public"."TableStatus" RENAME TO "TableStatus_old";
ALTER TYPE "public"."TableStatus_new" RENAME TO "TableStatus";
DROP TYPE "public"."TableStatus_old";
ALTER TABLE "public"."Table" ALTER COLUMN "status" SET DEFAULT 'AVAILABLE';
COMMIT;

-- AlterTable
ALTER TABLE "public"."Event" ALTER COLUMN "eventType" SET NOT NULL,
ALTER COLUMN "allowCancellation" SET NOT NULL,
ALTER COLUMN "cancellationDeadlineHours" SET NOT NULL,
ALTER COLUMN "requireCancellationReason" SET NOT NULL;

-- AlterTable
ALTER TABLE "public"."Registration" DROP COLUMN "schoolId",
ALTER COLUMN "cancelledBy" SET NOT NULL;

-- AlterTable
ALTER TABLE "public"."School" ALTER COLUMN "plan" SET NOT NULL,
ALTER COLUMN "subscriptionStatus" SET NOT NULL,
ALTER COLUMN "trialEndsAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "subscriptionEndsAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."TeamInvitation" ADD COLUMN     "invitedById" TEXT NOT NULL,
DROP COLUMN "role",
ADD COLUMN     "role" "public"."AdminRole" NOT NULL DEFAULT 'ADMIN';

-- CreateTable
CREATE TABLE "public"."UsageRecord" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "resourceType" "public"."UsageResourceType" NOT NULL,
    "amount" INTEGER NOT NULL DEFAULT 1,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UsageRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UsageRecord_schoolId_idx" ON "public"."UsageRecord"("schoolId");

-- CreateIndex
CREATE INDEX "UsageRecord_schoolId_year_month_idx" ON "public"."UsageRecord"("schoolId", "year", "month");

-- CreateIndex
CREATE INDEX "UsageRecord_resourceType_idx" ON "public"."UsageRecord"("resourceType");

-- CreateIndex
CREATE UNIQUE INDEX "UsageRecord_schoolId_resourceType_year_month_key" ON "public"."UsageRecord"("schoolId", "resourceType", "year", "month");

-- CreateIndex
CREATE INDEX "Event_eventType_idx" ON "public"."Event"("eventType");

-- CreateIndex
CREATE INDEX "Registration_eventId_waitlistPriority_idx" ON "public"."Registration"("eventId", "waitlistPriority");

-- CreateIndex
CREATE UNIQUE INDEX "School_stripeCustomerId_key" ON "public"."School"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "School_stripeSubscriptionId_key" ON "public"."School"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "TeamInvitation_status_idx" ON "public"."TeamInvitation"("status");

-- CreateIndex
CREATE UNIQUE INDEX "TeamInvitation_email_schoolId_key" ON "public"."TeamInvitation"("email", "schoolId");

-- AddForeignKey
ALTER TABLE "public"."UsageRecord" ADD CONSTRAINT "UsageRecord_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "public"."School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TeamInvitation" ADD CONSTRAINT "TeamInvitation_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "public"."Admin"("id") ON DELETE CASCADE ON UPDATE CASCADE;

