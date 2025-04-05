<script lang="ts">
	import type { Habit } from "$lib/types/habit";
  import { isCompleted } from "$lib/utils/habit";

	export let habits: {
		id: number;
		name: string;
		streak: number;
		target: string;
		color: string;
	}[];
	export let editMode: boolean;
	export let editingHabit: {
		id: number;
		name: string;
		streak: number;
		target: string;
		color: string;
	};
	export let startEdit: (habit: (typeof habits)[0]) => void;
	export let saveEdit: () => void;
	export let cancelEdit: () => void;
	export let deleteHabit: (id: number) => void;
  export let toggleCompletion: (habit: Habit, date: Date) => void;


  function calculateStreak(habit: Habit): number {
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

</script>

<div class="rounded-xl bg-white p-6 shadow-sm">
	<h2 class="mb-4 text-xl font-semibold">Your Habits</h2>

	{#if editMode}
		<!-- Edit Form -->
		<div class="mb-4 rounded-lg bg-gray-50 p-4">
			<h3 class="mb-2 font-medium">Edit Habit</h3>
			<div class="mb-3 flex flex-col gap-3 sm:flex-row">
				<input
					type="text"
					bind:value={editingHabit.name}
					class="flex-grow rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-800"
				/>
				<select
					bind:value={editingHabit.target}
					class="rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-800 sm:w-32"
				>
					<option value="Daily">Daily</option>
					<option value="Weekly">Weekly</option>
				</select>
			</div>
			<div class="flex justify-end gap-2">
				<button
					on:click={cancelEdit}
					class="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-100 cursor-pointer"
				>
					Cancel
				</button>
				<button
					on:click={saveEdit}
					class="rounded-lg bg-gray-800 px-4 py-2 text-white hover:bg-gray-700 cursor-pointer"
				>
					Save
				</button>
			</div>
		</div>
	{/if}

	<div class="space-y-3">
		{#each habits as habit}
			<div
				class="flex items-center justify-between rounded-lg bg-gray-50 p-4 transition-colors hover:bg-gray-100"
			>
				<div class="flex items-center">
            <button 
              class="mr-3 rounded-lg px-3 py-1 border w-28 text-center cursor-pointer" 
              style={isCompleted(habit, new Date()) ? 
                `background-color: ${habit.color}; color: white; border-color: ${habit.color};` : 
                `color: ${habit.color}; border-color: ${habit.color};`}
              on:click={() => toggleCompletion(habit, new Date())}
            >
              {isCompleted(habit, new Date()) ? 'Completed' : 'Complete'}
            </button>
					<div>
						<h3 class="font-medium">{habit.name}</h3>
						<p class="text-sm text-gray-500">{habit.target} · {calculateStreak(habit)} day streak</p>
					</div>
				</div>
				<div class="flex items-center gap-2">
					<button
						on:click={() => startEdit(habit)}
						class="rounded-full p-2 text-gray-500 hover:bg-gray-200 hover:text-blue-600 cursor-pointer"
						aria-label="Edit Habit"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-5 w-5"
							viewBox="0 0 20 20"
							fill="currentColor"
						>
							<path
								d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"
							/>
						</svg>
					</button>
					<button
						on:click={() => deleteHabit(habit.id)}
						class="rounded-full p-2 text-gray-500 hover:bg-gray-200 hover:text-red-600 cursor-pointer"
						aria-label="Delete Habit"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-5 w-5"
							viewBox="0 0 20 20"
							fill="currentColor"
						>
							<path
								fill-rule="evenodd"
								d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
								clip-rule="evenodd"
							/>
						</svg>
					</button>
				</div>
			</div>
		{/each}
	</div>
</div>
