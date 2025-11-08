-- Migration: Add spotsReserved counter to Event table
-- This counter tracks confirmed registrations atomically to prevent race conditions

-- Add spotsReserved column with default 0
ALTER TABLE "Event" ADD COLUMN "spotsReserved" INTEGER NOT NULL DEFAULT 0;

-- Initialize spotsReserved with current confirmed registrations count
UPDATE "Event" e
SET "spotsReserved" = (
  SELECT COALESCE(SUM(r."spotsCount"), 0)
  FROM "Registration" r
  WHERE r."eventId" = e.id
  AND r.status = 'CONFIRMED'
);

-- Add comment for documentation
COMMENT ON COLUMN "Event"."spotsReserved" IS 'Atomic counter for confirmed spots - prevents race conditions';
