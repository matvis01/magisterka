<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTravelStore } from '../stores/travelStore'

const route = useRoute()
const router = useRouter()
const travelStore = useTravelStore()
const travelId = ref(route.params.id as string)
const activeStageIndex = ref(0)

const travelPlan = computed(() => {
  return travelStore.getTravelPlanById(travelId.value)
})

const currentStage = computed(() => {
  if (!travelPlan.value || !travelPlan.value.stages.length) {
    return null
  }
  return travelPlan.value.stages[activeStageIndex.value]
})

const totalDays = computed(() => {
  if (!travelPlan.value) return 0

  const start = new Date(travelPlan.value.startDate)
  const end = new Date(travelPlan.value.endDate)
  return Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1
})

onMounted(() => {
  if (!travelPlan.value) {
    router.push('/')
  }
})

const navigateToEdit = () => {
  router.push(`/edit/${travelId.value}`)
}

const deleteTravelPlan = () => {
  if (confirm('Are you sure you want to delete this travel plan?')) {
    travelStore.deleteTravelPlan(travelId.value)
    router.push('/')
  }
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}
</script>

<template>
  <div v-if="travelPlan" class="min-h-screen w-full bg-gray-100">
    <!-- Hero Banner -->
    <div class="relative h-64 md:h-80 bg-gray-900">
      <img
        :src="travelPlan.imageUrl || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828'"
        :alt="travelPlan.title"
        class="w-full h-full object-cover opacity-70"
      />
      <div class="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-70"></div>
      <div class="absolute bottom-0 left-0 p-6 text-white">
        <h1 class="text-3xl md:text-4xl font-bold">{{ travelPlan.title }}</h1>
        <div class="flex items-center mt-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5 mr-2"
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
          <span>{{ travelPlan.destination }}</span>
        </div>
      </div>
      <div class="absolute top-4 right-4 flex space-x-2">
        <button
          @click="router.push('/')"
          class="bg-gray-800 bg-opacity-70 p-2 rounded-full text-white hover:bg-opacity-100 transition"
          title="Back to Home"
        >
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
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
        </button>
        <button
          @click="navigateToEdit"
          class="bg-blue-600 bg-opacity-70 p-2 rounded-full text-white hover:bg-opacity-100 transition"
          title="Edit Plan"
        >
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
              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
            />
          </svg>
        </button>
        <button
          @click="deleteTravelPlan"
          class="bg-red-600 bg-opacity-70 p-2 rounded-full text-white hover:bg-opacity-100 transition"
          title="Delete Plan"
        >
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
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      </div>
    </div>

    <div class="w-full mx-auto py-8 px-4">
      <div class="bg-white shadow-md rounded-lg overflow-hidden">
        <!-- Travel Plan Overview -->
        <div class="p-6 border-b">
          <h2 class="text-2xl font-bold text-gray-800 mb-4">Travel Plan Overview</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <div class="bg-blue-50 p-4 rounded-lg">
              <div class="text-sm text-blue-500 font-semibold">Duration</div>
              <div class="text-lg font-bold mt-1  text-gray-700">{{ totalDays }} days</div>
              <div class="text-sm text-gray-500 mt-1 ">
                {{ formatDate(travelPlan.startDate) }} - {{ formatDate(travelPlan.endDate) }}
              </div>
            </div>
            <div class="bg-green-50 p-4 rounded-lg">
              <div class="text-sm text-green-500 font-semibold">Destination</div>
              <div class="text-lg font-bold mt-1  text-gray-700">{{ travelPlan.destination }}</div>
            </div>
            <div class="bg-purple-50 p-4 rounded-lg" v-if="travelPlan.budget">
              <div class="text-sm text-purple-500 font-semibold">Budget</div>
              <div class="text-lg font-bold mt-1 text-gray-700">${{ travelPlan.budget.toLocaleString() }}</div>
            </div>
          </div>
          <p class="text-gray-600">{{ travelPlan.description }}</p>
        </div>

        <!-- Stages -->
        <div class="p-6">
          <h2 class="text-2xl font-bold text-gray-800 mb-4">Travel Stages</h2>

          <!-- Stages Timeline -->
          <div class="mb-6 overflow-x-auto">
            <div class="flex space-x-2 min-w-max">
              <button
                v-for="(stage, index) in travelPlan.stages"
                :key="stage.id"
                @click="activeStageIndex = index"
                class="px-4 py-2 whitespace-nowrap rounded-full transition-colors"
                :class="
                  activeStageIndex === index
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                "
              >
                {{ index + 1 }}. {{ stage.title }}
              </button>
            </div>
          </div>

          <!-- Active Stage Details -->
          <div v-if="currentStage" class="bg-gray-50 rounded-lg p-6">
            <div class="flex flex-col md:flex-row">
              <div class="md:w-2/3 pr-0 md:pr-6">
                <h3 class="text-xl font-bold text-gray-800 mb-2">{{ currentStage.title }}</h3>
                <div class="flex items-center text-gray-500 text-sm mb-4">
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
                    >{{ formatDate(currentStage.startDate) }} -
                    {{ formatDate(currentStage.endDate) }}</span
                  >
                </div>
                <div class="flex items-center text-gray-500 text-sm mb-4">
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
                  <span>{{ currentStage.location }}</span>
                </div>
                <p class="text-gray-600 mb-4">{{ currentStage.description }}</p>

                <div class="mb-4" v-if="currentStage.activities.length > 0">
                  <h4 class="font-semibold text-gray-700 mb-2">Activities:</h4>
                  <ul class="list-disc pl-5 space-y-1">
                    <li
                      v-for="(activity, index) in currentStage.activities"
                      :key="index"
                      class="text-gray-600"
                    >
                      {{ activity }}
                    </li>
                  </ul>
                </div>
              </div>
              <div class="md:w-1/3 mt-4 md:mt-0">
                <img
                  :src="
                    currentStage.imageUrl ||
                    'https://images.unsplash.com/photo-1501785888041-af3ef285b470'
                  "
                  :alt="currentStage.title"
                  class="w-full h-64 object-cover rounded-lg shadow-md"
                />
              </div>
            </div>
          </div>

          <div v-if="travelPlan.stages.length === 0" class="text-center py-8 text-gray-500">
            <p>No stages have been added to this travel plan yet.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div v-else class="min-h-screen flex items-center justify-center bg-gray-100">
    <div class="text-center">
      <p class="text-gray-500 mb-4">Travel plan not found</p>
      <button
        @click="router.push('/')"
        class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
      >
        Back to Home
      </button>
    </div>
  </div>
</template>
