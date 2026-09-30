import type { Metadata } from "next";
import Link from "next/link";
import { IconPlus } from "@/components/Icons";
import { PageHead } from "@/components/PageHead";
import { TodayBoard } from "@/components/today/TodayBoard";
import { formatDayLong, toISODate } from "@/lib/dates";
import { getCurrentUser, getHabits, getTodayDone, getWeek } from "@/lib/data";

export const metadata: Metadata = { title: "Today" };
export const dynamic = "force-dynamic"; // depends on today's date and the logged-in user

function greeting(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default async function TodayPage() {
  const now = new Date();
  const [user, habits, initialDone, week] = await Promise.all([
    getCurrentUser(),
    getHabits(),
    getTodayDone(),
    getWeek(now),
  ]);
  const firstName = user.name.split(" ")[0];

  return (
    <>
      <PageHead eyebrow={formatDayLong(now)} title={`${greeting(now.getHours())}, ${firstName}`}>
        <Link href="/habits" className="btn btn-primary">
          <IconPlus size={18} />
          New habit
        </Link>
      </PageHead>

      {habits.length === 0 ? (
        <section className="card empty-state">
          <h2 className="card-title">No habits yet</h2>
          <p className="muted">Add your first habit and check it off here every day.</p>
          <Link href="/habits" className="btn btn-primary">
            Create a habit
          </Link>
        </section>
      ) : (
        <TodayBoard habits={habits} initialDone={initialDone} week={week} todayIso={toISODate(now)} />
      )}
    </>
  );
}
