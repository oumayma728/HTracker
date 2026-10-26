/**
 * Which days of the week a habit is planned for.
 * Stored in Habit.period as text, so no database change is needed:
 *   "daily"     -> every day
 *   "weekdays"  -> Monday to Friday
 *   "days:1,4"  -> only the listed days (1 = Monday ... 7 = Sunday)
 *   "three"     -> older "3 times a week" habits; treated as every day
 */

export const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const ALL = [1, 2, 3, 4, 5, 6, 7];

/** The weekdays (1-7) a habit is planned for. */
export function scheduledDays(period: string): number[] {
  if (period === "weekdays") return [1, 2, 3, 4, 5];
  if (period.startsWith("days:")) {
    const days = period
      .slice(5)
      .split(",")
      .map(Number)
      .filter((d) => Number.isInteger(d) && d >= 1 && d <= 7);
    const unique = [...new Set(days)].sort((a, b) => a - b);
    return unique.length ? unique : ALL;
  }
  return ALL;
}

/** Turn a list of chosen days into the stored text. Empty or invalid input means every day. */
export function periodFromDays(days: number[]): string {
  const clean = [...new Set(days.filter((d) => Number.isInteger(d) && d >= 1 && d <= 7))].sort((a, b) => a - b);
  if (clean.length === 0 || clean.length === 7) return "daily";
  if (clean.join(",") === "1,2,3,4,5") return "weekdays";
  return `days:${clean.join(",")}`;
}

/** Monday = 1 ... Sunday = 7, for a JavaScript Date (local time). */
export function weekdayOf(date: Date): number {
  return ((date.getDay() + 6) % 7) + 1;
}

/** Is this habit planned for that weekday (1-7)? */
export function isScheduledOn(period: string, weekday: number): boolean {
  return scheduledDays(period).includes(weekday);
}

/** Human label: "Every day", "Weekdays", "Mon, Thu". */
export function scheduleLabel(period: string): string {
  const days = scheduledDays(period);
  if (days.length === 7) return "Every day";
  if (days.join(",") === "1,2,3,4,5") return "Weekdays";
  if (days.join(",") === "6,7") return "Weekends";
  return days.map((d) => DAY_NAMES[d - 1]).join(", ");
}
