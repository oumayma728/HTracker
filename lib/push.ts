/**
 * Sends Web Push notifications. Server-only: it uses the private VAPID key.
 */
import "server-only";
import webpush, { WebPushError } from "web-push";
import { prisma } from "@/lib/prisma";

export type PushPayload = { title: string; body: string; url?: string };
type Subscription = { id: number; endpoint: string; p256dh: string; auth: string };

let configured = false;

/** Load the VAPID keys once. Returns false (and logs why) if they're missing. */
function configure(): boolean {
  if (configured) return true;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  let subject = process.env.VAPID_SUBJECT?.trim();
  if (!publicKey || !privateKey || !subject) {
    console.error("[push] NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY and VAPID_SUBJECT must all be set");
    return false;
  }
  // The subject must be "mailto:..." or "https://...". Accept a plain email address too.
  if (/^[^\s@:]+@[^\s@]+$/.test(subject)) subject = `mailto:${subject}`;
  try {
    webpush.setVapidDetails(subject, publicKey, privateKey);
  } catch (error) {
    console.error("[push] invalid VAPID settings:", error instanceof Error ? error.message : error);
    return false;
  }
  configured = true;
  return true;
}

/**
 * Send one payload to several devices. Subscriptions the push service says are gone
 * (404/410: the user turned notifications off or uninstalled) are deleted.
 */
export async function sendToSubscriptions(subs: Subscription[], payload: PushPayload) {
  if (!configure()) return { sent: 0, removed: 0, failed: subs.length };
  const body = JSON.stringify({ url: "/home", ...payload });
  let sent = 0;
  let failed = 0;
  const gone: number[] = [];

  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, body, {
          TTL: 60 * 60, // drop it if the phone is offline for more than an hour; a late reminder is useless
          urgency: "normal",
        });
        sent += 1;
      } catch (error) {
        if (error instanceof WebPushError && (error.statusCode === 404 || error.statusCode === 410)) {
          gone.push(s.id);
        } else {
          failed += 1;
          console.error("[push] send failed:", error instanceof WebPushError ? `${error.statusCode} ${error.body}` : error);
        }
      }
    }),
  );

  if (gone.length) await prisma.pushSubscription.deleteMany({ where: { id: { in: gone } } });
  return { sent, removed: gone.length, failed };
}
