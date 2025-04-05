<script lang="ts">
  export let habits: {
    id: number;
    name: string;
    streak: number;
    target: string;
    color: string;
  }[];
</script>

<div>
  <div class="bg-white rounded-xl shadow-sm p-6 mb-6">
    <h2 class="text-xl font-semibold mb-6">Habit History</h2>
    
    <!-- Sample charts and statistics -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6"></div>
    
    <div class="bg-gray-50 p-4 rounded-lg">
      <h3 class="font-medium mb-2">Streak Calendar</h3>
      
      <div class="grid grid-cols-7 gap-1 mt-4">
        {#each Array(35) as _, i}
          <div 
            class={`w-full aspect-square rounded-sm ${Math.random() > 0.5 ? 'bg-emerald-500' : 'bg-gray-200'}`}
          ></div>
        {/each}
      </div>
    </div>
  </div>
      
  <!-- Habit Performance -->
  <h3 class="font-medium mb-3">Habit Performance</h3>
  <div class="space-y-4">
    {#each habits as habit}
      <div class="bg-gray-50 p-4 rounded-lg">
        <div class="flex justify-between items-center mb-2">
          <div class="flex items-center">
            <div class={`w-3 h-3 rounded-full bg-${habit.color} mr-2`}></div>
            <span class="font-medium">{habit.name}</span>
          </div>
          <span class="text-sm text-gray-500">{habit.target}</span>
        </div>
        <div class="w-full bg-gray-200 rounded-full h-2.5">
          <div class={`bg-${habit.color} h-2.5 rounded-full`} style="width: {Math.floor(Math.random() * 100)}%"></div>
        </div>
        <div class="flex justify-between text-xs text-gray-500 mt-1">
          <span>Current streak: {habit.streak} days</span>
          <span>Best streak: {habit.streak + Math.floor(Math.random() * 10)} days</span>
        </div>
      </div>
    {/each}
  </div>
</div>
