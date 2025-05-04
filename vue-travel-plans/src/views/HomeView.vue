<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useTravelStore } from '../stores/travelStore'

const router = useRouter()
const travelStore = useTravelStore()
const searchQuery = ref('')

const handleSearch = () => {
  travelStore.setSearchQuery(searchQuery.value)
}

const clearSearch = () => {
  searchQuery.value = ''
  travelStore.setSearchQuery('')
}

const navigateToDetail = (id: string) => {
  router.push(`/travel/${id}`)
}

const navigateToEdit = (id: string, event: Event) => {
  // Prevent the event from propagating to parent elements
  event.stopPropagation()
  // Navigate to the edit page
  router.push(`/edit/${id}`)
}

const navigateToCreate = () => {
  router.push('/create')
}

const deleteTravelPlan = (id: string, event: Event) => {
  // Prevent the event from propagating to parent elements
  event.stopPropagation()
  if (confirm('Are you sure you want to delete this travel plan?')) {
    travelStore.deleteTravelPlan(id)
  }
}
</script>

<template>
  <div class="min-h-screen w-full bg-gray-100">
    <header class="bg-blue-600 shadow-lg">
      <div class="container mx-auto py-6 px-4">
        <h1 class="text-3xl font-bold text-white">Travel Planner</h1>
        <p class="text-blue-100">Plan your adventures with ease</p>
      </div>
    </header>

    <main class="w-full mx-auto py-8 px-4">
      <!-- Search and Create New Travel Plan -->
      <div class="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div class="w-full md:w-1/2">
          <div class="flex items-center">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search travel plans..."
              class="w-full px-4 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              @keyup.enter="handleSearch"
            />
            <button
              @click="handleSearch"
              class="px-4 py-2 bg-blue-500 text-white rounded-r-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Search
            </button>
            <button
              v-if="searchQuery"
              @click="clearSearch"
              class="ml-2 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none"
            >
              Clear
            </button>
          </div>
        </div>

        <button
          @click="navigateToCreate"
          class="w-full md:w-auto px-6 py-3 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none flex items-center justify-center"
        >
          <span class="mr-2">Create New Travel Plan</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 4v16m8-8H4"
            />
          </svg>
        </button>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="plan in travelStore.getFilteredTravelPlans"
          :key="plan.id"
          class="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 cursor-pointer"
           @click="navigateToDetail(plan.id)" 
        >
          <div class="relative h-48 overflow-hidden ">
            <img
              :src="plan.imageUrl || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828'"
              :alt="plan.title"
              class="w-full h-full object-cover"
            />
            <div class="absolute top-0 right-0 mt-2 mr-2 flex space-x-2">
              <button
                @click.stop="navigateToEdit(plan.id, $event)"
                class="bg-blue-500 p-2 rounded-full text-white hover:bg-blue-600 focus:outline-none"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                  />
                </svg>
              </button>
              <button
                @click.stop="deleteTravelPlan(plan.id, $event)"
                class="bg-red-500 p-2 rounded-full text-white hover:bg-red-600 focus:outline-none"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>
          </div>
          <div class="p-4">
            <div>
              <h2 class="text-xl font-bold text-gray-800 mb-2">{{ plan.title }}</h2>
              <p class="text-gray-600 mb-2">{{ plan.description }}</p>
              <div class="flex items-center text-sm text-gray-500 mb-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-4 w-4 mr-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <span>{{ plan.destination }}</span>
              </div>
              <div class="flex justify-between text-sm text-gray-500">
                <div class="flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-4 w-4 mr-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <span
                    >{{ new Date(plan.startDate).toLocaleDateString() }} -
                    {{ new Date(plan.endDate).toLocaleDateString() }}</span
                  >
                </div>
                <div class="flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-4 w-4 mr-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                  <span>{{ plan.stages.length }} stages</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="travelStore.getFilteredTravelPlans.length === 0" class="mt-8 text-center">
        <p class="text-gray-500 text-lg">No travel plans found. Create one to get started!</p>
      </div>
    </main>
  </div>
</template>
