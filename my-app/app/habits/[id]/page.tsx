import Link from "next/link";
import { notFound } from "next/navigation";
import { IconChevronLeft } from "@/components/Icons";
import { HabitDetailActions } from "@/components/habits/HabitDetailActions";
import { getHabit, getHabitLogs } from "@/lib/data";
import { formatDayShort, fromISODate } from "@/lib/dates";

const WEEKDAY_LABELS = ["Mon", "", "Wed", "", "Fri", "", ""];

export default async function HabitDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const habit = await getHabit(id);
  if (!habit) {
    notFound();
  }
  const logs = await getHabitLogs(id,140);
  // TODO: load the habit and its check-in history for this id.
const history = logs.map((l) => ({ done: l.done, label: formatDayShort(fromISODate(l.iso)) }));
  const doneTotal = history.filter((d) => d.done).length;
  const rate = Math.round((doneTotal / history.length) * 100);

  let current = 0;
  for (let i = history.length - 1; i >= 0 && history[i].done; i--) current += 1;

  let longest = 0;
  let run = 0;
  for (const day of history) {
    run = day.done ? run + 1 : 0;
    if (run > longest) longest = run;
  }

  const recent = history.slice(-7).reverse();

  return (
    <>
      <Link href="/habits" className="back-link">
        <IconChevronLeft size={18} />
        All habits
      </Link>

      <header className="page-head">
        <div className="page-head-text">
          <div className="title-row">
            <span className="dot" style={{ width: 16, height: 16, background: habit.color }} />
            <h1 className="page-title">{habit.name}</h1>
          </div>
          <p className="muted">
            {habit.goal} · Every day · Reminder at {habit.reminder}
          </p>
        </div>
        <HabitDetailActions habit={habit} />
      </header>

      <div className="split split-stretch">
        <div className="detail-left">
          <div className="stat-row">
            <section className="card stat">
              <div className="muted small">Current streak</div>
              <div className="stat-value">
                {current} <span className="stat-unit">days</span>
              </div>
            </section>
            <section className="card stat">
              <div className="muted small">Longest streak</div>
              <div className="stat-value">
                {longest} <span className="stat-unit">days</span>
              </div>
            </section>
            <section className="card stat">
              <div className="muted small">Last 20 weeks</div>
              <div className="stat-value">
                {rate}
                <span className="stat-unit">% done</span>
              </div>
            </section>
          </div>

          <section className="card card-pad stack" style={{ gap: 18 }}>
            <h2 className="section-title">Check-in history</h2>
            <div className="heat-scroll">
              <div className="heat">
                <div className="heat-labels" aria-hidden="true">
                  {WEEKDAY_LABELS.map((label, i) => (
                    <div key={i} className="heat-label">
                      {label}
                    </div>
                  ))}
                </div>
                <div
                  className="heat-grid"
                  role="img"
                  aria-label={`${habit.name} check-ins over the last 20 weeks: ${doneTotal} of ${history.length} days done.`}
                >
                  {history.map((d, i) => (
                    <div key={i} className={`heat-cell${d.done ? " is-done" : ""}`} title={`${d.label}: ${d.done ? "done" : "missed"}`} />
                  ))}
                </div>
              </div>
            </div>
            <div className="legend">
              <span className="legend-item">
                <span className="legend-swatch" style={{ background: "var(--border-soft)" }} />
                Missed
              </span>
              <span className="legend-item">
                <span className="legend-swatch" style={{ background: "var(--plum)" }} />
                Done
              </span>
            </div>
          </section>
        </div>

        <section className="card card-clip grow">
          <div className="card-head">
            <h2 className="section-title">Recent check-ins</h2>
          </div>
          {recent.map((d) => (
            <div key={d.label} className="recent-row">
              <span style={{ fontWeight: 500 }}>{d.label}</span>
              <span className={`badge ${d.done ? "badge-done" : "badge-missed"}`}>{d.done ? "Done" : "Missed"}</span>
            </div>
          ))}
        </section>
      </div>
    </>
  );
}
