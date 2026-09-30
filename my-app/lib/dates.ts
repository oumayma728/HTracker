/** Small date helpers. All dates are handled as local calendar days. */

export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function addDays(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
}

/** Monday of the week that contains `d`. */
export function startOfWeekMon(d: Date): Date {
  const offset = (d.getDay() + 6) % 7; // Mon = 0 ... Sun = 6
  return addDays(startOfDay(d), -offset);
}

export function daysBetween(a: Date, b: Date): number {
  const ms = startOfDay(b).getTime() - startOfDay(a).getTime();
  return Math.round(ms / 86_400_000);
}

/** "Sun, Sep 20" */
export function formatDayShort(d: Date): string {
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

/** "Sep 20" */
export function formatMonthDay(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** "Sunday, September 20" */
export function formatDayLong(d: Date): string {
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

/** Parse "YYYY-MM-DD" as a local calendar day. */
export function fromISODate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function addMonths(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

export function lastDayOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

/** "2026-09" */
export function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** Parse "2026-09" (or return null if it isn't a valid month). */
export function parseMonthKey(s: string | undefined): Date | null {
  if (!s || !/^\d{4}-(0[1-9]|1[0-2])$/.test(s)) return null;
  const [y, m] = s.split("-").map(Number);
  return new Date(y, m - 1, 1);
}

/** Parse "2026-09-20" (or return null if it isn't a real date). */
export function parseISODate(s: string | undefined): Date | null {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const d = fromISODate(s);
  return toISODate(d) === s ? d : null;
}

/** "September 2026" */
export function formatMonthYear(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}
