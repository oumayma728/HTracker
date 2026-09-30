import { getHabitRates, getWeeklyCompletion } from "@/lib/data";
import { StatsBoard } from "@/components/stats/StatsBoard";

export default async function StatsPage() {
  const [weeks, rates] = await Promise.all([getWeeklyCompletion(), getHabitRates()]);

  return (
    <>
      <header className="page-head">
        <div className="page-head-text">
          <div className="overline">Insights</div>
          <h1 className="page-title">Stats</h1>
        </div>
      </header>
      <StatsBoard weeks={weeks} rates={rates} />
    </>
  );
}