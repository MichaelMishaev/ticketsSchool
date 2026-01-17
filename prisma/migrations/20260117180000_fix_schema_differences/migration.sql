-- Migration: Fix schema differences between local and production
-- This migration converts text columns to proper enum types and adds missing indexes
--
-- IMPORTANT: This migration has already been applied to production manually.
-- Prisma will skip it on production because it's recorded in _prisma_migrations.

-- ============================================================================
-- Step 1: Convert Event.paymentTiming from TEXT to PaymentTiming enum
-- ============================================================================
-- Ensure all existing values are valid enum values
UPDATE "Event" SET "paymentTiming" = 'OPTIONAL'
WHERE "paymentTiming" IS NULL OR "paymentTiming" NOT IN ('OPTIONAL', 'UPFRONT', 'POST_REGISTRATION');

-- Drop the text default, convert to enum, then re-add enum default
ALTER TABLE "Event" ALTER COLUMN "paymentTiming" DROP DEFAULT;
ALTER TABLE "Event" ALTER COLUMN "paymentTiming" TYPE "PaymentTiming" USING "paymentTiming"::"PaymentTiming";
ALTER TABLE "Event" ALTER COLUMN "paymentTiming" SET DEFAULT 'OPTIONAL'::"PaymentTiming";

-- ============================================================================
-- Step 2: Convert Event.pricingModel from TEXT to PricingModel enum
-- ============================================================================
-- Ensure all existing values are valid enum values
UPDATE "Event" SET "pricingModel" = 'FIXED_PRICE'
WHERE "pricingModel" IS NULL OR "pricingModel" NOT IN ('FIXED_PRICE', 'PER_GUEST', 'FREE');

-- Drop the text default, convert to enum, then re-add enum default
ALTER TABLE "Event" ALTER COLUMN "pricingModel" DROP DEFAULT;
ALTER TABLE "Event" ALTER COLUMN "pricingModel" TYPE "PricingModel" USING "pricingModel"::"PricingModel";
ALTER TABLE "Event" ALTER COLUMN "pricingModel" SET DEFAULT 'FIXED_PRICE'::"PricingModel";

-- ============================================================================
-- Step 3: Add missing indexes (IF NOT EXISTS for idempotency)
-- ============================================================================
-- Index on checkInToken for faster lookups
CREATE INDEX IF NOT EXISTS "Event_checkInToken_idx" ON "Event"("checkInToken");

-- Index on paymentRequired for filtering events by payment status
CREATE INDEX IF NOT EXISTS "Event_paymentRequired_idx" ON "Event"("paymentRequired");
