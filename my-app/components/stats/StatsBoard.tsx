"use client";
import { useState } from "react";
import type { CSSProperties } from "react";
import type { HabitRate, WeekBar } from "@/lib/data";

export function StatsBoard({ weeks, rates }: { weeks: WeekBar[]; rates: HabitRate[] }) {
  const [range, setRange] = useState(8);
  const shown = weeks.slice(-range);

  const avg = shown.length ? Math.round(shown.reduce((a, w) => a + w.value, 0) / shown.length) : 0;
  const best = shown.length ? Math.max(...shown.map((w) => w.value)) : 0;
  const checkins = shown.reduce((a, w) => a + Math.round((w.value / 100) * rates.length * 7), 0);

  return (
    <>
      <div className="kpis">
        <section className="card kpi">
          <div className="kpi-label">Average completion</div>
          <div className="kpi-value">{avg}%</div>
        </section>
        <section className="card kpi">
          <div className="kpi-label">Best week</div>
          <div className="kpi-value">{best}%</div>
        </section>
        <section className="card kpi">
          <div className="kpi-label">Check-ins</div>
          <div className="kpi-value">{checkins}</div>
        </section>
      </div>

      <div className="stats-grid">
        <section className="card chart-card">
          <div className="chart-head">
            <div>
              <h2 className="card-title">Weekly completion</h2>
              <div className="muted small">Share of scheduled check-ins done each week</div>
            </div>
            <div className="range" role="group" aria-label="Time range">
              {[8, 12].map((n) => (
                <button key={n} type="button" className="pill" aria-pressed={range === n} onClick={() => setRange(n)}>
                  {n} weeks
                </button>
              ))}
            </div>
          </div>

          <div className="bars">
            {shown.map((w, i) => (
              <div key={w.label} className="bar-slot">
                <span className="bar-value">{w.value}%</span>
                <div
                  className={i === shown.length - 1 ? "bar is-current" : "bar"}
                  style={{ height: `${Math.round(w.value * 1.9)}px` }}
                />
              </div>
            ))}
          </div>
          <div className="bar-labels">
            {shown.map((w) => (
              <span key={w.label}>{w.label}</span>
            ))}
          </div>
        </section>

        <section className="card byhabit">
          <div>
            <h2 className="card-title">By habit</h2>
            <div className="muted small">Last 8 weeks</div>
          </div>
          {rates.map((h) => (
            <div key={h.id} className="meter-row" style={{ "--habit": h.color } as CSSProperties}>
              <div className="meter-top">
                <span>{h.name}</span>
                <span>{h.pct}%</span>
              </div>
              <div className="meter">
                <i className="meter-fill" style={{ width: `${h.pct}%` }} />
              </div>
            </div>
          ))}
        </section>
      </div>
    </>
  );
}