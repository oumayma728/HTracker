/**
 * Journey data layer (read side). Same rule as lib/data.ts:
 * ask who is logged in first, then read only that person's rows.
 */
import { prisma } from "@/lib/prisma"; // shared Prisma client
import { requireUser } from "@/lib/session"; // logged-in user or redirect to /login

/** Display state of a step. Derived from `completed` + position, never stored. */
export type StepStatus = "done" | "current" | "locked"; // done = finished, current = next to do, locked = later

export type JourneyStep = {
  id: string; // step id as a string (same convention as Habit.id)
  order: number; // 1-based position
  title: string; // short action title
  description: string | null; // optional detail
  status: StepStatus; // derived display state
};

export type Journey = {
  id: string; // roadmap id
  title: string; // roadmap title
  sourceType: string; // "pdf" | "text" | "manual"
  steps: JourneyStep[]; // ordered steps with derived status
  completedCount: number; // how many steps are done
  total: number; // how many steps exist
};

/**
 * Work out each step's status from the stored `completed` flags.
 * The first incomplete step is "current"; every step after it is "locked";
 * steps before it are "done". Exported so it can be reused/tested on its own.
 */
export function deriveStatuses(steps: { order: number; completed: boolean }[]): StepStatus[] {
  const firstOpen = steps.find((s) => !s.completed)?.order ?? Infinity; // order of the first unfinished step (Infinity = all done)
  return steps.map((s) => (s.order < firstOpen ? "done" : s.order === firstOpen ? "current" : "locked")); // compare each step to it
}

/** The logged-in user's most recent roadmap, or null if they haven't made one. */
export async function getLatestJourney(): Promise<Journey | null> {
  const user = await requireUser(); // must be logged in
  const roadmap = await prisma.roadmap.findFirst({
    where: { userId: user.id }, // only this user's roadmaps
    orderBy: { createdAt: "desc" }, // newest first
    select: {
      id: true, // roadmap id
      title: true, // roadmap title
      sourceType: true, // input type
      steps: {
        orderBy: { order: "asc" }, // steps in roadmap order
        select: { id: true, order: true, title: true, description: true, completed: true }, // only what the UI needs
      },
    },
  });
  if (!roadmap) return null; // no roadmap yet -> page shows the creation form

  const statuses = deriveStatuses(roadmap.steps); // derived, not stored
  return {
    id: String(roadmap.id), // stringify ids for the client
    title: roadmap.title, // title as stored
    sourceType: roadmap.sourceType, // input type as stored
    steps: roadmap.steps.map((s, i) => ({
      id: String(s.id), // step id as string
      order: s.order, // position
      title: s.title, // title
      description: s.description, // detail or null
      status: statuses[i], // derived status
    })),
    completedCount: roadmap.steps.filter((s) => s.completed).length, // finished steps
    total: roadmap.steps.length, // all steps
  };
}
