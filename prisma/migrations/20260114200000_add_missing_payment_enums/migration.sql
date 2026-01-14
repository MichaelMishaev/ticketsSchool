-- CreateEnum (if not exists) - Payment and Event related enums
-- These enums were added to the schema but never migrated

-- EventType enum
DO $$ BEGIN
    CREATE TYPE "public"."EventType" AS ENUM ('CAPACITY_BASED', 'TABLE_BASED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- PaymentTiming enum
DO $$ BEGIN
    CREATE TYPE "public"."PaymentTiming" AS ENUM ('OPTIONAL', 'UPFRONT', 'POST_REGISTRATION');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- PricingModel enum
DO $$ BEGIN
    CREATE TYPE "public"."PricingModel" AS ENUM ('FIXED_PRICE', 'PER_GUEST', 'FREE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- PaymentStatus enum
DO $$ BEGIN
    CREATE TYPE "public"."PaymentStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CancellationSource enum
DO $$ BEGIN
    CREATE TYPE "public"."CancellationSource" AS ENUM ('CUSTOMER', 'ADMIN', 'SYSTEM');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- SubscriptionPlan enum
DO $$ BEGIN
    CREATE TYPE "public"."SubscriptionPlan" AS ENUM ('FREE', 'STARTER', 'PRO', 'ENTERPRISE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- SubscriptionStatus enum
DO $$ BEGIN
    CREATE TYPE "public"."SubscriptionStatus" AS ENUM ('ACTIVE', 'TRIAL', 'PAST_DUE', 'CANCELED', 'PAUSED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add Payment table if it doesn't exist
CREATE TABLE IF NOT EXISTS "public"."Payment" (
    "id" TEXT NOT NULL,
    "registrationId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "amount" DECIMAL(10, 2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'ILS',
    "status" "public"."PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "yaadPayOrderId" TEXT,
    "yaadPayMasof" TEXT,
    "yaadPayConfirmCode" TEXT,
    "yaadPayCCode" INTEGER,
    "yaadPayTransactionId" TEXT,
    "paymentMethod" TEXT,
    "payerEmail" TEXT,
    "payerPhone" TEXT,
    "payerName" TEXT,
    "refundedAt" TIMESTAMP(3),
    "refundAmount" DECIMAL(10, 2),
    "refundReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "schoolId" TEXT NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- Add Payment indexes if they don't exist
CREATE UNIQUE INDEX IF NOT EXISTS "Payment_registrationId_key" ON "public"."Payment"("registrationId");
CREATE UNIQUE INDEX IF NOT EXISTS "Payment_yaadPayOrderId_key" ON "public"."Payment"("yaadPayOrderId");
CREATE INDEX IF NOT EXISTS "Payment_schoolId_idx" ON "public"."Payment"("schoolId");
CREATE INDEX IF NOT EXISTS "Payment_eventId_idx" ON "public"."Payment"("eventId");
CREATE INDEX IF NOT EXISTS "Payment_status_idx" ON "public"."Payment"("status");
CREATE INDEX IF NOT EXISTS "Payment_createdAt_idx" ON "public"."Payment"("createdAt");

-- Add foreign keys for Payment table (skip if already exists)
DO $$ BEGIN
    ALTER TABLE "public"."Payment" ADD CONSTRAINT "Payment_registrationId_fkey"
    FOREIGN KEY ("registrationId") REFERENCES "public"."Registration"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "public"."Payment" ADD CONSTRAINT "Payment_eventId_fkey"
    FOREIGN KEY ("eventId") REFERENCES "public"."Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "public"."Payment" ADD CONSTRAINT "Payment_schoolId_fkey"
    FOREIGN KEY ("schoolId") REFERENCES "public"."School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add eventType column to Event table if it doesn't exist
DO $$ BEGIN
    ALTER TABLE "public"."Event" ADD COLUMN "eventType" "public"."EventType" NOT NULL DEFAULT 'CAPACITY_BASED';
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- Add table-based event columns
DO $$ BEGIN
    ALTER TABLE "public"."Event" ADD COLUMN "allowCancellation" BOOLEAN NOT NULL DEFAULT true;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "public"."Event" ADD COLUMN "cancellationDeadlineHours" INTEGER NOT NULL DEFAULT 2;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "public"."Event" ADD COLUMN "requireCancellationReason" BOOLEAN NOT NULL DEFAULT false;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- Add check-in token column
DO $$ BEGIN
    ALTER TABLE "public"."Event" ADD COLUMN "checkInToken" TEXT;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "Event_checkInToken_key" ON "public"."Event"("checkInToken");

-- Add payment-related columns to Event table if they don't exist
DO $$ BEGIN
    ALTER TABLE "public"."Event" ADD COLUMN "paymentRequired" BOOLEAN NOT NULL DEFAULT false;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "public"."Event" ADD COLUMN "paymentTiming" "public"."PaymentTiming" NOT NULL DEFAULT 'OPTIONAL';
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "public"."Event" ADD COLUMN "pricingModel" "public"."PricingModel" NOT NULL DEFAULT 'FREE';
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "public"."Event" ADD COLUMN "priceAmount" DECIMAL(10, 2);
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "public"."Event" ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'ILS';
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- Add payment-related columns to Registration table if they don't exist
DO $$ BEGIN
    ALTER TABLE "public"."Registration" ADD COLUMN "paymentStatus" "public"."PaymentStatus" DEFAULT 'PENDING';
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- Update any NULL paymentStatus to PENDING
UPDATE "public"."Registration" SET "paymentStatus" = 'PENDING' WHERE "paymentStatus" IS NULL;

-- Add cancelledBy column if it doesn't exist (was probably missing from earlier migrations)
DO $$ BEGIN
    ALTER TABLE "public"."Registration" ADD COLUMN "cancelledBy" "public"."CancellationSource" DEFAULT 'CUSTOMER';
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- Update any NULL cancelledBy to CUSTOMER
UPDATE "public"."Registration" SET "cancelledBy" = 'CUSTOMER' WHERE "cancelledBy" IS NULL;

-- Add indexes for payment fields if they don't exist
CREATE INDEX IF NOT EXISTS "Registration_paymentStatus_idx" ON "public"."Registration"("paymentStatus");
CREATE UNIQUE INDEX IF NOT EXISTS "Registration_paymentIntentId_key" ON "public"."Registration"("paymentIntentId");

-- Add guestsCount column for table-based events
DO $$ BEGIN
    ALTER TABLE "public"."Registration" ADD COLUMN "guestsCount" INTEGER;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- Add waitlistPriority column
DO $$ BEGIN
    ALTER TABLE "public"."Registration" ADD COLUMN "waitlistPriority" INTEGER;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- Add QR code column
DO $$ BEGIN
    ALTER TABLE "public"."Registration" ADD COLUMN "qrCode" TEXT;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "Registration_qrCode_key" ON "public"."Registration"("qrCode");

-- Add cancellation columns
DO $$ BEGIN
    ALTER TABLE "public"."Registration" ADD COLUMN "cancellationToken" TEXT;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "public"."Registration" ADD COLUMN "cancelledAt" TIMESTAMP(3);
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "public"."Registration" ADD COLUMN "cancellationReason" TEXT;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "Registration_cancellationToken_key" ON "public"."Registration"("cancellationToken");
CREATE INDEX IF NOT EXISTS "Registration_cancellationToken_idx" ON "public"."Registration"("cancellationToken");
CREATE INDEX IF NOT EXISTS "Registration_eventId_waitlistPriority_idx" ON "public"."Registration"("eventId", "waitlistPriority");
CREATE INDEX IF NOT EXISTS "Registration_qrCode_idx" ON "public"."Registration"("qrCode");

-- Add School billing columns if missing
DO $$ BEGIN
    ALTER TABLE "public"."School" ADD COLUMN "plan" "public"."SubscriptionPlan" NOT NULL DEFAULT 'FREE';
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "public"."School" ADD COLUMN "subscriptionStatus" "public"."SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE';
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "public"."School" ADD COLUMN "stripeCustomerId" TEXT;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "public"."School" ADD COLUMN "stripeSubscriptionId" TEXT;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "public"."School" ADD COLUMN "trialEndsAt" TIMESTAMP(3);
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "public"."School" ADD COLUMN "subscriptionEndsAt" TIMESTAMP(3);
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "School_stripeCustomerId_key" ON "public"."School"("stripeCustomerId");
CREATE UNIQUE INDEX IF NOT EXISTS "School_stripeSubscriptionId_key" ON "public"."School"("stripeSubscriptionId");
CREATE INDEX IF NOT EXISTS "School_plan_idx" ON "public"."School"("plan");

DO $$ BEGIN
    ALTER TABLE "public"."Registration" ADD COLUMN "paymentIntentId" TEXT;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "public"."Registration" ADD COLUMN "amountDue" DECIMAL(10, 2);
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "public"."Registration" ADD COLUMN "amountPaid" DECIMAL(10, 2);
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;
