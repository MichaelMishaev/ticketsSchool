-- AlterTable: Add onboarding and OAuth fields to Admin table
ALTER TABLE "Admin"
  ADD COLUMN IF NOT EXISTS "emailVerified" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "verificationToken" TEXT,
  ADD COLUMN IF NOT EXISTS "resetToken" TEXT,
  ADD COLUMN IF NOT EXISTS "resetTokenExpiry" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "googleId" TEXT,
  ADD COLUMN IF NOT EXISTS "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "lastLoginAt" TIMESTAMP(3);

-- Make passwordHash nullable (for OAuth-only users)
ALTER TABLE "Admin" ALTER COLUMN "passwordHash" DROP NOT NULL;

-- Create unique indexes
CREATE UNIQUE INDEX IF NOT EXISTS "Admin_verificationToken_key" ON "Admin"("verificationToken");
CREATE UNIQUE INDEX IF NOT EXISTS "Admin_resetToken_key" ON "Admin"("resetToken");
CREATE UNIQUE INDEX IF NOT EXISTS "Admin_googleId_key" ON "Admin"("googleId");

-- Create regular indexes
CREATE INDEX IF NOT EXISTS "Admin_verificationToken_idx" ON "Admin"("verificationToken");
CREATE INDEX IF NOT EXISTS "Admin_resetToken_idx" ON "Admin"("resetToken");
CREATE INDEX IF NOT EXISTS "Admin_googleId_idx" ON "Admin"("googleId");
