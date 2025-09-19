-- CreateEnum
CREATE TYPE "public"."EventStatus" AS ENUM ('OPEN', 'PAUSED', 'CLOSED');

-- CreateEnum
CREATE TYPE "public"."RegistrationStatus" AS ENUM ('CONFIRMED', 'WAITLIST', 'CANCELLED');

-- CreateTable
CREATE TABLE "public"."Event" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "gameType" TEXT,
    "location" TEXT,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3),
    "capacity" INTEGER NOT NULL,
    "status" "public"."EventStatus" NOT NULL DEFAULT 'OPEN',
    "maxSpotsPerPerson" INTEGER NOT NULL DEFAULT 1,
    "fieldsSchema" JSONB NOT NULL DEFAULT '[]',
    "conditions" TEXT,
    "requireAcceptance" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Registration" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "spotsCount" INTEGER NOT NULL DEFAULT 1,
    "status" "public"."RegistrationStatus" NOT NULL DEFAULT 'CONFIRMED',
    "confirmationCode" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Registration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Event_slug_key" ON "public"."Event"("slug");

-- CreateIndex
CREATE INDEX "Event_slug_idx" ON "public"."Event"("slug");

-- CreateIndex
CREATE INDEX "Event_status_idx" ON "public"."Event"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Registration_confirmationCode_key" ON "public"."Registration"("confirmationCode");

-- CreateIndex
CREATE INDEX "Registration_eventId_idx" ON "public"."Registration"("eventId");

-- CreateIndex
CREATE INDEX "Registration_status_idx" ON "public"."Registration"("status");

-- CreateIndex
CREATE INDEX "Registration_phoneNumber_idx" ON "public"."Registration"("phoneNumber");

-- CreateIndex
CREATE INDEX "Registration_confirmationCode_idx" ON "public"."Registration"("confirmationCode");

-- CreateIndex
CREATE UNIQUE INDEX "Registration_eventId_phoneNumber_key" ON "public"."Registration"("eventId", "phoneNumber");

-- AddForeignKey
ALTER TABLE "public"."Registration" ADD CONSTRAINT "Registration_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "public"."Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
