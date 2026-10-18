import cron from "node-cron";
import { prisma } from "../src/db/prisma";
import { findDue } from "../services/reminderService";
import { sendReminder } from "../services/pushService";

// A cron job that runs every minute in background to check for reminders that are due and record them so they are only sent once, and send push notifications to the user's devices
export function startReminderJob() {
  cron.schedule("* * * * *", async () => {      // every minute
    try {
      const schedules = await prisma.schedule.findMany({ where: { isActive: true }, include: { medication: true } });

      for (const { schedule, localDate, time, offset } of findDue(schedules)) {
        // Claim this reminder first. The unique rule on
        // (scheduleId, localDate, time, offset) rejects a second attempt.
        try {
          await prisma.reminderLog.create({
            data: { scheduleId: schedule.id, localDate, time, offset },
          });
        } catch (err) {
          if ((err as { code?: string }).code === "P2002") continue; // already handled (duplicate guard)
          console.error("could not record reminder", err);
          continue;
        }

        console.log(`Reminder due: schedule ${schedule.id}, user ${schedule.userId}, ${time} (${localDate})`);

        try {
          await sendReminder(schedule.userId, schedule as typeof schedule & {
            medication: { genericName: string; brandName: string };
          }, localDate, time, offset);
        } catch (err) {
          console.error("could not send reminder", schedule.id, err);
        }
      }
    } catch (err) {
      console.error("reminder job failed", err);
    }
  });

  console.log("Reminder job started");
}
