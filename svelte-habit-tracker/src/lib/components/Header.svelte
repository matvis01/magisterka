<script lang="ts">
  export let currentView: string;
  export let switchView: (view: string) => void;
</script>

<header class="mb-8">
  <div class="flex justify-between items-center">
    <h1 class="text-3xl font-bold text-gray-800">Habit Tracker</h1>
    <div class="flex space-x-2">
      <button 
        class="px-4 py-2 rounded-lg font-medium transition-colors {currentView === 'habits' ? 'bg-gray-800 text-white' : 'bg-gray-200 hover:bg-gray-300'}"
        on:click={() => switchView('habits')}
      >
        Habits
      </button>
      <button 
        class="px-4 py-2 rounded-lg font-medium transition-colors {currentView === 'history' ? 'bg-gray-800 text-white' : 'bg-gray-200 hover:bg-gray-300'}"
        on:click={() => switchView('history')}
      >
        History
      </button>
    </div>
  </div>
</header>
