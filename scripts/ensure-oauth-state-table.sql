-- Script to ensure OAuthState table exists
-- This is idempotent - safe to run multiple times

-- Create OAuthState table if it doesn't exist
CREATE TABLE IF NOT EXISTS "OAuthState" (
    "id" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OAuthState_pkey" PRIMARY KEY ("id")
);

-- Create unique index on state column (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE tablename = 'OAuthState'
        AND indexname = 'OAuthState_state_key'
    ) THEN
        CREATE UNIQUE INDEX "OAuthState_state_key" ON "OAuthState"("state");
    END IF;
END $$;

-- Create index on state for faster lookups (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE tablename = 'OAuthState'
        AND indexname = 'OAuthState_state_idx'
    ) THEN
        CREATE INDEX "OAuthState_state_idx" ON "OAuthState"("state");
    END IF;
END $$;

-- Create index on expiresAt for efficient cleanup (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE tablename = 'OAuthState'
        AND indexname = 'OAuthState_expiresAt_idx'
    ) THEN
        CREATE INDEX "OAuthState_expiresAt_idx" ON "OAuthState"("expiresAt");
    END IF;
END $$;

-- Print success message
DO $$
BEGIN
    RAISE NOTICE 'OAuthState table and indexes verified/created successfully';
END $$;
