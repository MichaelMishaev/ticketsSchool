-- Add coverImage field for Unsplash cover photos
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "coverImage" TEXT;

-- Add deletedAt for soft-delete support
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);

-- Index for efficient soft-delete filtering
CREATE INDEX IF NOT EXISTS "Event_deletedAt_idx" ON "Event"("deletedAt");
