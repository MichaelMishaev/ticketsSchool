-- Fix script to prepare database for add_multi_school_support migration
-- This script must be run BEFORE the migration

-- Step 1: Remove ALL failed migration records (both with and without finished_at)
-- This handles migrations that failed partway through or have error timestamps
DELETE FROM "_prisma_migrations"
WHERE migration_name IN (
    '20250920000000_allow_multiple_registrations_per_phone',
    '20251107211615_add_multi_school_support',
    '20251107_add_spots_reserved',
    '20251108163123_add_saas_features'
);

-- Step 2: Create School table if it doesn't exist
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

-- Step 3: Create unique index on slug if it doesn't exist
CREATE UNIQUE INDEX IF NOT EXISTS "School_slug_key" ON "public"."School"("slug");

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
    END IF;
END $$;
