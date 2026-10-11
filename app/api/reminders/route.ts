/**
 * GET /api/reminders: called by a scheduler every ~15 minutes.
 * Finds habits whose reminder time just passed (in each user's own time zone),
 * that aren't done yet today, and sends each user one push notification.
 *
 * Protected by CRON_SECRET: the caller must send "Authorization: Bearer <CRON_SECRET>"
 * (Vercel Cron sends this header automatically when CRON_SECRET is set).
 */
import { prisma } from "@/lib/prisma";
import { sendToSubscriptions } from "@/lib/push";
import { isReminderDue, localNow, reminderMessage } from "@/lib/reminders";

export const dynamic = "force-dynamic"; // never cache: the answer depends on the current time

/** "2026-10-11" <-> DATE column (stored at UTC midnight, same as HabitLog). */
const dayToDb = (iso: string) => new Date(`${iso}T00:00:00.000Z`);
const dbToDay = (d: Date) => d.toISOString().slice(0, 10);

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error("[reminders] CRON_SECRET is not set");
    return Response.json({ error: "Not configured" }, { status: 500 });
  }
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const since = dayToDb(new Date(now.getTime() - 2 * 86_400_000).toISOString().slice(0, 10)); // covers every time zone's "today"

  // Only users who want reminders and have at least one device subscribed.
  const users = await prisma.user.findMany({
    where: { reminderOn: true, pushSubscriptions: { some: {} } },
    select: {
      id: true,
      timeZone: true,
      pushSubscriptions: { select: { id: true, endpoint: true, p256dh: true, auth: true } },
      habits: {
        where: { archived: false, remindTime: { not: null } },
        select: {
          id: true,
          name: true,
          period: true,
          remindTime: true,
          lastRemindedOn: true,
          logs: { where: { date: { gte: since } }, select: { date: true } },
        },
      },
    },
  });

  let notified = 0;
  let sent = 0;
  let removed = 0;

  for (const user of users) {
    const local = localNow(user.timeZone, now);
    const due = user.habits.filter((h) =>
      isReminderDue(
        {
          name: h.name,
          period: h.period,
          remindTime: h.remindTime,
          lastRemindedOn: h.lastRemindedOn ? dbToDay(h.lastRemindedOn) : null,
          doneToday: h.logs.some((l) => dbToDay(l.date) === local.date),
        },
        local,
      ),
    );
    if (due.length === 0) continue;

    // Mark first, so an overlapping run can't send the same reminder twice.
    const today = dayToDb(local.date);
    const marked = await prisma.habit.updateMany({
      where: {
        id: { in: due.map((h) => h.id) },
        OR: [{ lastRemindedOn: null }, { lastRemindedOn: { not: today } }],
      },
      data: { lastRemindedOn: today },
    });
    if (marked.count === 0) continue;

    const result = await sendToSubscriptions(user.pushSubscriptions, reminderMessage(due.map((h) => h.name)));
    notified += 1;
    sent += result.sent;
    removed += result.removed;
  }

  return Response.json({ checkedUsers: users.length, notifiedUsers: notified, sent, removedSubscriptions: removed });
}
