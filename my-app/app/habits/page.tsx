import { getHabits } from "@/lib/data";
import { HabitsView } from "@/components/habit/HabitsView";

export default async function HabitsPage() {
  const habits = await getHabits();
  return <HabitsView habits={habits} />;
}