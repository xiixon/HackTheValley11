CREATE TYPE "ScheduleFrequency_new" AS ENUM ('daily', 'weekly', 'selected_days', 'every_n_days', 'monthly', 'once', 'as_needed', 'once_daily');

ALTER TABLE "Schedule"
  ALTER COLUMN "frequency" DROP DEFAULT,
  ALTER COLUMN "frequency" TYPE "ScheduleFrequency_new"
    USING ("frequency"::text::"ScheduleFrequency_new"),
  ALTER COLUMN "frequency" SET DEFAULT 'daily';

DROP TYPE "ScheduleFrequency";
ALTER TYPE "ScheduleFrequency_new" RENAME TO "ScheduleFrequency";

ALTER TABLE "Schedule"
  ADD COLUMN "intervalDays" INTEGER,
  ADD COLUMN "metadata" JSONB;

CREATE TABLE "DoseLog" (
  "id" TEXT NOT NULL,
  "scheduleId" TEXT NOT NULL,
  "localDate" TEXT NOT NULL,
  "time" TEXT NOT NULL,
  "takenAt" TIMESTAMP(3),
  CONSTRAINT "DoseLog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DoseLog_scheduleId_localDate_time_key"
  ON "DoseLog"("scheduleId", "localDate", "time");

ALTER TABLE "DoseLog"
  ADD CONSTRAINT "DoseLog_scheduleId_fkey"
  FOREIGN KEY ("scheduleId") REFERENCES "Schedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;
