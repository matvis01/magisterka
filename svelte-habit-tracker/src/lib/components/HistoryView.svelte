<script lang="ts">
  
  export let habits: {
    id: number;
    name: string;
    bestStreak: number;
    target: string;
    color: string;
    readonly completedDays?: string[];
  }[];
  
  // Generate a simpler calendar data structure
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  
  // Get the number of days in the current month
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  
  // Get the day of week (0-6) for the first day of the month
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  
  // Days of the week labels - rearranged to start with Monday
  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
  // Define type for calendar day
  type CalendarDay = number | null;
  
  // Create calendar array with day numbers and empty spaces
  const calendarDays: CalendarDay[] = [];
  
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(null);
  }
  
  // Add days of the month
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(i);
  }

  // Track the displayed month and year
  let displayMonth = today.getMonth();
  let displayYear = today.getFullYear();
  
  // Month names
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  // Function to check if any habit was completed on a specific day
  function hasCompletedHabits(day: number): boolean {
    if (!day) return false;
    
    // Create date string for the displayed month and the day
    const dateStr = new Date(displayYear, displayMonth, day).toISOString().split('T')[0];
    
    // Check if any habit was completed on this date
    return habits.some(habit => habit.completedDays?.includes(dateStr));
  }
  
  // Function to count completed habits on a specific day
  function countCompletedHabits(day: number): number {
    if (!day) return 0;
    
    // Create date string for the displayed month and the day
    const dateStr = new Date(displayYear, displayMonth, day).toISOString().split('T')[0];
    
    // Count habits completed on this date
    return habits.filter(habit => habit.completedDays?.includes(dateStr)).length;
  }
  
  // Function to get color class based on completion count
  function getCompletionColorClass(day: number): string {
    if (!day) return 'bg-transparent';
    
    const count = countCompletedHabits(day);
    if (count === 0) return 'bg-gray-200 hover:bg-gray-300';
    
    // Calculate intensity based on the percentage of completed habits
    const percentage = count / habits.length;
    
    if (percentage < 0.25) return 'bg-emerald-200 text-emerald-800 hover:bg-emerald-300';
    if (percentage < 0.5) return 'bg-emerald-300 text-emerald-800 hover:bg-emerald-400';
    if (percentage < 0.75) return 'bg-emerald-400 text-white hover:bg-emerald-500';
    return 'bg-emerald-600 text-white hover:bg-emerald-700';
  }
  
  // Function to update calendar when month changes
  function updateCalendar() {
    const daysInMonth = new Date(displayYear, displayMonth + 1, 0).getDate();
    
    let firstDayOfMonth = new Date(displayYear, displayMonth, 1).getDay();
    
    firstDayOfMonth = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
    
    calendarDays.length = 0;
    
    for (let i = 0; i < firstDayOfMonth; i++) {
      calendarDays.push(null);
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      calendarDays.push(i);
    }
  }
  
  function prevMonth() {
    if (displayMonth === 0) {
      displayMonth = 11;
      displayYear--;
    } else {
      displayMonth--;
    }
    updateCalendar();
  }
  
  function nextMonth() {
    if (displayMonth === 11) {
      displayMonth = 0;
      displayYear++;
    } else {
      displayMonth++;
    }
    updateCalendar();
  }

  updateCalendar();
</script>

<div>
  <div class="bg-white rounded-xl shadow-sm p-6 mb-6">
    <h2 class="text-xl font-semibold mb-6">Habit History</h2>
    
    <!-- Sample charts and statistics -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6"></div>
    
    <div class="bg-gray-50 p-4 rounded-lg">
      <!-- Month navigation header -->
      <div class="flex justify-between items-center mb-4">
        <h3 class="font-medium">Streak Calendar</h3>
        <div class="flex items-center space-x-4">
          <button 
            class="p-1 rounded-full hover:bg-gray-200 cursor-pointer" 
            on:click={prevMonth}
            aria-label="Previous month"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
            </svg>
          </button>
          <span class="text-sm font-medium">{monthNames[displayMonth]} {displayYear}</span>
          <button 
            class="p-1 rounded-full hover:bg-gray-200 cursor-pointer" 
            on:click={nextMonth}
            aria-label="Next month"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
      
      <div class="flex flex-col mt-4">
        <!-- Day of week header -->
        <div class="grid grid-cols-7 gap-1 mb-1">
          {#each daysOfWeek as day}
            <div class="text-xs text-gray-500 font-medium text-center">{day}</div>
          {/each}
        </div>

        <!-- Calendar grid -->
        <div class="grid grid-cols-7 gap-1">
          {#each calendarDays as day}
            {@const completedCount = day ? countCompletedHabits(day) : 0}
            <div 
              class={`aspect-square rounded-sm flex items-center justify-center ${getCompletionColorClass(day || 0)}`}
              title={day ? `${completedCount} habit${completedCount !== 1 ? 's' : ''} completed on day ${day}` : ''}
            >
              {#if day}
                <span class="text-lg font-medium">{day}</span>
              {/if}
            </div>
          {/each}
        </div>
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
          <span>Current streak: {habit.bestStreak} days</span>
          <span>Best streak: {habit.bestStreak + Math.floor(Math.random() * 10)} days</span>
        </div>
      </div>
    {/each}
  </div>
</div>
