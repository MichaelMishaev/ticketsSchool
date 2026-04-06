-- CreateTable: TableTemplate (reusable table layout templates for schools)
-- This table was added to schema.prisma and applied via db push on dev/local
-- but was never deployed to production via a proper migration.

CREATE TABLE IF NOT EXISTS "public"."TableTemplate" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "config" JSONB NOT NULL,
    "timesUsed" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TableTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "TableTemplate_schoolId_idx" ON "public"."TableTemplate"("schoolId");
CREATE INDEX IF NOT EXISTS "TableTemplate_isPublic_idx" ON "public"."TableTemplate"("isPublic");

-- AddForeignKey: TableTemplate -> School
DO $$ BEGIN
    ALTER TABLE "public"."TableTemplate" ADD CONSTRAINT "TableTemplate_schoolId_fkey"
    FOREIGN KEY ("schoolId") REFERENCES "public"."School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
