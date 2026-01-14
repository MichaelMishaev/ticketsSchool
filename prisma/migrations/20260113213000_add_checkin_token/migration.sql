-- Add check-in token column for event check-in URLs
ALTER TABLE "Event"
ADD COLUMN IF NOT EXISTS "checkInToken" TEXT;

-- Enforce uniqueness on the token
CREATE UNIQUE INDEX IF NOT EXISTS "Event_checkInToken_key" ON "Event"("checkInToken");
