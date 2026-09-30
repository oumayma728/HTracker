import type { Metadata } from "next";
import Link from "next/link";
import { DayPanel } from "@/components/calendar/DayPanel";
import { MonthGrid } from "@/components/calendar/MonthGrid";
import type { DayCell } from "@/components/calendar/MonthGrid";
import { IconChevronLeft, IconChevronRight } from "@/components/Icons";
import { PageHead } from "@/components/PageHead";
import {
  addDays,
  addMonths,
  daysBetween,
  formatDayLong,
  formatDayShort,
  formatMonthYear,
  lastDayOfMonth,
  monthKey,
  parseISODate,
  parseMonthKey,
  startOfDay,
  startOfMonth,
  startOfWeekMon,
  toISODate,
} from "@/lib/dates";
import { getHabits, getMonthLogs } from "@/lib/data";

export const metadata: Metadata = { title: "Calendar" };
export const dynamic = "force-dynamic"; // depends on today's date and the ?month= / ?day= in the URL

type SearchParams = Promise<{ month?: string; day?: string }>;

export default async function CalendarPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const today = startOfDay(new Date());
  const thisMonth = startOfMonth(today);

  // Which month to show (never a future month)
  let month = parseMonthKey(sp.month) ?? thisMonth;
  if (month > thisMonth) month = thisMonth;
  const isCurrentMonth = monthKey(month) === monthKey(thisMonth);

  const [habits, logs] = await Promise.all([getHabits(), getMonthLogs(month, today)]);

  // Which day is selected: the ?day= value if it is a valid past/present day of this month,
  // otherwise today (current month) or the last day (older months)
  const lastDay = lastDayOfMonth(month);
  const fallbackDay = isCurrentMonth ? today : lastDay;
  let selected = parseISODate(sp.day);
  if (!selected || monthKey(selected) !== monthKey(month) || selected > today) selected = fallbackDay;
  const selectedIso = toISODate(selected);

  // Build the grid: whole weeks, Monday first
  const gridStart = startOfWeekMon(month);
  const weeks = Math.ceil((daysBetween(gridStart, lastDay) + 1) / 7);
  const todayIso = toISODate(today);
  const cells: DayCell[] = Array.from({ length: weeks * 7 }, (_, k) => {
    const d = addDays(gridStart, k);
    const iso = toISODate(d);
    return {
      iso,
      day: d.getDate(),
      label: formatDayShort(d),
      inMonth: monthKey(d) === monthKey(month),
      future: d > today,
      isToday: iso === todayIso,
      isSelected: iso === selectedIso,
      doneIds: logs[iso] ?? [],
    };
  });

  const trackedDays = Object.keys(logs).length;
  const checkins = Object.values(logs).reduce((sum, ids) => sum + ids.length, 0);
  const possible = trackedDays * habits.length;
  const rate = possible ? Math.round((checkins / possible) * 100) : 0;

  const prev = `/Calendar?month=${monthKey(addMonths(month, -1))}`;
  const next = `/Calendar?month=${monthKey(addMonths(month, 1))}`;

  return (
    <>
      <PageHead eyebrow="History" title="Calendar">
        <nav className="head-actions" aria-label="Choose month">
          <Link href={prev} className="btn btn-outline btn-icon" aria-label="Previous month">
            <IconChevronLeft />
          </Link>
          {isCurrentMonth ? (
            <span className="btn btn-outline btn-icon is-disabled" aria-disabled="true" aria-label="Next month">
              <IconChevronRight />
            </span>
          ) : (
            <Link href={next} className="btn btn-outline btn-icon" aria-label="Next month">
              <IconChevronRight />
            </Link>
          )}
          {!isCurrentMonth && (
            <Link href="/Calendar" className="btn btn-outline">
              This month
            </Link>
          )}
        </nav>
      </PageHead>

      <div className="cal-layout">
        <MonthGrid
          monthLabel={formatMonthYear(month)}
          summary={`${checkins} check-ins · ${rate}% completion`}
          cells={cells}
          habits={habits}
          monthKey={monthKey(month)}
        />
        <DayPanel
          title={formatDayLong(selected)}
          habits={habits}
          doneIds={logs[selectedIso] ?? []}
          isToday={selectedIso === todayIso}
        />
      </div>
    </>
  );
}
