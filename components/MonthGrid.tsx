import Link from "next/link";
import type { CSSProperties } from "react";
import type { Habit } from "@/lib/data";

export type DayCell = {
  iso: string;
  day: number;
  label: string;
  inMonth: boolean;
  future: boolean;
  isToday: boolean;
  isSelected: boolean;
  doneIds: string[];
};

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

type Props = {
  monthLabel: string;
  summary: string;
  cells: DayCell[];
  habits: Habit[];
  monthKey: string;
};

/** The month at a glance: one square per day, one dot per habit (filled = done). */
export function MonthGrid({ monthLabel, summary, cells, habits, monthKey }: Props) {
  return (
    <section className="card cal-card">
      <div className="card-head">
        <h2 className="card-title">{monthLabel}</h2>
        <span className="muted small">{summary}</span>
      </div>

      <div className="cal-weekdays" aria-hidden="true">
        {WEEKDAYS.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>

      <div className="cal-grid">
        {cells.map((c) => {
          const classes = ["cal-cell"];
          if (!c.inMonth) classes.push("is-out");
          if (c.future) classes.push("is-future");
          if (c.isToday) classes.push("is-today");
          if (c.isSelected) classes.push("is-selected");

          const inner = (
            <>
              <span className="cal-num">{c.day}</span>
              {c.inMonth && !c.future && (
                <span className="cal-dots" aria-hidden="true">
                  {habits.map((h) => (
                    <span
                      key={h.id}
                      className={c.doneIds.includes(h.id) ? "cal-dot is-done" : "cal-dot"}
                      style={{ "--habit": h.color } as CSSProperties}
                    />
                  ))}
                </span>
              )}
            </>
          );

          // Only past and present days in this month can be opened.
          if (!c.inMonth || c.future) {
            return (
              <div key={c.iso} className={classes.join(" ")} aria-hidden={!c.inMonth ? true : undefined}>
                {c.inMonth ? inner : null}
              </div>
            );
          }

          return (
            <Link
              key={c.iso}
              href={`/calendar?month=${monthKey}&day=${c.iso}`}
              className={classes.join(" ")}
              aria-current={c.isToday ? "date" : undefined}
              aria-label={`${c.label}: ${c.doneIds.length} of ${habits.length} habits done`}
              scroll={false}
            >
              {inner}
            </Link>
          );
        })}
      </div>

      <div className="cal-legend">
        {habits.map((h) => (
          <span key={h.id} style={{ "--habit": h.color } as CSSProperties}>
            <i className="cal-dot is-done" />
            {h.name}
          </span>
        ))}
        <span className="muted">Faded dot: not done</span>
      </div>
    </section>
  );
}
