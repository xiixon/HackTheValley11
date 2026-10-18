import { Expo, type ExpoPushMessage } from "expo-server-sdk";
import { prisma } from "../src/db/prisma";

const expo = new Expo();

// Send a push notification through Expo
export async function sendReminder(userId: string, scheduleId: string, medicationId: string) {
  const rows = await prisma.pushToken.findMany({ where: { userId } }); // Fetch all user's tokens so that notifactions are sent to all devices
  const tokens = rows.map((r) => r.token).filter((t) => Expo.isExpoPushToken(t)); // Reject any invalid tokens with improper format
  if (tokens.length === 0) return;

  // Create the notification messages content
  const messages: ExpoPushMessage[] = tokens.map((to) => ({
    to,
    title: "Medication reminder",
    body: "Time to take your medication.",   // generic on purpose
    data: { scheduleId, medicationId },
  }));

  // Limit the number of messages sent at once
  for (const chunk of expo.chunkPushNotifications(messages)) {
    const tickets = await expo.sendPushNotificationsAsync(chunk);

    // Remove tokens for phones that no longer exist (uninstalled app...)
    for (let i = 0; i < tickets.length; i++) {
      const ticket = tickets[i];
      if (!ticket) continue;
      
      if (ticket.status === "error" && ticket.details?.error === "DeviceNotRegistered") {
        const bad = (chunk[i] as { to: string }).to;
        await prisma.pushToken.deleteMany({ where: { token: bad } });
      }
    }
  }
}