-- Fix script to prepare database for add_multi_school_support migration
-- This script must be run BEFORE the migration

-- Step 1: Create a default school if it doesn't exist
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

-- Step 2: Add schoolId column as NULLABLE first
ALTER TABLE "public"."Event"
ADD COLUMN IF NOT EXISTS "schoolId" TEXT;

-- Step 3: Update all existing events to use the default school
UPDATE "public"."Event"
SET "schoolId" = 'default-school-id'
WHERE "schoolId" IS NULL;

-- Step 4: Now make it NOT NULL
ALTER TABLE "public"."Event"
ALTER COLUMN "schoolId" SET NOT NULL;
