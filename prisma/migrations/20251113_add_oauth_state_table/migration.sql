-- CreateTable: Add OAuthState table for temporary OAuth state storage
CREATE TABLE IF NOT EXISTS "OAuthState" (
    "id" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OAuthState_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: Add unique index on state column
CREATE UNIQUE INDEX IF NOT EXISTS "OAuthState_state_key" ON "OAuthState"("state");

-- CreateIndex: Add index on state for faster lookups
CREATE INDEX IF NOT EXISTS "OAuthState_state_idx" ON "OAuthState"("state");

-- CreateIndex: Add index on expiresAt for efficient cleanup
CREATE INDEX IF NOT EXISTS "OAuthState_expiresAt_idx" ON "OAuthState"("expiresAt");
