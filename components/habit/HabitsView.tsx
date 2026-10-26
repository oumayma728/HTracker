"use client";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import { createHabit } from "@/lib/actions";
import { IconChevronRight, IconClose, IconFlame } from "@/components/Icons";
import { daysLabel } from "@/lib/format";
import type { Habit } from "@/lib/data";
import { DayPicker } from "@/components/habits/DayPicker";

const COLOR_OPTIONS = [
  { id: "blue", name: "Blue", hex: "#3F6FA6" },
  { id: "ochre", name: "Ochre", hex: "#9C6F17" },
  { id: "coral", name: "Coral", hex: "#B8452F" },
  { id: "plum", name: "Plum", hex: "#8A4F7D" },
  { id: "green", name: "Green", hex: "#2E6F55" },
];
export  function HabitsView({ habits }: { habits: Habit[] }) {
    const [showForm, setShowForm] = useState(false); // set to false to start with the form closed
const [colorId , setColorId] = useState("green");

    async function handleSave(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        await createHabit(new FormData(e.currentTarget));
        setShowForm(false);
    }
    return (
        <>
            <header className="page-head">
                <div className="page-head-text">
                    <div className="overline">{habits.length} active habits</div>
                    <h1 className="page-title">Your habits</h1>
                </div>
                <button type="button" className="btn btn-primary" aria-expanded={showForm} onClick={() => setShowForm(true)}>
                    New habit
                </button>
            </header>
            <div className="split">
                <section className="card card-clip grow">
                    <div className="list-head">
                        <span>Habit</span>
                        <span>Streak</span>
                        <span />
                    </div>
                    {habits.length === 0 && (
                        <p className="muted" style={{ padding: 24 }}>
                            No habits yet. Click New habit to add your first one.
                        </p>
                    )}

                    {habits.map((h) => (
                        <div key={h.id} className="list-row">
                            <Link href={`/habits/${h.id}`} className="list-link">
                                <span className="dot dot-lg" style={{ background: h.color }} />
                                <span className="list-link-text">
                                    <span className="habit-name">{h.name}</span>
                                    <span className="habit-sub">
                                        {h.scheduleLabel} · Goal: {h.goal} · Reminder {h.reminder}
                                    </span>
                                </span>
                            </Link>

                            <div className="streak" style={{ width: "fit-content" }}>
                                <IconFlame size={14} />
                                {daysLabel(h.streakBeforeToday)}
                            </div>

                            <Link href={`/habits/${h.id}`} className="icon-btn" aria-label={`Open ${h.name}`}>
                                <IconChevronRight />
                            </Link>
                        </div>
                    ))}
                </section>
                {showForm && (
                    <form className="card side-panel" aria-label="New habit" onSubmit={handleSave}>
                        <div className="row-between">
                            <h2 className="section-title">New habit</h2>
                            <button type="button" className="icon-btn panel-close" aria-label="Close" onClick={() => setShowForm(false)}>
                                <IconClose />
                            </button>
                        </div>

                        <div className="field">
                            <label className="label" htmlFor="habit-name">
                                Habit name
                            </label>
                            <input id="habit-name" name="name" type="text" className="input" placeholder="e.g., Drink water" required />
                        </div>

                        <div className="field">
                            <label className="label" htmlFor="habit-goal">
                                Goal
                            </label>
                            <input id="habit-goal" name="goal" type="text" className="input" placeholder="e.g., 8 glasses" />
                        </div>

                        <DayPicker />

                        <div className="field">
                            <label className="label" htmlFor="habit-reminder">
                                Reminder time
                            </label>
                            <input id="habit-reminder" name="reminder" type="time" className="input" />
                        </div>

                        <div className="field">
                        <div className="label">Color</div>
                        <div className="swatch-row">
                            {COLOR_OPTIONS.map((c) => (
                            <button
                                key={c.id}
                                type="button"
                                className="swatch"
                                aria-label={c.name}
                                aria-pressed={colorId === c.id}
                                onClick={() => setColorId(c.id)}
                            >
                                <span className="swatch-dot" style={{ background: c.hex }} />
                            </button>
                            ))}
                        </div>
                        <input type="hidden" name="color" value={colorId} />
                        </div>

                        <div className="btn-row">
                            <button type="button" className="btn btn-outline btn-lg" onClick={() => setShowForm(false)}>
                                Cancel
                            </button>
                            <button type="submit" className="btn btn-primary btn-lg">
                                Save habit
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </>
    )
}