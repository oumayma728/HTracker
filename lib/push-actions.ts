"use server";

/**
 * Server Actions for turning push notifications on/off on a device, and sending a test.
 * Same rules as lib/actions.ts: requireUser() first, only touch the logged-in user's rows.
 */
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { sendToSubscriptions } from "@/lib/push";
import { isValidTimeZone } from "@/lib/reminders";

/** The JSON shape of a browser PushSubscription (subscription.toJSON()). */
export type BrowserSubscription = { endpoint?: string; keys?: { p256dh?: string; auth?: string } };

/** Save this device's subscription and the user's time zone, and switch reminders on. */
export async function savePushSubscription(sub: BrowserSubscription, timeZone: string): Promise<{ error?: string }> {
  const user = await requireUser();

  const endpoint = String(sub?.endpoint ?? "");
  const p256dh = String(sub?.keys?.p256dh ?? "");
  const auth = String(sub?.keys?.auth ?? "");
  if (!endpoint.startsWith("https://") || endpoint.length > 1000 || !p256dh || !auth || p256dh.length > 200 || auth.length > 100) {
    return { error: "This browser returned an invalid subscription." };
  }

  // One row per device. If this device was used by another account before, it now belongs to this one.
  await prisma.pushSubscription.upsert({
    where: { endpoint },
    create: { userId: user.id, endpoint, p256dh, auth },
    update: { userId: user.id, p256dh, auth },
  });
  await prisma.user.update({
    where: { id: user.id },
    data: { reminderOn: true, ...(isValidTimeZone(timeZone) ? { timeZone } : {}) },
  });
  return {};
}

/** Forget this device (the browser has already unsubscribed itself). */
export async function removePushSubscription(endpoint: string): Promise<void> {
  const user = await requireUser();
  await prisma.pushSubscription.deleteMany({ where: { endpoint: String(endpoint), userId: user.id } });
}

/** Send a test notification to every device of the logged-in user. */
export async function sendTestNotification(): Promise<{ error?: string }> {
  const user = await requireUser();
  const subs = await prisma.pushSubscription.findMany({
    where: { userId: user.id },
    select: { id: true, endpoint: true, p256dh: true, auth: true },
  });
  if (subs.length === 0) return { error: "No device has notifications turned on." };
  const result = await sendToSubscriptions(subs, { title: "Notifications are on", body: "You'll get a reminder at each habit's reminder time." });
  return result.sent > 0 ? {} : { error: "The notification couldn't be sent. Try turning notifications off and on again." };
}
