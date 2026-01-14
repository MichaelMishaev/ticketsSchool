-- Baseline script for databases without _prisma_migrations table
-- This creates the table and marks all existing migrations as applied
-- Safe to run multiple times (idempotent)

-- Create _prisma_migrations table if it doesn't exist
CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
    "id"                    VARCHAR(36)  PRIMARY KEY NOT NULL,
    "checksum"              VARCHAR(64)  NOT NULL,
    "finished_at"           TIMESTAMPTZ,
    "migration_name"        VARCHAR(255) NOT NULL,
    "logs"                  TEXT,
    "rolled_back_at"        TIMESTAMPTZ,
    "started_at"            TIMESTAMPTZ  NOT NULL DEFAULT now(),
    "applied_steps_count"   INTEGER      NOT NULL DEFAULT 0
);

-- Insert baseline migrations (only if they don't already exist)
-- These mark all migrations as "applied" so prisma migrate deploy can work

INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, applied_steps_count)
SELECT
    gen_random_uuid()::varchar(36),
    'baseline_checksum_' || migration_name,
    NOW(),
    migration_name,
    1
FROM (VALUES
    ('20250919122833_init'),
    ('20250919205155_add_completion_message'),
    ('20251107_add_spots_reserved'),
    ('20251107211615_add_multi_school_support'),
    ('20251110_add_onboarding_fields'),
    ('20251113_add_oauth_state_table'),
    ('20251231153644_sync_production_schema'),
    ('20260113090904_add_late_arrival_tracking'),
    ('20260113131458_add_code_verifier_to_oauth_state'),
    ('20260113213000_add_checkin_token')
) AS migrations(migration_name)
WHERE NOT EXISTS (
    SELECT 1 FROM "_prisma_migrations" pm
    WHERE pm.migration_name = migrations.migration_name
);

-- Note: 20260114200000_add_missing_payment_enums is NOT baselined
-- This allows it to run and add all missing columns/enums/tables
