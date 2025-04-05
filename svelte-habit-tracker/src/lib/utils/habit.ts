import type { Habit } from "../types/habit";

export function isCompleted(habit: Habit, date: Date): boolean {
  if (!habit.completedDays) return false;
  const dateStr = date.toISOString().split('T')[0];
  return habit.completedDays.includes(dateStr);
}

export function calculateStreak(habit: Habit): number {
  let completedDays = habit.completedDays || [];
  const sortedCompletedDays = completedDays.sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
  let currDay = new Date().toISOString().split('T')[0];
  let currStreak = 0;
  
  for(let i = sortedCompletedDays.length - 1; i >= 0; i--) {
    if (sortedCompletedDays[i] === currDay) {
      currStreak++;
      currDay = new Date(new Date(currDay).setDate(new Date(currDay).getDate() - 1)).toISOString().split('T')[0];
    } else {
      break;
    }
  }
  return currStreak;
}