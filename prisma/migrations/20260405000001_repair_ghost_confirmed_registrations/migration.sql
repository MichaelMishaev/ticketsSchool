-- Repair ghost CONFIRMED registrations created before PAYMENT_PENDING was introduced.
-- Run AFTER 20260405000000_add_payment_pending_status has been applied.

-- 1. CONFIRMED registrations with a FAILED payment → mark CANCELLED
UPDATE "public"."Registration"
SET status = 'CANCELLED'
WHERE status = 'CONFIRMED' AND "paymentStatus" = 'FAILED';

-- 2. Abandoned PROCESSING registrations older than 2 hours → mark CANCELLED
UPDATE "public"."Registration"
SET status = 'CANCELLED'
WHERE status = 'CONFIRMED'
  AND "paymentStatus" = 'PROCESSING'
  AND "createdAt" < NOW() - INTERVAL '2 hours';
