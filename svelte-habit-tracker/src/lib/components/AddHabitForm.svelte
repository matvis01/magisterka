<script lang="ts">
	import ColorPicker from 'svelte-awesome-color-picker';

	export let newHabitName: string;
	export let addHabit: (color: string) => void;

    const colors = ['#10b981', '#8b5cf6', '#0ea5e9', '#f59e0b', '#f43f5e'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
	let hex: string = randomColor;
</script>

<div class="mb-6 rounded-xl bg-white p-6 shadow-sm">
	<h2 class="mb-4 text-xl font-semibold">Add New Habit</h2>
	<div class="flex flex-col gap-3 sm:flex-row">
		<input
			type="text"
			bind:value={newHabitName}
			placeholder="What habit do you want to track?"
			class="flex-grow rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-800"
		/>

		<div class="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 p-2">
			<ColorPicker bind:hex isAlpha={false} />
		</div>
		<button
			on:click={() => addHabit(hex)}
			class="rounded-lg bg-gray-800 px-6 py-2 text-white transition-colors hover:bg-gray-700 cursor-pointer"
		>
			Add Habit
		</button>
	</div>
</div>
