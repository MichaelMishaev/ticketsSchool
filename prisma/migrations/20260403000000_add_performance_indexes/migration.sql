-- Add composite index on Registration(eventId, status)
-- Optimizes dashboard aggregate queries that filter by both eventId and status
CREATE INDEX "Registration_eventId_status_idx" ON "Registration"("eventId", "status");

-- Add composite index on Event(schoolId, startAt)
-- Optimizes admin event list queries that filter by school and order by date
CREATE INDEX "Event_schoolId_startAt_idx" ON "Event"("schoolId", "startAt");
