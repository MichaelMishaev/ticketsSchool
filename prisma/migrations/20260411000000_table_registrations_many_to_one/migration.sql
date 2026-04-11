-- Flip Table↔Registration relation from 1:1 (Table.reservedById) to many-to-one (Registration.tableId).
-- This enables admin-driven table sharing: multiple registrations can point to the same table.
--
-- CRITICAL ORDER: The default prisma auto-generation drops the old column before any backfill,
-- which would silently orphan every existing table assignment. This script enforces the safe order:
--   1. ADD new nullable FK column + index
--   2. BACKFILL from the inverse old FK (Table.reservedById -> Registration.id)
--   3. ADD FK constraint
--   4. DROP old constraint, unique index, and column

-- 1. Add new FK column (nullable for backfill)
ALTER TABLE "Registration" ADD COLUMN "tableId" TEXT;
CREATE INDEX "Registration_tableId_idx" ON "Registration"("tableId");

-- 2. Backfill from old inverse FK
UPDATE "Registration" r
SET "tableId" = t."id"
FROM "Table" t
WHERE t."reservedById" = r."id";

-- 3. Add FK constraint
ALTER TABLE "Registration"
  ADD CONSTRAINT "Registration_tableId_fkey"
  FOREIGN KEY ("tableId") REFERENCES "Table"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- 4. Drop old FK constraint, unique constraint (which owns its backing index), and column
ALTER TABLE "Table" DROP CONSTRAINT IF EXISTS "Table_reservedById_fkey";
ALTER TABLE "Table" DROP CONSTRAINT IF EXISTS "Table_reservedById_key";
ALTER TABLE "Table" DROP COLUMN "reservedById";
