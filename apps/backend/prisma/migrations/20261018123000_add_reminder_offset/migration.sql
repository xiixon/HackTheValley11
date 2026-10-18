ALTER TABLE "ReminderLog" ADD COLUMN "offset" INTEGER NOT NULL DEFAULT 0;

DROP INDEX IF EXISTS "ReminderLog_scheduleId_localDate_time_key";

CREATE UNIQUE INDEX "ReminderLog_scheduleId_localDate_time_offset_key"
ON "ReminderLog"("scheduleId", "localDate", "time", "offset");
