"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteHabit , editHabit } from "@/lib/actions";
import type { Habit } from "@/lib/data";
export function HabitDetailActions({ habit }: { habit: Habit }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(habit.name);
  const [goal, setGoal] = useState(habit.goal);
  const [frequency, setFrequency] = useState(habit.frequency);
  const [color, setColor] = useState(habit.color);
  const [reminder, setReminder] = useState(habit.reminder);
  const [saving, setSaving] = useState(false);
  async function handleEditSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set("name", name);
    formData.set("goal", goal);
    formData.set("frequency", frequency);
    formData.set("color", color);
    formData.set("reminder", reminder);
    setSaving(true);
    try {
      await editHabit(habit.id, formData);
      router.refresh();
      setEditing(false);
    }
    catch {
    }finally {
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
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
        <div className="field">
          <label className="label" htmlFor="edit-habit-color">
            Color
          </label>
          <input type="color" id="edit-habit-color" name="color" defaultValue={habit.color} />
        </div>
        <div className="field">
          <label className="label" htmlFor="edit-habit-reminder">
            Reminder time
          </label>
          <input type="time" id="edit-habit-reminder" className="input" name="reminder" defaultValue={habit.reminder} />
        </div>
        <div className="btn-row">
          <button type="button" className="btn btn-outline" onClick={() => setEditing(false)}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={editing} onClick={() => setSaving(true)}>
            {editing ? "Save" : "Saving"}
          </button>
        </div>
      </form>
      }
    </div>
  );
}
