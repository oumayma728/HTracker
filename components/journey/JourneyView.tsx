"use client"; // holds UI state (which view, saving, errors)

/**
 * JourneyView: shows the user's roadmap with a two-button switch between PathView and ChecklistView.
 * Both views read the SAME `journey` object, so they always agree.
 */
import { useState, useTransition } from "react"; // local state + non-blocking server calls
import { completeStep } from "@/lib/journey-actions"; // Server Action (ownership + order checked on the server)
import type { Journey, JourneyStep } from "@/lib/journey-data"; // data shape (type only)
import { PathView } from "./PathView"; // winding path view
import { ChecklistView } from "./ChecklistView"; // list view

type View = "path" | "list"; // the two display modes

export function JourneyView({ journey, onNew }: { journey: Journey; onNew: () => void }) {
  const [view, setView] = useState<View>("path"); // path view first
  const [error, setError] = useState<string | null>(null); // message from a failed completion
  const [pending, startTransition] = useTransition(); // pending = a completion is being saved

  const allDone = journey.completedCount === journey.total; // every step finished?
  const pct = journey.total ? Math.round((journey.completedCount / journey.total) * 100) : 0; // progress %

  function handleComplete(step: JourneyStep) {
    if (!window.confirm(`Mark "${step.title}" as done? This unlocks the next step.`)) return; // no undo in this version, so confirm
    setError(null); // clear any old error
    startTransition(async () => {
      const result = await completeStep(step.id); // server re-checks owner + order, then revalidates /journey
      if (result.error) setError(result.error); // show why it was refused
    });
  }

  return (
    <div className="journey">
      <header className="page-head"> {/* same header pattern as other pages */}
        <div className="page-head-text">
          <div className="overline">Your journey</div> {/* small label above the title */}
          <h1 className="page-title">{journey.title}</h1> {/* roadmap title from Claude */}
        </div>
        <button type="button" className="btn btn-outline" onClick={onNew}> {/* opens the creation form */}
          New roadmap
        </button>
      </header>

      <div className="journey-progress"> {/* progress summary */}
        <span className="muted small">
          {allDone ? `All ${journey.total} steps done. Nice work!` : `${journey.completedCount} of ${journey.total} steps done`}
        </span>
        <div className="meter" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Roadmap progress">
          <span className="meter-fill" style={{ width: `${pct}%` }} /> {/* filled part of the bar */}
        </div>
      </div>

      <div className="seg" role="group" aria-label="View"> {/* the two-button switch */}
        <button type="button" className="seg-btn" aria-pressed={view === "path"} onClick={() => setView("path")}>
          Path
        </button>
        <button type="button" className="seg-btn" aria-pressed={view === "list"} onClick={() => setView("list")}>
          Checklist
        </button>
      </div>

      {error && <p className="form-error" role="alert">{error}</p>} {/* server refused the completion */}

      {view === "path" ? ( // same data, two drawings
        <PathView steps={journey.steps} busy={pending} onComplete={handleComplete} />
      ) : (
        <ChecklistView steps={journey.steps} busy={pending} onComplete={handleComplete} />
      )}
    </div>
  );
}
