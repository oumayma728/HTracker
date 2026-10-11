"use server";

/**
 * Server Actions: the "backend" of the app. They run only on the server.
 * Each one first checks who is logged in, and only touches that person's data.
 */
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

const COLORS: Record<string, string> = {
  blue: "#3F6FA6",
  ochre: "#9C6F17",
  coral: "#B8452F",
  plum: "#8A4F7D",
  green: "#2E6F55",
};
const FREQUENCIES = ["daily", "weekdays", "three"];

/** Make every page re-read the database on its next visit. */
function refreshPages() {
  revalidatePath("/", "layout");
}

export async function toggleHabit(habitId: string, isoDate: string, done: boolean): Promise<void> {
  const user = await requireUser();

  const id = Number(habitId);
  const date = new Date(`${isoDate}T00:00:00.000Z`);
  if (!Number.isInteger(id) || !ISO_DATE.test(isoDate) || Number.isNaN(date.getTime())) {
    throw new Error("Invalid request.");
  }

  // Make sure this habit belongs to the logged-in user
  const habit = await prisma.habit.findFirst({ where: { id, userId: user.id }, select: { id: true } });
  if (!habit) throw new Error("Habit not found.");

  if (done) {
    await prisma.habitLog.upsert({
      where: { habitId_date: { habitId: id, date } },
      create: { habitId: id, date },
      update: {},
    });
  } else {
    await prisma.habitLog.deleteMany({ where: { habitId: id, date } });
  }

  refreshPages();
}

export async function editHabit(habitId: string, formData: FormData): Promise<void> {
  const user = await requireUser();
  
  const id = Number(habitId);
  if (!Number.isInteger(id)) {
    throw new Error("Invalid request.");
  }

  // Make sure this habit belongs to the logged-in user
  const habit = await prisma.habit.findFirst({ where: { id, userId: user.id }, select: { id: true } });
  if (!habit) throw new Error("Habit not found.");
  
  const name = String(formData.get("name") ?? "").trim();
  if (!name || name.length > 60) {
    throw new Error("Please enter a habit name (up to 60 characters).");
  }

  const goal = String(formData.get("goal") ?? "").trim().slice(0, 60);
  const frequency = String(formData.get("frequency") ?? "daily");
  const colorKey = String(formData.get("color") ?? "green");
  const reminder = String(formData.get("reminder") ?? "");

  await prisma.habit.update({
    where: { id },
    data: {
      name,
      goal: goal || null,
      period: FREQUENCIES.includes(frequency) ? frequency : "daily",
      color: COLORS[colorKey] ?? COLORS.green,
      remindTime: TIME.test(reminder) ? reminder : null,
    },
  });

  refreshPages();
}
export async function deleteHabit(habitId:string): Promise<void> {
  const user = await requireUser();
  
  const id = Number(habitId);
  if (!Number.isInteger(id)) {
    throw new Error("Invalid request.");
  }

  // Make sure this habit belongs to the logged-in user
  const habit = await prisma.habit.findFirst({ where: { id, userId: user.id }, select: { id: true } });
  if (!habit) throw new Error("Habit not found.");

  await prisma.habit.delete({ where: { id } });

  refreshPages();
}
export async function createHabit(formData: FormData): Promise<void> {
  const user = await requireUser();

  const name = String(formData.get("name") ?? "").trim();
  if (!name || name.length > 60) {
    throw new Error("Please enter a habit name (up to 60 characters).");
  }

  const goal = String(formData.get("goal") ?? "").trim().slice(0, 60);
  const frequency = String(formData.get("frequency") ?? "daily");
  const colorKey = String(formData.get("color") ?? "green");
  const reminder = String(formData.get("reminder") ?? "");

  await prisma.habit.create({
    data: {
      userId: user.id,
      name,
      goal: goal || null,
      period: FREQUENCIES.includes(frequency) ? frequency : "daily",
      color: COLORS[colorKey] ?? COLORS.green,
      remindTime: TIME.test(reminder) ? reminder : null,
    },
  });

  refreshPages();
}

export async function saveSettings(formData: FormData): Promise<void> {
  const user = await requireUser();

  // Only change settings the form actually sent, so saving one field never resets the others.
  const field = (key: string) => (formData.has(key) ? String(formData.get(key) ?? "") : null);
  const name = field("name")?.trim();
  const theme = field("theme");
  const weekStart = field("weekStart");
  const channel = field("channel");
  const reminderTime = field("reminderTime");
  const reminders = field("reminders");
  // Email changes need Better Auth's own method, so the email field is not saved here.

  await prisma.user.update({
    where: { id: user.id },
    data: {
      ...(name ? { name: name.slice(0, 80) } : {}),
      ...(theme && ["light", "dark", "system"].includes(theme) ? { theme } : {}),
      ...(weekStart && ["mon", "sun"].includes(weekStart) ? { weekStart } : {}),
      ...(channel && ["email", "push"].includes(channel) ? { reminderChannel: channel } : {}),
      ...(reminders !== null ? { reminderOn: reminders === "on" } : {}),
      ...(reminderTime && TIME.test(reminderTime) ? { reminderTime } : {}),
    },
  });

  refreshPages();
}

export async function deleteAccount(): Promise<void> {
  const user = await requireUser();
  // Sessions, logins, habits and check-ins are removed too (onDelete: Cascade in the schema)
  await prisma.user.delete({ where: { id: user.id } });
  redirect("/login");
}