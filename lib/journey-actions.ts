"use server"; // every export in this file is a Server Action: runs only on the server

/**
 * Journey Server Actions: create a roadmap (from text, a description, or a PDF) and complete steps.
 * Same rules as lib/actions.ts: requireUser() first, and only touch the logged-in user's rows.
 */
import { revalidatePath } from "next/cache"; // tells Next to re-render pages after a write
import { prisma } from "@/lib/prisma"; // shared Prisma client
import { requireUser } from "@/lib/session"; // returns the logged-in user or redirects to /login
import { generateRoadmapSteps } from "@/lib/journey-ai"; // Claude call + validation
import { extractPdfText } from "@/lib/pdf-text"; // PDF -> plain text

/** State returned to the creation form (used with React's useActionState). */
export type JourneyFormState = { error?: string; notice?: string }; // error = red message, notice = info message

/* ---------- shared pipeline ---------- */

/**
 * Same pipeline for all three input modes: raw text -> Claude -> validated steps -> database.
 * Not exported, so the browser can't call it directly with any userId.
 */
async function createRoadmapFromText(
  userId: string, // owner, always taken from requireUser() by the caller
  rawText: string, // pasted text, typed description, or extracted PDF text
  sourceType: "pdf" | "text" | "manual", // where the text came from
): Promise<JourneyFormState> {
  const result = await generateRoadmapSteps(rawText); // ask Claude (never throws)
  if (!result.ok) return { error: result.error }; // show the friendly error in the form

  await prisma.roadmap.create({ // one write creates the roadmap and all its steps together
    data: {
      userId, // owner
      title: result.title, // Claude's title (already capped)
      sourceType, // "pdf" | "text" | "manual"
      steps: {
        create: result.steps.map((s, i) => ({ // nested create of every step
          order: i + 1, // 1-based position
          title: s.title, // capped step title
          description: s.description, // capped description or null
        })),
      },
    },
  });

  revalidatePath("/journey"); // the page shows the new roadmap on next render
  return result.truncated // tell the user if we only used the start of their text
    ? { notice: "Your text was long, so only the first part was used to build the roadmap." }
    : {}; // plain success
}

/* ---------- text + manual ---------- */

/** Create a roadmap from pasted text ("text") or a short typed description ("manual"). */
export async function createRoadmapFromInput(
  _prev: JourneyFormState, // previous form state (required by useActionState, unused)
  formData: FormData, // fields: mode, text
): Promise<JourneyFormState> {
  const user = await requireUser(); // must be logged in
  const mode = formData.get("mode") === "manual" ? "manual" : "text"; // only two allowed values
  const text = String(formData.get("text") ?? ""); // the user's input
  return createRoadmapFromText(user.id, text, mode); // shared pipeline
}

/* ---------- completing a step ---------- */

/**
 * Mark one step as done. The UI only lets the current step be clicked, but we check again here:
 * the step must belong to the user, not be done yet, and its order must equal completedCount + 1.
 */
export async function completeStep(stepId: string): Promise<{ error?: string }> {
  const user = await requireUser(); // must be logged in
  const id = Number(stepId); // ids arrive as strings from the client
  if (!Number.isInteger(id)) return { error: "Invalid step." }; // reject junk input

  const step = await prisma.roadmapStep.findFirst({
    where: { id, roadmap: { userId: user.id } }, // ownership check through the parent roadmap
    select: { id: true, order: true, completed: true, roadmapId: true }, // what we need for the checks
  });
  if (!step) return { error: "Step not found." }; // not theirs, or doesn't exist
  if (step.completed) return {}; // already done: nothing to do (e.g. a double click)

  const completedCount = await prisma.roadmapStep.count({
    where: { roadmapId: step.roadmapId, completed: true }, // finished steps in the same roadmap
  });
  if (step.order !== completedCount + 1) { // not the next step in sequence
    return { error: "Finish the earlier steps first." }; // enforce the order on the server
  }

  await prisma.roadmapStep.updateMany({
    where: { id: step.id, completed: false }, // only flips it once, even if two requests race
    data: { completed: true, completedAt: new Date() }, // mark done + timestamp
  });

  revalidatePath("/journey"); // re-render the page with the new progress
  return {}; // success
}

/* ---------- PDF ---------- */

/** Create a roadmap from an uploaded PDF: extract its text, then use the same pipeline. */
export async function createRoadmapFromPdf(
  _prev: JourneyFormState, // previous form state (required by useActionState, unused)
  formData: FormData, // field: file
): Promise<JourneyFormState> {
  const user = await requireUser(); // must be logged in
  const pdf = await extractPdfText(formData.get("file")); // size/type checks + text extraction
  if (!pdf.ok) return { error: pdf.error }; // e.g. too big, scanned, not a PDF
  return createRoadmapFromText(user.id, pdf.text, "pdf"); // same Claude pipeline as text input
}
