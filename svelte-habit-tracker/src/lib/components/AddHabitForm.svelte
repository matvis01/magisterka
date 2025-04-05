<script lang="ts">
  export let newHabitName: string;
  export let newHabitTarget: string;
  export let addHabit: () => void;
</script>

<div class="bg-white rounded-xl shadow-sm p-6 mb-6">
  <h2 class="text-xl font-semibold mb-4">Add New Habit</h2>
  <div class="flex flex-col sm:flex-row gap-3">
    <input 
      type="text" 
      bind:value={newHabitName} 
      placeholder="What habit do you want to track?" 
      class="flex-grow px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-800"
    />
    <select 
      bind:value={newHabitTarget}
      class="sm:w-32 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-800"
    >
      <option value="Daily">Daily</option>
      <option value="Weekly">Weekly</option>
    </select>
    <button 
      on:click={addHabit}
      class="px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
    >
      Add Habit
    </button>
  </div>
</div>
