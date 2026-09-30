import Link from "next/link";
import type { CSSProperties } from "react";
import type { Habit } from "@/lib/data";

type Props = {
  title: string;
  habits: Habit[];
  doneIds: string[];
  isToday: boolean;
};

/** The habits for one selected day, each marked Done or Missed. */
export function DayPanel({ title, habits, doneIds, isToday }: Props) {
  const done = habits.filter((h) => doneIds.includes(h.id)).length;
  const pct = habits.length ? Math.round((done / habits.length) * 100) : 0;

  return (
    <aside className="card day-panel" aria-label="Selected day">
      <div className="day-summary">
        <h2 className="card-title">{title}</h2>
        <div className="muted small">
          {done} of {habits.length} habits done
        </div>
        <div className="meter" style={{ "--habit": "var(--green)" } as CSSProperties}>
          <i style={{ width: `${pct}%` }} />
        </div>
      </div>

      {habits.map((h) => {
        const isDone = doneIds.includes(h.id);
        return (
          <div key={h.id} className="day-row" style={{ "--habit": h.color } as CSSProperties}>
            <span className="day-name">
              <span className="row-dot" />
              {h.name}
            </span>
            <span className={isDone ? "tag done" : "tag missed"}>{isDone ? "Done" : "Missed"}</span>
          </div>
        );
      })}

      {isToday && (
        <div className="day-foot">
          <Link href="/today" className="btn btn-primary btn-lg">
            Check in on Today
          </Link>
        </div>
      )}
    </aside>
  );
}
