import cron from "node-cron";
import { prisma } from "../src/db/prisma";
import { findDue } from "../services/reminderService";

// A cron job that runs every minute in background to check for reminders that are due and log them for notificatiton delivery
export function startReminderJob() {
  cron.schedule("* * * * *", async () => {      // every minute
    try {
      const schedules = await prisma.schedule.findMany({ where: { isActive: true } });

      for (const { schedule, localDate, time } of findDue(schedules)) {
        // Claim this reminder first. The unique rule on
        // (scheduleId, localDate, time) rejects a second attempt.
        try {
          await prisma.reminderLog.create({
            data: { scheduleId: schedule.id, localDate, time },
          });
        } catch (err) {
          if ((err as { code?: string }).code === "P2002") continue; // already handled (duplicate guard)
          console.error("could not record reminder", err);
          continue;
        }

        console.log(`Reminder due: schedule ${schedule.id}, user ${schedule.userId}, ${time} (${localDate})`);
        // push sending gets added here in Step 6
      }
    } catch (err) {
      console.error("reminder job failed", err);
    }
  });

  console.log("Reminder job started");
}