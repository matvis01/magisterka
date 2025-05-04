<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useTravelStore } from '../stores/travelStore'
import TravelPlanForm from '../components/TravelPlanForm.vue'
import type { TravelPlan } from '../types'

const router = useRouter()
const travelStore = useTravelStore()

const handleSubmit = (travelPlan: TravelPlan) => {
  // Create the travel plan
  const newPlan = travelStore.addTravelPlan(travelPlan)
  router.push(`/travel/${newPlan.id}`)
}

const handleCancel = () => {
  router.push('/')
}
</script>

<template>
  <div class="min-h-screen bg-gray-100">
    <header class="bg-blue-600 shadow-lg">
      <div class="container mx-auto py-6 px-4">
        <div class="flex justify-between items-center">
          <h1 class="text-3xl font-bold text-white">Create Travel Plan</h1>
          <button
            @click="handleCancel"
            class="px-4 py-2 bg-white text-blue-600 rounded-md hover:bg-blue-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </header>

    <main class="container mx-auto py-8 px-4">
      <TravelPlanForm
        mode="create"
        @submit="handleSubmit"
        @cancel="handleCancel"
      />
    </main>
  </div>
</template>
