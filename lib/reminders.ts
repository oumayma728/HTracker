/**
 * Reminder timing: pure functions (no database, no network) so they're easy to test.
 * Everything is worked out in the user's own time zone.
 */
import { isScheduledOn } from "./schedule";

/** How long after its time a reminder may still go out (covers a late or skipped scheduler run). */
export const LOOKBACK_MINUTES = 60;

export type LocalNow = {
  date: string; // "2026-10-11" in the user's time zone
  minutes: number; // minutes since local midnight (0..1439)
  weekday: number; // 1 = Monday ... 7 = Sunday
};

/** True if `zone` is a time zone this server's Intl knows (e.g. "Africa/Tunis"). */
export function isValidTimeZone(zone: string): boolean {
  if (!zone || zone.length > 64) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: zone });
    return true;
  } catch {
    return false;
  }
}

/** The current local date, time and weekday in `zone` (falls back to UTC for unknown zones). */
export function localNow(zone: string, now: Date = new Date()): LocalNow {
  const timeZone = isValidTimeZone(zone) ? zone : "UTC";
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    weekday: "short",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    minutes: Number(get("hour")) * 60 + Number(get("minute")),
    weekday: weekdays.indexOf(get("weekday")) + 1,
  };
}

/** "20:30" -> 1230. Returns null for anything that isn't HH:MM. */
export function timeToMinutes(time: string | null): number | null {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(time ?? "");
  return match ? Number(match[1]) * 60 + Number(match[2]) : null;
}

export type ReminderHabit = {
  name: string;
  period: string; // "daily" | "weekdays" | "days:1,4" (see lib/schedule.ts)
  remindTime: string | null; // "HH:MM" or null when off
  lastRemindedOn: string | null; // local date of the last reminder, "YYYY-MM-DD"
  doneToday: boolean; // already checked off today (user's local date)
};

/**
 * Should this habit's reminder go out right now?
 * - it has a reminder time, and that time has passed within the last LOOKBACK_MINUTES
 * - it wasn't already reminded today, and isn't already done today
 * - only on the habit's planned days (Habit.period, see lib/schedule.ts)
 */
export function isReminderDue(habit: ReminderHabit, now: LocalNow): boolean {
  const at = timeToMinutes(habit.remindTime);
  if (at === null) return false;
  if (habit.doneToday || habit.lastRemindedOn === now.date) return false;
  if (!isScheduledOn(habit.period, now.weekday)) return false; // e.g. a Mon/Thu habit is quiet on other days
  const late = now.minutes - at;
  return late >= 0 && late < LOOKBACK_MINUTES;
}

/** Notification text for the habits that are due. */
export function reminderMessage(names: string[]): { title: string; body: string } {
  if (names.length === 1) return { title: "Time for your habit", body: `Don't forget: ${names[0]}` };
  return { title: `${names.length} habits left today`, body: names.join(" · ") };
}
