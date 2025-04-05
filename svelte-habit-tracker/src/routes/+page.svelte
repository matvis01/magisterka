<script lang="ts">
  import { onMount } from 'svelte';
  import Header from '$lib/components/Header.svelte';
  import AddHabitForm from '$lib/components/AddHabitForm.svelte';
  import WeekView from '$lib/components/WeekView.svelte';
  import HabitsList from '$lib/components/HabitsList.svelte';
  import HistoryView from '$lib/components/HistoryView.svelte';
  import type { Habit, WeekDate } from '$lib/types/habit';
  import { calculateStreak } from '$lib/utils/habit';
  
  // Sample data now uses hex colors directly
  let habits: Habit[] = [
    { id: 1, name: 'Morning Exercise', bestStreak: 5, target: 'Daily', color: '#10b981' },
    { id: 2, name: 'Read 30 minutes', bestStreak: 3, target: 'Daily', color: '#8b5cf6' },
    { id: 3, name: 'Drink 2L water', bestStreak: 7, target: 'Daily', color: '#0ea5e9' },
    { id: 4, name: 'Meditate', bestStreak: 2, target: 'Daily', color: '#f59e0b' }
  ];
  
  let newHabitName = '';
  let newHabitTarget = 'Daily';
  let editMode = false;
  let editingHabit: Habit = { id: 0, name: '', bestStreak: 0, target: '', color: '' };
  let currentView = 'habits'; // 'habits' or 'history'
  
  // Generate dates for the current week
  let weekDates: WeekDate[] = [];
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
      // Use hex color values directly
      const colors = ['#10b981', '#8b5cf6', '#0ea5e9', '#f59e0b', '#f43f5e'];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      
      habits = [...habits, {
        id: habits.length + 1,
        name: newHabitName,
        bestStreak: 0,
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
    editingHabit = { id: 0, name: '', bestStreak: 0, target: '', color: '' };
  }
  
  function deleteHabit(id: number) {
    habits = habits.filter(h => h.id !== id);
  }
  
  function switchView(view: string) {
    currentView = view;
  }

  function toggleCompletion(habit: Habit, date: Date) {
		// Create a copy of the habit
		const updatedHabit = { ...habit };
		
		// Initialize completedDays array if it doesn't exist
		if (!updatedHabit.completedDays) {
			updatedHabit.completedDays = [];
		}
		
		// Format date as ISO string for storage
		const dateStr = date.toISOString().split('T')[0];
		
		// Toggle completion status
		const index = updatedHabit.completedDays.indexOf(dateStr);
		if (index >= 0) {
			// Remove date if already completed
			updatedHabit.completedDays = updatedHabit.completedDays.filter(d => d !== dateStr);
		} else {
			// Add date if not completed
			updatedHabit.completedDays = [...updatedHabit.completedDays, dateStr];
		}
		
		 // Calculate current streak after toggling completion
		const currentStreak = calculateStreak(updatedHabit);
		
		// Update best streak if current streak is better
		if (currentStreak > updatedHabit.bestStreak) {
			updatedHabit.bestStreak = currentStreak;
		}
		
		// Find and update the habit in the habits array
		const habitIndex = habits.findIndex(h => h.id === habit.id);
		if (habitIndex >= 0) {
			habits[habitIndex] = updatedHabit;
			habits = [...habits];
		}
	}
</script>

<main class="min-h-screen bg-gray-50 text-gray-800">
  <div class="max-w-4xl mx-auto p-4">
    <Header {currentView} {switchView} />
    
    {#if currentView === 'habits'}
      <AddHabitForm bind:newHabitName bind:newHabitTarget {addHabit} />
      <HabitsList {habits} {editMode} {editingHabit} {startEdit} {saveEdit} {cancelEdit} {deleteHabit}  {toggleCompletion}/>
      <WeekView {weekDates} {habits} {toggleCompletion} />
    {:else}
      <HistoryView {habits} />
    {/if}
  </div>
</main>

<style>
</style>