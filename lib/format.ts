import type { Habit } from "./data";

export function daysLabel(n: number) {
  return `${n} ${n === 1 ? "day" : "days"}`;
}

export const pluralDays = daysLabel;

export function currentStreak(habit: Habit, doneToday: boolean) {
  return habit.streakBeforeToday + (doneToday ? 1 : 0);
}
