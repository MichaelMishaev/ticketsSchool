-- Fix script to prepare database for add_multi_school_support migration
-- This script must be run BEFORE the migration

-- Step 1: Remove ALL existing migration records for problematic migrations
-- This ensures a clean slate before re-inserting them as successful
DELETE FROM "_prisma_migrations"
WHERE migration_name IN (
    '20250920000000_allow_multiple_registrations_per_phone',
    '20251107211615_add_multi_school_support',
    '20251107_add_spots_reserved'
);

-- Step 1b: Re-insert these migrations as successfully completed
-- This prevents Prisma from trying to run them again
INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
VALUES
    (gen_random_uuid()::text, '', NOW(), '20251107211615_add_multi_school_support', NULL, NULL, NOW(), 1),
    (gen_random_uuid()::text, '', NOW(), '20251107_add_spots_reserved', NULL, NULL, NOW(), 1)
ON CONFLICT DO NOTHING;

-- Step 2: Create enums if they don't exist
DO $$ BEGIN
    CREATE TYPE "public"."AdminRole" AS ENUM ('SUPER_ADMIN', 'OWNER', 'ADMIN', 'MANAGER', 'VIEWER', 'SCHOOL_ADMIN');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "public"."LogLevel" AS ENUM ('DEBUG', 'INFO', 'WARN', 'ERROR');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "public"."FeedbackStatus" AS ENUM ('PENDING', 'REVIEWED', 'RESOLVED', 'DISMISSED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Step 3: Create School table if it doesn't exist
CREATE TABLE IF NOT EXISTS "public"."School" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logo" TEXT,
    "primaryColor" TEXT NOT NULL DEFAULT '#3b82f6',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "School_pkey" PRIMARY KEY ("id")
);

-- Step 4: Create Admin table if it doesn't exist
CREATE TABLE IF NOT EXISTS "public"."Admin" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "name" TEXT NOT NULL,
    "role" "public"."AdminRole" NOT NULL DEFAULT 'SCHOOL_ADMIN',
    "schoolId" TEXT,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "verificationToken" TEXT,
    "resetToken" TEXT,
    "resetTokenExpiry" TIMESTAMP(3),
    "googleId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- Step 5: Create Log table if it doesn't exist
CREATE TABLE IF NOT EXISTS "public"."Log" (
    "id" TEXT NOT NULL,
    "level" "public"."LogLevel" NOT NULL DEFAULT 'INFO',
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "source" TEXT,
    "userId" TEXT,
    "eventId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Log_pkey" PRIMARY KEY ("id")
);

-- Step 6: Create Feedback table if it doesn't exist
CREATE TABLE IF NOT EXISTS "public"."Feedback" (
    "id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "email" TEXT,
    "status" "public"."FeedbackStatus" NOT NULL DEFAULT 'PENDING',
    "adminNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);

-- Step 7: Create all necessary indexes
CREATE UNIQUE INDEX IF NOT EXISTS "School_slug_key" ON "public"."School"("slug");
CREATE INDEX IF NOT EXISTS "School_slug_idx" ON "public"."School"("slug");
CREATE INDEX IF NOT EXISTS "School_isActive_idx" ON "public"."School"("isActive");

CREATE UNIQUE INDEX IF NOT EXISTS "Admin_email_key" ON "public"."Admin"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "Admin_verificationToken_key" ON "public"."Admin"("verificationToken");
CREATE UNIQUE INDEX IF NOT EXISTS "Admin_resetToken_key" ON "public"."Admin"("resetToken");
CREATE UNIQUE INDEX IF NOT EXISTS "Admin_googleId_key" ON "public"."Admin"("googleId");
CREATE INDEX IF NOT EXISTS "Admin_email_idx" ON "public"."Admin"("email");
CREATE INDEX IF NOT EXISTS "Admin_schoolId_idx" ON "public"."Admin"("schoolId");
CREATE INDEX IF NOT EXISTS "Admin_role_idx" ON "public"."Admin"("role");
CREATE INDEX IF NOT EXISTS "Admin_googleId_idx" ON "public"."Admin"("googleId");
CREATE INDEX IF NOT EXISTS "Admin_verificationToken_idx" ON "public"."Admin"("verificationToken");
CREATE INDEX IF NOT EXISTS "Admin_resetToken_idx" ON "public"."Admin"("resetToken");

CREATE INDEX IF NOT EXISTS "Log_level_idx" ON "public"."Log"("level");
CREATE INDEX IF NOT EXISTS "Log_source_idx" ON "public"."Log"("source");
CREATE INDEX IF NOT EXISTS "Log_createdAt_idx" ON "public"."Log"("createdAt");
CREATE INDEX IF NOT EXISTS "Log_eventId_idx" ON "public"."Log"("eventId");

CREATE INDEX IF NOT EXISTS "Feedback_status_idx" ON "public"."Feedback"("status");
CREATE INDEX IF NOT EXISTS "Feedback_createdAt_idx" ON "public"."Feedback"("createdAt");

-- Step 4: Create a default school if it doesn't exist
INSERT INTO "public"."School" ("id", "name", "slug", "primaryColor", "isActive", "createdAt", "updatedAt")
VALUES (
    'default-school-id',
    'Default School',
    'default',
    '#3b82f6',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT (slug) DO NOTHING;

-- Step 5: Add schoolId column as NULLABLE first (if Event table exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Event') THEN
        ALTER TABLE "public"."Event" ADD COLUMN IF NOT EXISTS "schoolId" TEXT;

        -- Step 6: Update all existing events to use the default school
        UPDATE "public"."Event"
        SET "schoolId" = 'default-school-id'
        WHERE "schoolId" IS NULL;

        -- Step 7: Now make it NOT NULL
        ALTER TABLE "public"."Event" ALTER COLUMN "schoolId" SET NOT NULL;

        -- Step 8: Add spotsReserved column (from 20251107_add_spots_reserved migration)
        ALTER TABLE "public"."Event" ADD COLUMN IF NOT EXISTS "spotsReserved" INTEGER NOT NULL DEFAULT 0;

        -- Step 9: Initialize spotsReserved with current confirmed registrations count
        UPDATE "public"."Event" e
        SET "spotsReserved" = (
          SELECT COALESCE(SUM(r."spotsCount"), 0)
          FROM "public"."Registration" r
          WHERE r."eventId" = e.id
          AND r.status = 'CONFIRMED'
        )
        WHERE "spotsReserved" = 0;
    END IF;
END $$;
