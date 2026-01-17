-- Add missing tables: CheckIn, UserBan, BreachIncident
-- These tables were defined in schema.prisma but never created via migrations

-- CreateTable: CheckIn (for tracking event attendance)
CREATE TABLE IF NOT EXISTS "public"."CheckIn" (
    "id" TEXT NOT NULL,
    "registrationId" TEXT NOT NULL,
    "checkedInAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checkedInBy" TEXT,
    "isLate" BOOLEAN NOT NULL DEFAULT false,
    "minutesLate" INTEGER,
    "undoneAt" TIMESTAMP(3),
    "undoneBy" TEXT,
    "undoneReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CheckIn_pkey" PRIMARY KEY ("id")
);

-- CreateTable: UserBan (for banning users from events)
CREATE TABLE IF NOT EXISTS "public"."UserBan" (
    "id" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "email" TEXT,
    "name" TEXT,
    "schoolId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "bannedGamesCount" INTEGER NOT NULL DEFAULT 3,
    "bannedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "eventsBlocked" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "liftedAt" TIMESTAMP(3),
    "liftedBy" TEXT,
    "liftedReason" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserBan_pkey" PRIMARY KEY ("id")
);

-- CreateTable: BreachIncident (for Israeli PPL compliance tracking)
CREATE TABLE IF NOT EXISTS "public"."BreachIncident" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT,
    "incidentType" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "affectedUsers" INTEGER NOT NULL,
    "dataTypes" TEXT NOT NULL,
    "detectedAt" TIMESTAMP(3) NOT NULL,
    "reportedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "notifiedPPA" BOOLEAN NOT NULL DEFAULT false,
    "notifiedUsers" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BreachIncident_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: CheckIn indexes
CREATE UNIQUE INDEX IF NOT EXISTS "CheckIn_registrationId_key" ON "public"."CheckIn"("registrationId");
CREATE INDEX IF NOT EXISTS "CheckIn_registrationId_idx" ON "public"."CheckIn"("registrationId");
CREATE INDEX IF NOT EXISTS "CheckIn_checkedInAt_idx" ON "public"."CheckIn"("checkedInAt");
CREATE INDEX IF NOT EXISTS "CheckIn_isLate_idx" ON "public"."CheckIn"("isLate");

-- CreateIndex: UserBan indexes
CREATE INDEX IF NOT EXISTS "UserBan_phoneNumber_schoolId_active_idx" ON "public"."UserBan"("phoneNumber", "schoolId", "active");
CREATE INDEX IF NOT EXISTS "UserBan_schoolId_active_idx" ON "public"."UserBan"("schoolId", "active");
CREATE INDEX IF NOT EXISTS "UserBan_expiresAt_idx" ON "public"."UserBan"("expiresAt");

-- CreateIndex: BreachIncident indexes
CREATE INDEX IF NOT EXISTS "BreachIncident_schoolId_severity_idx" ON "public"."BreachIncident"("schoolId", "severity");
CREATE INDEX IF NOT EXISTS "BreachIncident_detectedAt_idx" ON "public"."BreachIncident"("detectedAt");

-- AddForeignKey: CheckIn -> Registration
DO $$ BEGIN
    ALTER TABLE "public"."CheckIn" ADD CONSTRAINT "CheckIn_registrationId_fkey"
    FOREIGN KEY ("registrationId") REFERENCES "public"."Registration"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey: UserBan -> School
DO $$ BEGIN
    ALTER TABLE "public"."UserBan" ADD CONSTRAINT "UserBan_schoolId_fkey"
    FOREIGN KEY ("schoolId") REFERENCES "public"."School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey: UserBan -> Admin (createdBy)
DO $$ BEGIN
    ALTER TABLE "public"."UserBan" ADD CONSTRAINT "UserBan_createdBy_fkey"
    FOREIGN KEY ("createdBy") REFERENCES "public"."Admin"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey: BreachIncident -> School
DO $$ BEGIN
    ALTER TABLE "public"."BreachIncident" ADD CONSTRAINT "BreachIncident_schoolId_fkey"
    FOREIGN KEY ("schoolId") REFERENCES "public"."School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
