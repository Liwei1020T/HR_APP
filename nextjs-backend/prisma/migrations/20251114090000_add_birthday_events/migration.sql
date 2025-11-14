-- Add date_of_birth column to users (only if missing, for shadow DB safety)
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "date_of_birth" TIMESTAMP(3);

-- Create birthday_events table
CREATE TABLE "birthday_events" (
    "id" SERIAL PRIMARY KEY,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "event_date" TIMESTAMP(3) NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "location" TEXT,
    "created_by_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL
);

-- Ensure updated_at auto-updates via trigger handled by Prisma (set in application layer)

-- Enforce unique month/year per event
CREATE UNIQUE INDEX "birthday_events_year_month_key" ON "birthday_events" ("year", "month");

-- Create birthday_registrations table
CREATE TABLE "birthday_registrations" (
    "id" SERIAL PRIMARY KEY,
    "event_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "rsvp_status" TEXT NOT NULL DEFAULT 'pending',
    "rsvp_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Unique constraint for per-user registration per event
CREATE UNIQUE INDEX "birthday_registrations_event_id_user_id_key" ON "birthday_registrations" ("event_id", "user_id");

-- Helpful indexes
CREATE INDEX "birthday_registrations_event_id_idx" ON "birthday_registrations" ("event_id");
CREATE INDEX "birthday_registrations_user_id_idx" ON "birthday_registrations" ("user_id");

-- Foreign keys
ALTER TABLE "birthday_events"
  ADD CONSTRAINT "birthday_events_created_by_id_fkey"
  FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "birthday_registrations"
  ADD CONSTRAINT "birthday_registrations_event_id_fkey"
  FOREIGN KEY ("event_id") REFERENCES "birthday_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "birthday_registrations"
  ADD CONSTRAINT "birthday_registrations_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
