export type Habit = {
  id: number;
  name: string;
  bestStreak: number;
  color: string; // Hex color value (e.g., '#10b981')
  completedDays?: string[]; // Array of completed dates in ISO format
};

export type WeekDate = {
  date: Date;
  dayName: string;
  dayNumber: number;
  isToday: boolean;
};
