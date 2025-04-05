<script lang="ts">
  import { onMount } from 'svelte';
  
  type Habit = {
    id: number;
    name: string;
    streak: number;
    target: string;
    color: string;
  };

  // Sample data for demonstration
  let habits: Habit[] = [
    { id: 1, name: 'Morning Exercise', streak: 5, target: 'Daily', color: 'bg-emerald-500' },
    { id: 2, name: 'Read 30 minutes', streak: 3, target: 'Daily', color: 'bg-violet-500' },
    { id: 3, name: 'Drink 2L water', streak: 7, target: 'Daily', color: 'bg-sky-500' },
    { id: 4, name: 'Meditate', streak: 2, target: 'Daily', color: 'bg-amber-500' }
  ];
  
  let newHabitName = '';
  let newHabitTarget = 'Daily';
  let editMode = false;
  let editingHabit: Habit  = { id: 0, name: '', streak: 0, target: '', color: '' };
  let currentView = 'habits'; // 'habits' or 'history'
  
  // Generate dates for the current week
  let weekDates: { date: Date; dayName: string; dayNumber: number; isToday: boolean; }[] = [];
  let today = new Date();
  
  onMount(() => {
    generateWeekDates();
  });
  
  function generateWeekDates() {
    weekDates = [];
    const day = today.getDay(); // 0 = Sunday, 6 = Saturday
    
    // Get Monday of current week
    const monday = new Date(today);
    monday.setDate(today.getDate() - day + (day === 0 ? -6 : 1));
    
    // Generate 7 days starting from Monday
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      weekDates.push({
        date,
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNumber: date.getDate(),
        isToday: date.toDateString() === today.toDateString()
      });
    }
  }
  
  function addHabit() {
    if (newHabitName.trim()) {
      const colors = ['bg-emerald-500', 'bg-violet-500', 'bg-sky-500', 'bg-amber-500', 'bg-rose-500'];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      
      habits = [...habits, {
        id: habits.length + 1,
        name: newHabitName,
        streak: 0,
        target: newHabitTarget,
        color: randomColor
      }];
      
      newHabitName = '';
    }
  }
  
  function startEdit(habit: Habit) {
    editMode = true;
    editingHabit = { ...habit };
  }
  
  function saveEdit() {
    if (editingHabit && editingHabit.name.trim()) {
      habits = habits.map(h => editingHabit && h.id === editingHabit.id ? editingHabit : h);
      cancelEdit();
    }
  }
  
  function cancelEdit() {
    editMode = false;
    editingHabit = { id: 0, name: '', streak: 0, target: '', color: '' };
  }
  
  function deleteHabit(id: number) {
    habits = habits.filter(h => h.id !== id);
  }
  
  function switchView(view: string) {
    currentView = view;
  }
</script>

<main class="min-h-screen bg-gray-50 text-gray-800">
  <div class="max-w-4xl mx-auto p-4">
    <!-- Header -->
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
    
    {#if currentView === 'habits'}
      <!-- Add New Habit Form -->
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
      
      <!-- Week View -->
      <div class="bg-white rounded-xl shadow-sm p-6 mb-6">
      
        
        <!-- Calendar Header -->
        <div class="grid grid-cols-8 gap-2 mb-2">
          <div class="col-span-1"></div>
          {#each weekDates as day}
            <div class="text-center">
              <div class="text-xs text-gray-500">{day.dayName}</div>
              <div class={`text-sm font-medium rounded-full w-8 h-8 flex items-center justify-center mx-auto ${day.isToday ? 'bg-gray-800 text-white' : ''}`}>
                {day.dayNumber}
              </div>
            </div>
          {/each}
        </div>
        
        <!-- Habits Grid -->
        {#each habits as habit}
          <div class="grid grid-cols-8 gap-2 py-3 border-t border-gray-100">
            <div class="col-span-1 flex items-center">
              <div class={`w-3 h-3 rounded-full ${habit.color} mr-2`}></div>
              <span class="truncate">{habit.name}</span>
            </div>
            {#each Array(7) as _, i}
              <div class="flex justify-center items-center">
                <button class="w-8 h-8 rounded-full border-2 border-gray-200 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"></button>
              </div>
            {/each}
          </div>
        {/each}
      </div>
      
      <!-- Habits List -->
      <div class="bg-white rounded-xl shadow-sm p-6">
        <h2 class="text-xl font-semibold mb-4">Your Habits</h2>
        
        {#if editMode}
          <!-- Edit Form -->
          <div class="bg-gray-50 p-4 rounded-lg mb-4">
            <h3 class="font-medium mb-2">Edit Habit</h3>
            <div class="flex flex-col sm:flex-row gap-3 mb-3">
              <input 
                type="text" 
                bind:value={editingHabit.name} 
                class="flex-grow px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-800"
              />
              <select 
                bind:value={editingHabit.target}
                class="sm:w-32 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-800"
              >
                <option value="Daily">Daily</option>
                <option value="Weekly">Weekly</option>
              </select>
            </div>
            <div class="flex justify-end gap-2">
              <button 
                on:click={cancelEdit}
                class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100"
              >
                Cancel
              </button>
              <button 
                on:click={saveEdit}
                class="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700"
              >
                Save
              </button>
            </div>
          </div>
        {/if}
        
        <div class="space-y-3">
          {#each habits as habit}
            <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div class="flex items-center">
                <div class={`w-3 h-3 rounded-full ${habit.color} mr-3`}></div>
                <div>
                  <h3 class="font-medium">{habit.name}</h3>
                  <p class="text-sm text-gray-500">{habit.target} · {habit.streak} day streak</p>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <button 
                  on:click={() => startEdit(habit)}
                  class="p-2 text-gray-500 hover:text-blue-600 rounded-full hover:bg-gray-200"
                  aria-label="Edit Habit"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                </button>
                <button 
                  on:click={() => deleteHabit(habit.id)}
                  class="p-2 text-gray-500 hover:text-red-600 rounded-full hover:bg-gray-200"
                  aria-label="Delete Habit"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          {/each}
        </div>
      </div>
    {:else}
      <!-- History View -->
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
                  <div class={`w-3 h-3 rounded-full ${habit.color} mr-2`}></div>
                  <span class="font-medium">{habit.name}</span>
                </div>
                <span class="text-sm text-gray-500">{habit.target}</span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-2.5">
                <div class={`${habit.color} h-2.5 rounded-full`} style="width: {Math.floor(Math.random() * 100)}%"></div>
              </div>
              <div class="flex justify-between text-xs text-gray-500 mt-1">
                <span>Current streak: {habit.streak} days</span>
                <span>Best streak: {habit.streak + Math.floor(Math.random() * 10)} days</span>
              </div>
            </div>
          {/each}
        </div>
     
    {/if}
  </div>
</main>

<style>
</style>