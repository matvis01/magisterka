<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useTravelStore } from '../stores/travelStore'
import type { TravelStage } from '../types'

const router = useRouter()
const travelStore = useTravelStore()

const travelPlan = reactive({
  title: '',
  description: '',
  startDate: '',
  endDate: '',
  destination: '',
  budget: undefined as number | undefined,
  imageUrl: '',
  stages: [] as TravelStage[],
})

const newStage = reactive({
  title: '',
  description: '',
  startDate: '',
  endDate: '',
  location: '',
  imageUrl: '',
  activities: [''], // Start with one empty activity
})

const stageErrors = ref({
  title: '',
  dates: '',
  location: '',
})

const travelErrors = ref({
  title: '',
  dates: '',
  destination: '',
})

const isEditingStage = ref(false)
const activeStageIndex = ref(-1)

const addActivity = () => {
  newStage.activities.push('')
}

const removeActivity = (index: number) => {
  newStage.activities.splice(index, 1)
}

const validateStage = () => {
  let isValid = true
  stageErrors.value = {
    title: '',
    dates: '',
    location: '',
  }

  if (!newStage.title.trim()) {
    stageErrors.value.title = 'Stage title is required'
    isValid = false
  }

  if (!newStage.startDate || !newStage.endDate) {
    stageErrors.value.dates = 'Start and end dates are required'
    isValid = false
  } else if (new Date(newStage.startDate) > new Date(newStage.endDate)) {
    stageErrors.value.dates = 'End date must be after start date'
    isValid = false
  }

  if (!newStage.location.trim()) {
    stageErrors.value.location = 'Location is required'
    isValid = false
  }

  return isValid
}

const addStage = () => {
  if (!validateStage()) return

  // Filter out empty activities
  const activities = newStage.activities.filter((a) => a.trim() !== '')

  const stage = {
    ...newStage,
    activities,
    id: '', // This will be set by the store
  }

  if (isEditingStage.value && activeStageIndex.value !== -1) {
    // Update existing stage
    travelPlan.stages[activeStageIndex.value] = { ...stage }
    isEditingStage.value = false
    activeStageIndex.value = -1
  } else {
    // Add new stage
    travelPlan.stages.push({ ...stage })
  }

  // Reset form for new stage
  Object.assign(newStage, {
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    location: '',
    imageUrl: '',
    activities: [''],
  })
}

const editStage = (index: number) => {
  const stage = travelPlan.stages[index]

  // Copy stage data to the form
  Object.assign(newStage, {
    title: stage.title,
    description: stage.description,
    startDate: stage.startDate,
    endDate: stage.endDate,
    location: stage.location,
    imageUrl: stage.imageUrl || '',
    activities: [...stage.activities, ''], // Add an empty activity for potential new ones
  })

  isEditingStage.value = true
  activeStageIndex.value = index
}

const removeStage = (index: number) => {
  travelPlan.stages.splice(index, 1)
}

const validateTravelPlan = () => {
  let isValid = true
  travelErrors.value = {
    title: '',
    dates: '',
    destination: '',
  }

  if (!travelPlan.title.trim()) {
    travelErrors.value.title = 'Travel plan title is required'
    isValid = false
  }

  if (!travelPlan.startDate || !travelPlan.endDate) {
    travelErrors.value.dates = 'Start and end dates are required'
    isValid = false
  } else if (new Date(travelPlan.startDate) > new Date(travelPlan.endDate)) {
    travelErrors.value.dates = 'End date must be after start date'
    isValid = false
  }

  if (!travelPlan.destination.trim()) {
    travelErrors.value.destination = 'Destination is required'
    isValid = false
  }

  return isValid
}

const saveTravelPlan = () => {
  if (!validateTravelPlan()) return

  // Create the travel plan
  const newPlan = travelStore.addTravelPlan({
    title: travelPlan.title,
    description: travelPlan.description,
    startDate: travelPlan.startDate,
    endDate: travelPlan.endDate,
    destination: travelPlan.destination,
    budget: travelPlan.budget,
    imageUrl: travelPlan.imageUrl,
    stages: travelPlan.stages,
  })

  router.push(`/travel/${newPlan.id}`)
}
</script>

<template>
  <div class="min-h-screen bg-gray-100">
    <header class="bg-blue-600 shadow-lg">
      <div class="container mx-auto py-6 px-4">
        <div class="flex justify-between items-center">
          <h1 class="text-3xl font-bold text-white">Create Travel Plan</h1>
          <button
            @click="router.push('/')"
            class="px-4 py-2 bg-white text-blue-600 rounded-md hover:bg-blue-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </header>

    <main class="container mx-auto py-8 px-4">
      <div class="bg-white shadow-md rounded-lg overflow-hidden mb-8">
        <div class="p-6 border-b">
          <h2 class="text-2xl font-bold text-gray-800 mb-4">Travel Plan Details</h2>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div class="col-span-2">
              <label class="block text-gray-700 font-medium mb-2">Title</label>
              <input
                v-model="travelPlan.title"
                type="text"
                placeholder="Enter travel plan title"
                class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                :class="{ 'border-red-500': travelErrors.title }"
              />
              <p v-if="travelErrors.title" class="text-red-500 text-sm mt-1">
                {{ travelErrors.title }}
              </p>
            </div>

            <div class="col-span-2">
              <label class="block text-gray-700 font-medium mb-2">Destination</label>
              <input
                v-model="travelPlan.destination"
                type="text"
                placeholder="Where are you going?"
                class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                :class="{ 'border-red-500': travelErrors.destination }"
              />
              <p v-if="travelErrors.destination" class="text-red-500 text-sm mt-1">
                {{ travelErrors.destination }}
              </p>
            </div>

            <div>
              <label class="block text-gray-700 font-medium mb-2">Start Date</label>
              <input
                v-model="travelPlan.startDate"
                type="date"
                class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                :class="{ 'border-red-500': travelErrors.dates }"
              />
            </div>

            <div>
              <label class="block text-gray-700 font-medium mb-2">End Date</label>
              <input
                v-model="travelPlan.endDate"
                type="date"
                class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                :class="{ 'border-red-500': travelErrors.dates }"
              />
              <p v-if="travelErrors.dates" class="text-red-500 text-sm mt-1">
                {{ travelErrors.dates }}
              </p>
            </div>

            <div>
              <label class="block text-gray-700 font-medium mb-2">Budget (optional)</label>
              <input
                v-model.number="travelPlan.budget"
                type="number"
                placeholder="Your budget in $"
                class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label class="block text-gray-700 font-medium mb-2">Image URL (optional)</label>
              <input
                v-model="travelPlan.imageUrl"
                type="url"
                placeholder="Image URL for your travel plan"
                class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div class="col-span-2">
              <label class="block text-gray-700 font-medium mb-2">Description</label>
              <textarea
                v-model="travelPlan.description"
                rows="4"
                placeholder="Describe your travel plan"
                class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              ></textarea>
            </div>
          </div>
        </div>
      </div>

      <!-- Stages Section -->
      <div class="bg-white shadow-md rounded-lg overflow-hidden mb-8">
        <div class="p-6 border-b">
          <h2 class="text-2xl font-bold text-gray-800 mb-4">
            {{ isEditingStage ? 'Edit Stage' : 'Add Travel Stage' }}
          </h2>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div class="col-span-2">
              <label class="block text-gray-700 font-medium mb-2">Stage Title</label>
              <input
                v-model="newStage.title"
                type="text"
                placeholder="Enter stage title"
                class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                :class="{ 'border-red-500': stageErrors.title }"
              />
              <p v-if="stageErrors.title" class="text-red-500 text-sm mt-1">
                {{ stageErrors.title }}
              </p>
            </div>

            <div class="col-span-2">
              <label class="block text-gray-700 font-medium mb-2">Location</label>
              <input
                v-model="newStage.location"
                type="text"
                placeholder="Stage location (city, country)"
                class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                :class="{ 'border-red-500': stageErrors.location }"
              />
              <p v-if="stageErrors.location" class="text-red-500 text-sm mt-1">
                {{ stageErrors.location }}
              </p>
            </div>

            <div>
              <label class="block text-gray-700 font-medium mb-2">Start Date</label>
              <input
                v-model="newStage.startDate"
                type="date"
                class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                :class="{ 'border-red-500': stageErrors.dates }"
              />
            </div>

            <div>
              <label class="block text-gray-700 font-medium mb-2">End Date</label>
              <input
                v-model="newStage.endDate"
                type="date"
                class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                :class="{ 'border-red-500': stageErrors.dates }"
              />
              <p v-if="stageErrors.dates" class="text-red-500 text-sm mt-1">
                {{ stageErrors.dates }}
              </p>
            </div>

            <div class="col-span-2">
              <label class="block text-gray-700 font-medium mb-2">Image URL (optional)</label>
              <input
                v-model="newStage.imageUrl"
                type="url"
                placeholder="Image URL for this stage"
                class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div class="col-span-2">
              <label class="block text-gray-700 font-medium mb-2">Description</label>
              <textarea
                v-model="newStage.description"
                rows="3"
                placeholder="Describe this stage of your trip"
                class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              ></textarea>
            </div>

            <div class="col-span-2">
              <label class="block text-gray-700 font-medium mb-2">Activities</label>
              <div
                v-for="(activity, index) in newStage.activities"
                :key="index"
                class="flex items-center mb-2"
              >
                <input
                  v-model="newStage.activities[index]"
                  type="text"
                  placeholder="Add an activity"
                  class="flex-grow px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  v-if="index === newStage.activities.length - 1"
                  @click="addActivity"
                  class="ml-2 p-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none"
                  title="Add another activity"
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
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                </button>
                <button
                  v-if="newStage.activities.length > 1"
                  @click="removeActivity(index)"
                  class="ml-2 p-2 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none"
                  title="Remove this activity"
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
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <div class="flex justify-end">
            <button
              v-if="isEditingStage"
              @click="() => {
                isEditingStage = false;
                activeStageIndex = -1;
              }"
              class="px-4 py-2 bg-gray-300 text-gray-700 rounded-md mr-2 hover:bg-gray-400"
            >
              Cancel
            </button>
            <button
              @click="addStage"
              class="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none"
            >
              {{ isEditingStage ? 'Update Stage' : 'Add Stage' }}
            </button>
          </div>
        </div>

        <!-- List of added stages -->
        <div class="p-6" v-if="travelPlan.stages.length > 0">
          <h3 class="text-lg font-semibold text-gray-800 mb-4">
            Added Stages ({{ travelPlan.stages.length }})
          </h3>

          <div
            v-for="(stage, index) in travelPlan.stages"
            :key="index"
            class="border-b last:border-0 pb-4 mb-4"
          >
            <div class="flex justify-between items-start">
              <div>
                <h4 class="font-medium text-gray-800">{{ stage.title }}</h4>
                <p class="text-sm text-gray-500">
                  {{ stage.location }} | {{ new Date(stage.startDate).toLocaleDateString() }} -
                  {{ new Date(stage.endDate).toLocaleDateString() }}
                </p>
              </div>
              <div class="flex space-x-2">
                <button
                  @click="editStage(index)"
                  class="p-2 bg-blue-100 text-blue-600 rounded-md hover:bg-blue-200 focus:outline-none"
                  title="Edit stage"
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
                  @click="removeStage(index)"
                  class="p-2 bg-red-100 text-red-600 rounded-md hover:bg-red-200 focus:outline-none"
                  title="Delete stage"
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
          </div>
        </div>
      </div>

      <!-- Save Travel Plan Button -->
      <div class="flex justify-end">
        <button
          @click="saveTravelPlan"
          class="px-8 py-3 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none flex items-center shadow-md"
        >
          <span class="mr-2">Save Travel Plan</span>
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
              d="M5 13l4 4L19 7"
            />
          </svg>
        </button>
      </div>
    </main>
  </div>
</template>
