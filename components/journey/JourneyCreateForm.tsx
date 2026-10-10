"use client"; // form state, file checks, pending UI

/**
 * JourneyCreateForm: three ways to start a roadmap. All of them end in the same Claude pipeline on the server.
 *  - Paste text      -> createRoadmapFromInput (mode "text")
 *  - Describe a goal -> createRoadmapFromInput (mode "manual")
 *  - Upload a PDF    -> createRoadmapFromPdf
 */
import { useActionState, useState } from "react"; // form state from Server Actions + local state
import { createRoadmapFromInput, createRoadmapFromPdf, type JourneyFormState } from "@/lib/journey-actions"; // Server Actions

type Mode = "text" | "manual" | "pdf"; // the three input modes
const MAX_PDF_BYTES = 10 * 1024 * 1024; // 10MB: same cap the server enforces (checked here only for a faster message)
const MODES: { id: Mode; label: string }[] = [ // labels for the mode switch
  { id: "manual", label: "Describe" }, // short typed description
  { id: "text", label: "Paste text" }, // pasted notes / syllabus / plan
  { id: "pdf", label: "Upload PDF" }, // a document
];

type Props = {
  hasRoadmap: boolean; // true if the user already has a roadmap (shows the replace warning + cancel)
  onCancel?: () => void; // go back to the roadmap without creating
};

export function JourneyCreateForm({ hasRoadmap, onCancel }: Props) {
  const [mode, setMode] = useState<Mode>("manual"); // start with the simplest mode
  const [fileError, setFileError] = useState<string | null>(null); // client-side PDF size error
  const [textState, textAction, textPending] = useActionState<JourneyFormState, FormData>(createRoadmapFromInput, {}); // text/manual form
  const [pdfState, pdfAction, pdfPending] = useActionState<JourneyFormState, FormData>(createRoadmapFromPdf, {}); // PDF form

  const pending = textPending || pdfPending; // either request running
  const state = mode === "pdf" ? pdfState : textState; // messages for the visible form

  return (
    <section className="journey">
      <header className="page-head"> {/* same header pattern as other pages */}
        <div className="page-head-text">
          <div className="overline">Journey</div> {/* small label */}
          <h1 className="page-title">{hasRoadmap ? "Start a new roadmap" : "Build your roadmap"}</h1> {/* title */}
        </div>
      </header>

      <div className="card card-pad journey-form"> {/* the form card */}
        <p className="muted"> {/* short explanation */}
          Tell us where you want to get to. We&apos;ll turn it into steps you unlock one at a time.
        </p>

        <div className="seg" role="group" aria-label="Input type"> {/* mode switch, same style as the view switch */}
          {MODES.map((m) => (
            <button key={m.id} type="button" className="seg-btn" aria-pressed={mode === m.id} onClick={() => setMode(m.id)} disabled={pending}>
              {m.label}
            </button>
          ))}
        </div>

        {mode === "pdf" ? ( // PDF upload form
          <form action={pdfAction} className="journey-form">
            <div className="field">
              <label className="label" htmlFor="journey-file">PDF file (up to 10MB)</label> {/* field label */}
              <input
                id="journey-file" // matches the label
                name="file" // read by createRoadmapFromPdf
                type="file" // file picker
                accept="application/pdf,.pdf" // only offer PDFs in the picker
                className="input" // same look as other inputs
                required // can't submit without a file
                onChange={(e) => { // check size before uploading
                  const file = e.currentTarget.files?.[0]; // chosen file
                  if (file && file.size > MAX_PDF_BYTES) { // too big
                    setFileError("That PDF is larger than 10MB. Please choose a smaller file or paste the text instead."); // explain
                    e.currentTarget.value = ""; // clear the selection
                  } else {
                    setFileError(null); // fine
                  }
                }}
              />
            </div>
            {fileError && <p className="form-error" role="alert">{fileError}</p>} {/* client-side size error */}
            <SubmitRow pending={pdfPending} hasRoadmap={hasRoadmap} onCancel={onCancel} /> {/* buttons */}
          </form>
        ) : ( // text + manual share one form; only the field size differs
          <form action={textAction} className="journey-form" key={mode}> {/* key resets the field when switching modes */}
            <input type="hidden" name="mode" value={mode} /> {/* tells the server which mode */}
            <div className="field">
              <label className="label" htmlFor="journey-text"> {/* field label */}
                {mode === "manual" ? "What do you want to achieve?" : "Paste your notes, plan or syllabus"}
              </label>
              <textarea
                id="journey-text" // matches the label
                name="text" // read by createRoadmapFromInput
                className="input textarea" // input look + textarea sizing
                required // can't submit empty
                minLength={20} // same minimum the server checks
                maxLength={mode === "manual" ? 1000 : 15000} // short for a description, ~15k for pasted text
                rows={mode === "manual" ? 4 : 10} // starting height
                placeholder={
                  mode === "manual"
                    ? "e.g. Run a 10k in three months. I can only run 1km right now." // description example
                    : "Paste anything with a goal in it: course outline, project plan, notes…" // paste example
                }
              />
            </div>
            <SubmitRow pending={textPending} hasRoadmap={hasRoadmap} onCancel={onCancel} /> {/* buttons */}
          </form>
        )}

        {state.error && <p className="form-error" role="alert">{state.error}</p>} {/* server/AI error */}
        {state.notice && <p className="form-notice" role="status">{state.notice}</p>} {/* e.g. input was truncated */}
      </div>
    </section>
  );
}

/** Cancel + submit buttons, shared by both forms. */
function SubmitRow({ pending, hasRoadmap, onCancel }: { pending: boolean; hasRoadmap: boolean; onCancel?: () => void }) {
  return (
    <>
      {hasRoadmap && ( // warn before replacing
        <p className="muted small">Your new roadmap will replace the one you see now.</p>
      )}
      <div className="btn-row">
        {onCancel && ( // only when there's a roadmap to go back to
          <button type="button" className="btn btn-outline btn-lg" onClick={onCancel} disabled={pending}>
            Cancel
          </button>
        )}
        <button type="submit" className="btn btn-primary btn-lg" disabled={pending}> {/* sends the form */}
          {pending ? "Building your roadmap…" : "Build roadmap"} {/* Claude can take ~10-30s */}
        </button>
      </div>
    </>
  );
}
