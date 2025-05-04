<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useTravelStore } from '../stores/travelStore'
import TravelCard from '../components/TravelCard.vue'

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
  event.stopPropagation()
  router.push(`/edit/${id}`)
}

const navigateToCreate = () => {
  router.push('/create')
}

const deleteTravelPlan = (id: string, event: Event) => {
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
        <TravelCard
          v-for="plan in travelStore.getFilteredTravelPlans"
          :key="plan.id"
          :plan="plan"
          @detail="navigateToDetail"
          @edit="navigateToEdit"
          @delete="deleteTravelPlan"
        />
      </div>

      <div v-if="travelStore.getFilteredTravelPlans.length === 0" class="mt-8 text-center">
        <p class="text-gray-500 text-lg">No travel plans found. Create one to get started!</p>
      </div>
    </main>
  </div>
</template>
