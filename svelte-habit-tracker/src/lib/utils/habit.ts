import type { Habit } from "../types/habit";

export function isCompleted(habit: Habit, date: Date): boolean {
  if (!habit.completedDays) return false;
  const dateStr = date.toISOString().split('T')[0];
  return habit.completedDays.includes(dateStr);
}