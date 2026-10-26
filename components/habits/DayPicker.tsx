"use client";

/**
 * Pick which days of the week a habit is planned for.
 * Sends one hidden "days" field per chosen day (1 = Monday ... 7 = Sunday) with the form.
 */
import { useState } from "react";
import { DAY_NAMES } from "@/lib/schedule";

const PRESETS = [
  { label: "Every day", days: [1, 2, 3, 4, 5, 6, 7] },
  { label: "Weekdays", days: [1, 2, 3, 4, 5] },
  { label: "Weekends", days: [6, 7] },
];

export function DayPicker({ initial = [1, 2, 3, 4, 5, 6, 7] }: { initial?: number[] }) {
  const [days, setDays] = useState<number[]>(initial);

  function toggle(day: number) {
    setDays((current) => {
      if (current.includes(day)) {
        return current.length === 1 ? current : current.filter((d) => d !== day); // keep at least one day
      }
      return [...current, day].sort((a, b) => a - b);
    });
  }

  const same = (a: number[], b: number[]) => a.join(",") === b.join(",");

  return (
    <div className="field">
      <div className="label" id="day-picker-label">
        Days
      </div>
      <div className="day-picker" role="group" aria-labelledby="day-picker-label">
        {DAY_NAMES.map((name, i) => {
          const day = i + 1;
          return (
            <button key={day} type="button" className="day-btn" aria-pressed={days.includes(day)} onClick={() => toggle(day)}>
              {name.slice(0, 2)}
              <span className="sr-only">{name}</span>
            </button>
          );
        })}
      </div>
      <div className="day-presets">
        {PRESETS.map((p) => (
          <button key={p.label} type="button" className="day-preset" aria-pressed={same(days, p.days)} onClick={() => setDays(p.days)}>
            {p.label}
          </button>
        ))}
      </div>
      {days.map((d) => (
        <input key={d} type="hidden" name="days" value={d} />
      ))}
    </div>
  );
}
