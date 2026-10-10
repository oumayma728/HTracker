"use client"; // decides between the form and the roadmap on the client

/**
 * JourneyScreen: no roadmap -> creation form; roadmap -> JourneyView (with a "New roadmap" button that opens the form).
 * The page renders this with key={journey.id}, so after a new roadmap is created the component remounts
 * and drops back to the roadmap view automatically.
 */
import { useState } from "react"; // "is the form open" flag
import type { Journey } from "@/lib/journey-data"; // data shape (type only)
import { JourneyView } from "./JourneyView"; // roadmap display
import { JourneyCreateForm } from "./JourneyCreateForm"; // creation form

export function JourneyScreen({ journey }: { journey: Journey | null }) {
  const [creating, setCreating] = useState(false); // user clicked "New roadmap"

  if (!journey) return <JourneyCreateForm hasRoadmap={false} />; // first visit: only the form
  if (creating) return <JourneyCreateForm hasRoadmap onCancel={() => setCreating(false)} />; // replacing an existing roadmap
  return <JourneyView journey={journey} onNew={() => setCreating(true)} />; // normal view
}
