/**
 * Data layer. Every function first asks who is logged in (requireUser),
 * then reads only that person's rows. The pages and components don't change.
 */
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import {
  addDays,
  daysBetween,
  formatMonthDay,
  fromISODate,
  startOfDay,
  startOfWeekMon,
  toISODate,
} from "./dates";
import { isScheduledOn, scheduleLabel, scheduledDays, weekdayOf } from "./schedule";

export type Habit = {
  id: string;
  name: string;
  goal: string;
  reminder: string;
  color: string;
  frequency: string;
  /** Planned weekdays, 1 = Monday ... 7 = Sunday. */
  days: number[];
  /** "Every day", "Weekdays", "Mon, Thu"... */
  scheduleLabel: string;
  /** Raw reminder time "HH:MM", or "" when off. */
  remindTime: string;
  /** Consecutive completed days ending yesterday. */
  streakBeforeToday: number;
};

export type DayLog = { iso: string; done: boolean };

export type User = { name: string; email: string; initials: string };

/* ---------- small helpers ---------- */

/** "2026-09-20" -> a Date at UTC midnight, which is how a DATE column is written. */
function dayToDb(iso: string): Date {
  return new Date(`${iso}T00:00:00.000Z`);
}

/** A DATE value read from the database -> "2026-09-20". */
function dbToDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** "20:00" -> "8:00 PM" */
function formatReminder(time: string | null): string {
  if (!time) return "off";
  const [h, m] = time.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return "off";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

function getInitials(name: string): string {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join("") || "?"
  );
}

/**
 * How many planned days in a row were done, counting back from yesterday.
 * Days the habit isn't planned for are skipped: they neither count nor break the streak.
 */
function streakEndingYesterday(doneDays: Set<string>, today: Date, period: string): number {
  let count = 0;
  let d = addDays(startOfDay(today), -1);
  for (let guard = 0; guard < 3660; guard++, d = addDays(d, -1)) {
    if (!isScheduledOn(period, weekdayOf(d))) continue;
    if (!doneDays.has(toISODate(d))) break;
    count += 1;
  }
  return count;
}

/** How many planned days a habit has between two dates (inclusive). */
function countScheduled(period: string, from: Date, to: Date): number {
  let n = 0;
  for (let d = startOfDay(from); d <= to; d = addDays(d, 1)) {
    if (isScheduledOn(period, weekdayOf(d))) n += 1;
  }
  return n;
}

type HabitRow = {
  id: number;
  name: string;
  goal: string | null;
  period: string;
  remindTime: string | null;
  color: string;
  logs: { date: Date }[];
};

function toHabit(row: HabitRow, today: Date): Habit {
  const doneDays = new Set(row.logs.map((l) => dbToDay(l.date)));
  return {
    id: String(row.id),
    name: row.name,
    goal: row.goal || "none",
    reminder: formatReminder(row.remindTime),
    color: row.color,
    frequency: row.period,
    days: scheduledDays(row.period),
    scheduleLabel: scheduleLabel(row.period),
    remindTime: row.remindTime ?? "",
    streakBeforeToday: streakEndingYesterday(doneDays, today, row.period),
  };
}

/* ---------- user ---------- */

export async function getCurrentUser(): Promise<User> {
  const user = await requireUser();
  return { name: user.name, email: user.email, initials: getInitials(user.name) };
}

/* ---------- habits ---------- */

export async function getHabits(): Promise<Habit[]> {
  const user = await requireUser();
  const rows = await prisma.habit.findMany({
    where: { userId: user.id, archived: false },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      goal: true,
      remindTime: true,
      color: true,
      period: true,
      logs: { select: { date: true } },
    },
  });
  const today = new Date();
  return rows.map((row) => toHabit(row, today));
}

export async function getHabit(id: string): Promise<Habit | undefined> {
  const user = await requireUser();
  const habitId = Number(id);
  if (!Number.isInteger(habitId)) return undefined;

  // The userId check means nobody can open someone else's habit by guessing its number
  const row = await prisma.habit.findFirst({
    where: { id: habitId, userId: user.id },
    select: {
      id: true,
      name: true,
      goal: true,
      remindTime: true,
      color: true,
      period: true,
      logs: { select: { date: true } },
    },
  });
  return row ? toHabit(row, new Date()) : undefined;
}

/** Which habits are checked off today: habit id -> true. */
export async function getTodayDone(): Promise<Record<string, boolean>> {
  const user = await requireUser();
  const logs = await prisma.habitLog.findMany({
    where: {
      date: dayToDb(toISODate(new Date())),
      habit: { userId: user.id, archived: false },
    },
    select: { habitId: true },
  });
  const result: Record<string, boolean> = {};
  for (const l of logs) result[String(l.habitId)] = true;
  return result;
}

/* ---------- this week ---------- */

export type WeekDay = {
  label: string;
  num: number;
  kind: "past" | "today" | "future";
  /** Habits completed that day (unused for today, which is live, and future days). */
  done: number;
};

export async function getWeek(today: Date = new Date()): Promise<WeekDay[]> {
  const user = await requireUser();
  const monday = startOfWeekMon(today);
  const todayIndex = daysBetween(monday, today);

  const logs = await prisma.habitLog.findMany({
    where: {
      date: { gte: dayToDb(toISODate(monday)), lt: dayToDb(toISODate(startOfDay(today))) },
      habit: { userId: user.id, archived: false },
    },
    select: { date: true },
  });
  const perDay = new Map<string, number>();
  for (const l of logs) {
    const key = dbToDay(l.date);
    perDay.set(key, (perDay.get(key) ?? 0) + 1);
  }

  const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return labels.map((label, i) => {
    const day = addDays(monday, i);
    return {
      label,
      num: day.getDate(),
      kind: i < todayIndex ? "past" : i === todayIndex ? "today" : "future",
      done: i < todayIndex ? (perDay.get(toISODate(day)) ?? 0) : 0,
    };
  });
}

/* ---------- one habit's history ---------- */

/** Daily logs for one habit, oldest to newest, ending today. */
export async function getHabitLogs(habitId: string, days: number, today: Date = new Date()): Promise<DayLog[]> {
  const user = await requireUser();
  const id = Number(habitId);
  if (!Number.isInteger(id)) return [];

  const end = startOfDay(today);
  const start = addDays(end, -(days - 1));

  const habit = await prisma.habit.findFirst({
    where: { id, userId: user.id },
    select: {
      logs: {
        where: { date: { gte: dayToDb(toISODate(start)), lte: dayToDb(toISODate(end)) } },
        select: { date: true },
      },
    },
  });
  if (!habit) return [];

  const doneDays = new Set(habit.logs.map((l) => dbToDay(l.date)));
  const logs: DayLog[] = [];
  for (let ago = days - 1; ago >= 0; ago--) {
    const iso = toISODate(addDays(end, -ago));
    logs.push({ iso, done: doneDays.has(iso) });
  }
  return logs;
}

export type StreakStats = { current: number; longest: number; rate: number };

/** Streaks and completion rate from logs ordered oldest to newest. */
export function computeStats(logs: DayLog[]): StreakStats {
  let longest = 0;
  let run = 0;
  let doneTotal = 0;
  for (const l of logs) {
    if (l.done) {
      doneTotal += 1;
      run += 1;
      if (run > longest) longest = run;
    } else {
      run = 0;
    }
  }
  // If today is not done yet, the streak is still alive: count back from yesterday.
  let i = logs.length - 1;
  if (i >= 0 && !logs[i].done) i -= 1;
  let current = 0;
  while (i >= 0 && logs[i].done) {
    current += 1;
    i -= 1;
  }
  const rate = logs.length ? Math.round((doneTotal / logs.length) * 100) : 0;
  return { current, longest, rate };
}

/* ---------- stats page ---------- */

export type WeekBar = { label: string; value: number };

/** Completion % for each of the last 12 weeks. A habit only counts from the day it was created. */
export async function getWeeklyCompletion(today: Date = new Date()): Promise<WeekBar[]> {
  const user = await requireUser();
  const WEEKS = 12;
  const todayDay = startOfDay(today);
  const firstMonday = addDays(startOfWeekMon(today), -7 * (WEEKS - 1));

  const habits = await prisma.habit.findMany({
    where: { userId: user.id, archived: false },
    select: {
      createdAt: true,
      period: true,
      logs: { where: { date: { gte: dayToDb(toISODate(firstMonday)) } }, select: { date: true } },
    },
  });

  return Array.from({ length: WEEKS }, (_, w) => {
    const weekStart = addDays(firstMonday, 7 * w);
    const weekStartIso = toISODate(weekStart);
    const weekEnd = addDays(weekStart, 6);
    const lastDay = weekEnd > todayDay ? todayDay : weekEnd;
    const lastIso = toISODate(lastDay);

    let possible = 0;
    let done = 0;
    for (const h of habits) {
      const createdIso = toISODate(h.createdAt);
      const from = createdIso > weekStartIso ? createdIso : weekStartIso;
      if (from <= lastIso) possible += countScheduled(h.period, fromISODate(from), lastDay); // only planned days count
      done += h.logs.filter((l) => {
        const d = dbToDay(l.date);
        return d >= weekStartIso && d <= lastIso;
      }).length;
    }

    return {
      label: formatMonthDay(weekStart),
      value: possible ? Math.min(100, Math.round((done / possible) * 100)) : 0,
    };
  });
}

export type HabitRate = { id: string; name: string; color: string; pct: number };

/** Completion % per habit over the last 8 weeks, best first. */
export async function getHabitRates(): Promise<HabitRate[]> {
  const user = await requireUser();
  const todayDay = startOfDay(new Date());
  const windowStartIso = toISODate(addDays(todayDay, -55));

  const habits = await prisma.habit.findMany({
    where: { userId: user.id, archived: false },
    select: {
      id: true,
      name: true,
      color: true,
      createdAt: true,
      period: true,
      logs: { where: { date: { gte: dayToDb(windowStartIso) } }, select: { date: true } },
    },
  });

  return habits
    .map((h) => {
      const createdIso = toISODate(h.createdAt);
      const from = createdIso > windowStartIso ? createdIso : windowStartIso;
      const possible = countScheduled(h.period, fromISODate(from), todayDay); // only planned days count
      const pct = possible > 0 ? Math.min(100, Math.round((h.logs.length / possible) * 100)) : 0;
      return { id: String(h.id), name: h.name, color: h.color, pct };
    })
    .sort((a, b) => b.pct - a.pct);
}

/* ---------- calendar ---------- */

/**
 * Which habits were done on each day of a month, as ISO date -> habit ids.
 * Every day up to today is present (an empty list means nothing was done); days after today are left out.
 */
export async function getMonthLogs(monthStart: Date, today: Date = new Date()): Promise<Record<string, string[]>> {
  const user = await requireUser();
  const end = startOfDay(today);
  const lastOfMonth = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
  const to = lastOfMonth < end ? lastOfMonth : end;

  const logs = await prisma.habitLog.findMany({
    where: {
      date: { gte: dayToDb(toISODate(monthStart)), lte: dayToDb(toISODate(to)) },
      habit: { userId: user.id, archived: false },
    },
    select: { habitId: true, date: true },
  });

  const result: Record<string, string[]> = {};
  for (let d = startOfDay(monthStart); d <= to; d = addDays(d, 1)) {
    result[toISODate(d)] = [];
  }
  for (const l of logs) {
    result[dbToDay(l.date)]?.push(String(l.habitId));
  }
  return result;
}