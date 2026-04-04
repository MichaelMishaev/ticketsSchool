-- Add PAYMENT_PENDING to RegistrationStatus enum
-- NOTE: ALTER TYPE ... ADD VALUE cannot run inside a transaction in PostgreSQL.
-- This migration intentionally runs outside a transaction.
ALTER TYPE "public"."RegistrationStatus" ADD VALUE IF NOT EXISTS 'PAYMENT_PENDING';
