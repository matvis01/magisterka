<script lang="ts">
	import type { Habit } from "$lib/types/habit";
	import { isCompleted } from "$lib/utils/habit";

	export let weekDates: { date: Date; dayName: string; dayNumber: number; isToday: boolean }[];
	export let habits: {
		id: number;
		name: string;
		streak: number;
		target: string;
		color: string; // Just the color name without bg- prefix
		completedDays?: string[]; // Array of dates in ISO format
	}[];

  export let toggleCompletion: (habit: Habit, date: Date) => void;

</script>

<div class="mt-6 rounded-xl bg-white p-6 shadow-sm">
	<!-- Calendar Header -->
	<div class="mb-2 grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_1fr_1fr] gap-2">
		<div></div>
		{#each weekDates as day}
			<div class="flex flex-col items-center">
				<div class="text-xs text-gray-500">{day.dayName}</div>
				<div
					class={`mx-auto flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${day.isToday ? 'bg-gray-800 text-white' : ''}`}
				>
					{day.dayNumber}
				</div>
			</div>
		{/each}
	</div>

	<!-- Habits Grid -->
	{#each habits as habit}
		<div class="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_1fr_1fr] gap-2 border-t border-gray-100 py-3">
			<div class="flex items-center">
				<div class={`h-3 w-3 rounded-full mr-3`} style={`background-color: ${habit.color};`}></div>
				<span class="truncate w-36 ">{habit.name}</span>
			</div>
			{#each weekDates as day, i}
				<div class="flex items-center justify-center">
          <button
            aria-label="Habit completion for {habit.name} on {day.dayName}"
            class={`h-8 w-8 rounded-full border-2 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 
            ${isCompleted(habit, day.date) 
              ? 'border-transparent' 
              : 'border-gray-200 hover:border-gray-400'}`}
            style={isCompleted(habit, day.date) ? `background-color: ${habit.color};` : ''}
            on:click={() => toggleCompletion(habit, day.date)}
          ></button>
				</div>
			{/each}
		</div>
	{/each}
</div>
