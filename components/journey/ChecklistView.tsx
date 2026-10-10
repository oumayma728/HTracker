"use client"; // needs click handlers

/**
 * ChecklistView: the same roadmap as a vertical list of rows.
 * Each row has a 36px status circle (green check / coral-outlined current / grey lock), the order and the title.
 * The current row is tinted and is the only clickable one; locked rows are dimmed.
 */
import { IconCheck, IconLock } from "@/components/Icons"; // status icons
import type { JourneyStep } from "@/lib/journey-data"; // shared step shape (type only)

type Props = {
  steps: JourneyStep[]; // ordered steps with derived status
  busy: boolean; // true while a completion is being saved
  onComplete: (step: JourneyStep) => void; // called when the current row is clicked
};

export function ChecklistView({ steps, busy, onComplete }: Props) {
  return (
    <ol className="card card-clip checklist" aria-label="Roadmap checklist"> {/* card-styled ordered list */}
      {steps.map((step) => {
        const circle = ( // the 36px status circle, same 3 states as the path
          <span className="check-circle" aria-hidden="true">
            {step.status === "done" && <IconCheck size={18} />} {/* done: check */}
            {step.status === "locked" && <IconLock size={16} />} {/* locked: padlock */}
          </span> // current: empty white circle with a coral outline
        );
        const text = ( // order + title (+ description for the current step)
          <span className="checklist-text">
            <span className="checklist-order">Step {step.order}</span> {/* position */}
            <span className="checklist-title">{step.title}</span> {/* title */}
            {step.status === "current" && step.description && ( // detail only on the current row
              <span className="checklist-desc">{step.description}</span>
            )}
          </span>
        );
        return (
          <li key={step.id} className={`checklist-row is-${step.status}`}> {/* row styled by status */}
            {step.status === "current" ? ( // only the current row is a button
              <button
                type="button" // not a form submit
                className="checklist-btn" // full-row hit area
                onClick={() => onComplete(step)} // parent confirms + saves
                disabled={busy} // block double submits
                aria-label={`Step ${step.order}: ${step.title}. Mark as done`} // clear action for screen readers
              >
                {circle}
                {text}
                <span className="checklist-cta">{busy ? "Saving…" : "Mark done"}</span> {/* visible hint that it's clickable */}
              </button>
            ) : (
              <div className="checklist-btn"> {/* same layout, but not interactive */}
                {circle}
                {text}
                <span className="sr-only">{step.status === "done" ? "Done" : "Locked"}</span> {/* status in words */}
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
