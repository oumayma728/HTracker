"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteHabit , editHabit } from "@/lib/actions";
import type { Habit } from "@/lib/data";
const COLOR_OPTIONS = [
  { id: "blue", name: "Blue", hex: "#3F6FA6" },
  { id: "ochre", name: "Ochre", hex: "#9C6F17" },
  { id: "coral", name: "Coral", hex: "#B8452F" },
  { id: "plum", name: "Plum", hex: "#8A4F7D" },
  { id: "green", name: "Green", hex: "#2E6F55" },
];

export function HabitDetailActions({ habit }: { habit: Habit }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [colorId, setColorId] = useState(
    COLOR_OPTIONS.find((c) => c.hex.toLowerCase() === habit.color.toLowerCase())?.id ?? "green"
  );
  const [saving, setSaving] = useState(false);

  async function handleEditSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    try {
      await editHabit(habit.id, new FormData(e.currentTarget));
      router.refresh();
      setEditing(false);
    } catch {
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm("Delete this habit and all of its check-ins? This can't be undone.")) return;
    setDeleting(true);
    try {
      await deleteHabit(habit.id);
      router.push("/habits");
      router.refresh();
    } catch {
      setDeleting(false);
    }
  }

  return (
    <div className="stack" style={{ alignItems: "flex-end", gap: 16 }}>
      <div className="btn-row">
        <button type="button" className="btn btn-outline" onClick={() => setEditing(!editing)} disabled={editing}>
          Edit
        </button>
        <button type="button" className="btn btn-danger" onClick={handleDelete} disabled={deleting}>
          {deleting ? "Deleting…" : "Delete"}
        </button>
      </div>
      {editing
      &&
      <form onSubmit={handleEditSubmit} className="card card-pad stack" style={{ width: "100%", gap: 16 }}>
        <div className="field">
          <label className="label" htmlFor="edit-habit-name">
            Habit name
          </label>
          <input type="text" id="edit-habit-name" className="input" name="name" defaultValue={habit.name} required />
        </div>
        <div className="field">
          <label className="label" htmlFor="edit-habit-goal">
            Goal
          </label>
          <input type="text" id="edit-habit-goal" className="input" name="goal" defaultValue={habit.goal} />
        </div>
        <div className="field">
          <label className="label" htmlFor="edit-habit-frequency">
            Frequency
          </label>
          <select id="edit-habit-frequency" className="input" name="frequency" defaultValue={habit.frequency}>
            <option value="daily">Daily</option>
            <option value="weekdays">Weekdays</option>
            <option value="three">3 times a week</option>
          </select>
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
        <div className="field">
          <label className="label" htmlFor="edit-habit-reminder">
            Reminder time
          </label>
          <input type="time" id="edit-habit-reminder" className="input" name="reminder" defaultValue={habit.remindTime} />
        </div>
        <div className="btn-row">
          <button type="button" className="btn btn-outline" onClick={() => setEditing(false)}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
      }
    </div>
  );
}
