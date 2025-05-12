<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTravelStore } from '../stores/travelStore'
import TravelPlanForm from '../components/TravelPlanForm.vue'
import type { TravelPlan } from '../types'

const route = useRoute()
const router = useRouter()
const travelStore = useTravelStore()
const travelId = ref(route.params.id as string)
const existingPlan = ref<Partial<TravelPlan> | null>(null)
const isLoaded = ref(false)

onMounted(() => {
  const plan = travelStore.getTravelPlanById(travelId.value)
  if (!plan) {
    router.push('/')
    return
  }
  
  existingPlan.value = plan
  isLoaded.value = true
})

const handleSubmit = (travelPlan: TravelPlan) => {
  travelStore.updateTravelPlan(travelId.value, travelPlan)
  router.push(`/travel/${travelId.value}`)
}

const handleCancel = () => {
  router.push(`/travel/${travelId.value}`)
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <header class="bg-gradient-to-r from-teal-500 to-emerald-600 shadow-lg">
      <div class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center">
          <h1 class="text-3xl font-bold text-white">Edit Travel Plan</h1>
          <div class="flex space-x-2">
            <button
              @click="handleCancel"
              class="px-4 py-2 bg-white text-emerald-600 rounded-md hover:bg-emerald-50 transition-colors duration-200 font-medium shadow-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </header>

    <main v-if="isLoaded" class="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <TravelPlanForm
        mode="edit"
        :initialTravelPlan="existingPlan"
        @submit="handleSubmit"
        @cancel="handleCancel"
      />
    </main>

    <div v-else class="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 text-center">
      <div class="animate-pulse">
        <div class="h-8 bg-gray-300 rounded w-1/3 mx-auto mb-4"></div>
        <div class="h-64 bg-gray-300 rounded mb-4"></div>
        <div class="h-8 bg-gray-300 rounded w-1/4 mx-auto"></div>
      </div>
    </div>
  </div>
</template>
