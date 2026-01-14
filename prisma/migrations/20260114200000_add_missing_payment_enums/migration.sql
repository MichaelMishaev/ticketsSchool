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
