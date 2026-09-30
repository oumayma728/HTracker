import { IconFlame } from "./Icons";
import { pluralDays } from "@/lib/format";

export function StreakChip({ days }: { days: number }) {
  return (
    <span className="streak">
      <IconFlame size={16} />
      {pluralDays(days)}
    </span>
  );
}
