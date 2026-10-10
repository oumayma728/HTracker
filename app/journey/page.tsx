import { getLatestJourney } from "@/lib/journey-data"; // server-side read, scoped to the logged-in user
import { JourneyScreen } from "@/components/journey/JourneyScreen"; // client component that draws it

// Server page: loads the data, the client component draws it (same pattern as app/habits/page.tsx).
export default async function JourneyPage() {
  const journey = await getLatestJourney(); // newest roadmap or null
  return <JourneyScreen key={journey?.id ?? "none"} journey={journey} />; // key: remount when a new roadmap replaces the old one
}
