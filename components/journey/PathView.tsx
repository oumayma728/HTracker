"use client"; // needs click handlers

/**
 * PathView: the roadmap drawn as a winding trail.
 * Nodes are stacked vertically and pushed left/right in a wave; ONE dashed line runs behind all of them.
 * Done = dark green + check, current = white + coral ring (the only clickable node), rest = grey + lock.
 */
import type { CSSProperties } from "react"; // type for the inline CSS variable
import { IconCheck, IconLock } from "@/components/Icons"; // node icons
import type { JourneyStep } from "@/lib/journey-data"; // shared step shape (type only, no server code)

type Props = {
  steps: JourneyStep[]; // ordered steps with derived status
  busy: boolean; // true while a completion is being saved
  onComplete: (step: JourneyStep) => void; // called when the current node is clicked
};

export function PathView({ steps, busy, onComplete }: Props) {
  return (
    <div className="path"> {/* positioning box for the line + list */}
      <span className="path-line" aria-hidden="true" /> {/* the single dashed line behind every node */}
      <ol className="path-list" aria-label="Roadmap path"> {/* ordered list: order matters */}
      {steps.map((step, i) => {
        const wave = Math.sin((i * Math.PI) / 3); // -1..1, repeats every 6 nodes: gives the left/right wave
        const style = { "--wave": wave.toFixed(3) } as CSSProperties; // CSS turns this into a horizontal offset
        return (
          <li key={step.id} className={`path-item is-${step.status}`} style={style}> {/* one stop on the path */}
            {step.status === "current" ? ( // only the current step is interactive
              <button
                type="button" // not a form submit
                className="path-node" // circle styling
                onClick={() => onComplete(step)} // parent confirms + saves
                disabled={busy} // block double submits
                aria-label={`Step ${step.order}: ${step.title}. Mark as done`} // full label for screen readers
              >
                <span className="path-num">{step.order}</span> {/* step number inside the ring */}
              </button>
            ) : (
              <span className="path-node" aria-hidden="true"> {/* done/locked nodes are plain, not clickable */}
                {step.status === "done" ? <IconCheck size={26} /> : <IconLock size={22} />} {/* check or padlock */}
              </span>
            )}
            <span className="path-label"> {/* text under the node */}
              <span className="path-title">{step.title}</span> {/* step title */}
              {step.status === "current" && step.description && ( // only the current step shows its detail
                <span className="path-desc">{step.description}</span>
              )}
              <span className="sr-only"> {/* status in words for screen readers */}
                {step.status === "done" ? "Done" : step.status === "locked" ? "Locked" : ""}
              </span>
            </span>
          </li>
        );
      })}
      </ol>
    </div>
  );
}
