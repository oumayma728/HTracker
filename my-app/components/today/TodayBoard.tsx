"use client";

import { useState, useTransition } from "react";
import type { CSSProperties } from "react";
import { IconCheck, IconFlame } from "../Icons";
import { StreakChip } from "../StreakChip";
import { pluralDays } from "@/lib/format";
import { toggleHabit } from "@/lib/actions";
import type { Habit, WeekDay } from "@/lib/data";

type Props = {
  habits: Habit[];
  initialDone: Record<string, boolean>;
  week: WeekDay[];
  todayIso: string;
};

export function TodayBoard({ habits, initialDone, week, todayIso }: Props) {
  const [done, setDone] = useState(initialDone);
  const [, startTransition] = useTransition();

  const total = habits.length;
  const rows = habits.map((h) => ({
    ...h,
    isDone: Boolean(done[h.id]),
    streak: h.streakBeforeToday + (done[h.id] ? 1 : 0),
  }));
  const doneCount = rows.filter((r) => r.isDone).length;
  const best = rows.reduce<(typeof rows)[number] | null>((a, b) => (!a || b.streak > a.streak ? b : a), null);

  function toggle(id: string) {
    const next = !done[id];
    setDone((d) => ({ ...d, [id]: next })); // update the screen immediately
    startTransition(async () => {
      try {
        await toggleHabit(id, todayIso, next); // then save on the server
      } catch {
        setDone((d) => ({ ...d, [id]: !next })); // put it back if saving failed
      }
    });
  }

  const remaining = total - doneCount;
  let message = `${remaining} habits to go.`;
  if (total > 0 && remaining === 0) message = "All done for today. Nice work.";
  else if (doneCount === 0) message = "Nothing checked off yet.";
  else if (remaining === 1) message = "One habit to go.";

  const deg = total ? Math.round((doneCount / total) * 360) : 0;
  const ringStyle: CSSProperties = {
    background: `conic-gradient(var(--green) ${deg}deg, var(--border) ${deg}deg)`,
  };

  return (
    <>
      <div className="week">
        {week.map((d) => {
          const status = d.kind === "today" ? `${doneCount}/${total}` : d.kind === "past" ? `${d.done}/${total}` : "–";
          return (
            <div key={d.label} className={`week-day is-${d.kind}`} aria-current={d.kind === "today" ? "date" : undefined}>
              <span className="week-label">{d.label}</span>
              <span className="week-num">{d.num}</span>
              <span className="week-status">{status}</span>
            </div>
          );
        })}
      </div>

      <div className="today-grid">
        <section className="card habit-list">
          <div className="card-head">
            <h2 className="card-title">Today&apos;s habits</h2>
            <span className="muted small">
              {doneCount} of {total} done
            </span>
          </div>
          {rows.map((h) => (
            <div key={h.id} className="habit-row" style={{ "--habit": h.color } as CSSProperties}>
              <button
                type="button"
                className={h.isDone ? "check is-done" : "check"}
                aria-pressed={h.isDone}
                aria-label={`Mark ${h.name} done`}
                onClick={() => toggle(h.id)}
              >
                {h.isDone && <IconCheck size={22} />}
              </button>
              <div className="habit-main">
                <div className="habit-line">
                  <span className="habit-dot" />
                  <span className={h.isDone ? "habit-name is-done" : "habit-name"}>{h.name}</span>
                </div>
                <div className="habit-goal">Goal: {h.goal}</div>
              </div>
              <StreakChip days={h.streak} />
            </div>
          ))}
        </section>

        <aside className="side">
          <section className="card ring-card">
            <h2 className="card-title">Progress</h2>
            <div className="ring" style={ringStyle} role="img" aria-label={`${doneCount} of ${total} habits done`}>
              <div className="ring-inner">
                <span className="ring-num">{doneCount}</span>
                <span className="muted small">of {total}</span>
              </div>
            </div>
            <p className="ring-message">{message}</p>
          </section>

          {best && (
            <section className="card best">
              <div className="best-icon">
                <IconFlame size={26} />
              </div>
              <div>
                <div className="muted small">Longest active streak</div>
                <div className="best-num">{pluralDays(best.streak)}</div>
                <div className="muted small">{best.name}</div>
              </div>
            </section>
          )}
        </aside>
      </div>
    </>
  );
}
