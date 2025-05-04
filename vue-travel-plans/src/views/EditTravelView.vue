<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTravelStore } from '../stores/travelStore'
import type { TravelPlan, TravelStage } from '../types'
import { v4 as uuidv4 } from 'uuid'

const route = useRoute()
const router = useRouter()
const travelStore = useTravelStore()
const travelId = ref(route.params.id as string)

const travelPlan = reactive<TravelPlan & { imageFile?: File | null }>({
  id: '',
  title: '',
  description: '',
  startDate: '',
  endDate: '',
  destination: '',
  budget: undefined,
  imageUrl: '',
  imageFile: null,
  stages: [],
})

const newStage = reactive({
  id: '',
  title: '',
  description: '',
  startDate: '',
  endDate: '',
  location: '',
  imageUrl: '',
  imageFile: null as File | null,
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
const isLoaded = ref(false)

// File upload handlers
const handleTravelImageUpload = (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files.length > 0) {
    travelPlan.imageFile = input.files[0];
    travelPlan.imageUrl = URL.createObjectURL(input.files[0]);
  }
}

const handleStageImageUpload = (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files.length > 0) {
    newStage.imageFile = input.files[0];
    newStage.imageUrl = URL.createObjectURL(input.files[0]);
  }
}

onMounted(() => {
  const existingPlan = travelStore.getTravelPlanById(travelId.value)
  if (!existingPlan) {
    router.push('/')
    return
  }

  // Copy data to our reactive object
  Object.assign(travelPlan, {
    id: existingPlan.id,
    title: existingPlan.title,
    description: existingPlan.description,
    startDate: existingPlan.startDate,
    endDate: existingPlan.endDate,
    destination: existingPlan.destination,
    budget: existingPlan.budget,
    imageUrl: existingPlan.imageUrl || '',
    imageFile: null,
    stages: existingPlan.stages.map((stage) => ({ ...stage })),
  })

  isLoaded.value = true
})

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
    id: '',
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    location: '',
    imageUrl: '',
    imageFile: null,
    activities: [''],
  })
}

const editStage = (index: number) => {
  const stage = travelPlan.stages[index]

  // Copy stage data to the form
  Object.assign(newStage, {
    id: stage.id,
    title: stage.title,
    description: stage.description,
    startDate: stage.startDate,
    endDate: stage.endDate,
    location: stage.location,
    imageUrl: stage.imageUrl || '',
    imageFile: null,
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

  // Ensure stages have IDs
  const stagesWithIds = travelPlan.stages.map((stage) => {
    if (!stage.id) {
      return {
        ...stage,
        id: uuidv4(), // Using the uuid package which we already have installed
      }
    }
    return stage
  })

  // Create a clean copy of the travel plan to update
  const planToUpdate = {
    id: travelPlan.id,
    title: travelPlan.title,
    description: travelPlan.description,
    startDate: travelPlan.startDate,
    endDate: travelPlan.endDate,
    destination: travelPlan.destination,
    budget: travelPlan.budget,
    imageUrl: travelPlan.imageUrl,
    stages: stagesWithIds,
  }

  // Update the travel plan
  travelStore.updateTravelPlan(travelId.value, planToUpdate)
  router.push(`/travel/${travelId.value}`)
}

const cancelStageEdit = () => {
  isEditingStage.value = false
  activeStageIndex.value = -1
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
              @click="router.push(`/travel/${travelId}`)"
              class="px-4 py-2 bg-white text-emerald-600 rounded-md hover:bg-emerald-50 transition-colors duration-200 font-medium shadow-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </header>

    <main v-if="isLoaded" class="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div class="bg-white shadow-md rounded-lg overflow-hidden mb-8 border border-gray-100">
        <div class="p-6 border-b border-gray-100">
          <h2 class="text-2xl font-bold text-gray-800 mb-6 flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-6 w-6 mr-2 text-emerald-500"
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
            Travel Plan Details
          </h2>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div class="col-span-2">
              <label class="block text-gray-700 font-medium mb-2">Title</label>
              <input
                v-model="travelPlan.title"
                type="text"
                placeholder="Enter travel plan title"
                class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                :class="{
                  'border-red-500 focus:ring-red-500 focus:border-red-500': travelErrors.title,
                }"
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
                class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                :class="{
                  'border-red-500 focus:ring-red-500 focus:border-red-500':
                    travelErrors.destination,
                }"
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
                class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                :class="{
                  'border-red-500 focus:ring-red-500 focus:border-red-500': travelErrors.dates,
                }"
              />
            </div>

            <div>
              <label class="block text-gray-700 font-medium mb-2">End Date</label>
              <input
                v-model="travelPlan.endDate"
                type="date"
                class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                :class="{
                  'border-red-500 focus:ring-red-500 focus:border-red-500': travelErrors.dates,
                }"
              />
              <p v-if="travelErrors.dates" class="text-red-500 text-sm mt-1">
                {{ travelErrors.dates }}
              </p>
            </div>

            <div>
              <label class="block text-gray-700 font-medium mb-2">Cover Image (optional)</label>
              <div class="flex items-center">
                <label class="w-full flex flex-col items-center px-4 py-6 bg-white text-emerald-500 rounded-lg border-2 border-dashed border-emerald-500 tracking-wide cursor-pointer hover:bg-emerald-50 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span class="mt-2 text-sm">
                    {{ travelPlan.imageFile ? travelPlan.imageFile.name : travelPlan.imageUrl ? 'Current image (click to change)' : 'Select or drag an image' }}
                  </span>
                  <input 
                    type="file" 
                    class="hidden" 
                    accept="image/*"
                    @change="handleTravelImageUpload"
                  />
                </label>
              </div>
              <div v-if="travelPlan.imageUrl" class="mt-2">
                <img :src="travelPlan.imageUrl" alt="Selected image preview" class="h-24 object-cover rounded">
              </div>
            </div>

            <div class="col-span-2">
              <label class="block text-gray-700 font-medium mb-2">Description</label>
              <textarea
                v-model="travelPlan.description"
                rows="4"
                placeholder="Describe your travel plan"
                class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
              ></textarea>
            </div>
          </div>
        </div>
      </div>

      <!-- Stages Section -->
      <div class="bg-white shadow-md rounded-lg overflow-hidden mb-8 border border-gray-100">
        <div class="p-6 border-b border-gray-100">
          <h2 class="text-2xl font-bold text-gray-800 mb-6 flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-6 w-6 mr-2 text-emerald-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 5l7 7-7 7"
              />
            </svg>
            {{ isEditingStage ? 'Edit Stage' : 'Add Travel Stage' }}
          </h2>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div class="col-span-2">
              <label class="block text-gray-700 font-medium mb-2">Stage Title</label>
              <input
                v-model="newStage.title"
                type="text"
                placeholder="Enter stage title"
                class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                :class="{
                  'border-red-500 focus:ring-red-500 focus:border-red-500': stageErrors.title,
                }"
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
                class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                :class="{
                  'border-red-500 focus:ring-red-500 focus:border-red-500': stageErrors.location,
                }"
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
                class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                :class="{
                  'border-red-500 focus:ring-red-500 focus:border-red-500': stageErrors.dates,
                }"
              />
            </div>

            <div>
              <label class="block text-gray-700 font-medium mb-2">End Date</label>
              <input
                v-model="newStage.endDate"
                type="date"
                class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                :class="{
                  'border-red-500 focus:ring-red-500 focus:border-red-500': stageErrors.dates,
                }"
              />
              <p v-if="stageErrors.dates" class="text-red-500 text-sm mt-1">
                {{ stageErrors.dates }}
              </p>
            </div>

            <div class="col-span-2">
              <label class="block text-gray-700 font-medium mb-2">Stage Image (optional)</label>
              <div class="flex items-center">
                <label class="w-full flex flex-col items-center px-4 py-6 bg-white text-emerald-500 rounded-lg border-2 border-dashed border-emerald-500 tracking-wide cursor-pointer hover:bg-emerald-50 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span class="mt-2 text-sm">
                    {{ newStage.imageFile ? newStage.imageFile.name : newStage.imageUrl ? 'Current image (click to change)' : 'Select or drag an image' }}
                  </span>
                  <input 
                    type="file" 
                    class="hidden" 
                    accept="image/*"
                    @change="handleStageImageUpload"
                  />
                </label>
              </div>
              <div v-if="newStage.imageUrl" class="mt-2">
                <img :src="newStage.imageUrl" alt="Selected image preview" class="h-24 object-cover rounded">
              </div>
            </div>

            <div class="col-span-2">
              <label class="block text-gray-700 font-medium mb-2">Description</label>
              <textarea
                v-model="newStage.description"
                rows="3"
                placeholder="Describe this stage of your trip"
                class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
              ></textarea>
            </div>

            <div class="col-span-2">
              <label class="block text-gray-700 font-medium mb-2">Activities</label>
              <div
                v-for="(activity, index) in newStage.activities"
                :key="index"
                class="flex items-center mb-2 group"
              >
                <input
                  v-model="newStage.activities[index]"
                  type="text"
                  placeholder="Add an activity"
                  class="flex-grow px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                />
                <button
                  v-if="index === newStage.activities.length - 1"
                  @click="addActivity"
                  class="ml-2 p-2 bg-emerald-500 text-white rounded-md hover:bg-emerald-600 focus:outline-none transition-colors duration-200"
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
                  class="ml-2 p-2 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none transition-colors duration-200 opacity-80 group-hover:opacity-100"
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
              @click="cancelStageEdit"
              class="px-4 py-2 bg-gray-200 text-gray-700 rounded-md mr-2 hover:bg-gray-300 transition-colors duration-200 font-medium"
            >
              Cancel
            </button>
            <button
              @click="addStage"
              class="px-6 py-2 bg-emerald-500 text-white rounded-md hover:bg-emerald-600 focus:outline-none transition-colors duration-200 font-medium shadow-sm flex items-center"
            >
              <svg
                v-if="isEditingStage"
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <svg
                v-else
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5 mr-1"
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
              {{ isEditingStage ? 'Update Stage' : 'Add Stage' }}
            </button>
          </div>
        </div>

        <!-- List of added stages -->
        <div class="p-6" v-if="travelPlan.stages.length > 0">
          <h3 class="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5 mr-2 text-emerald-500"
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
            Added Stages ({{ travelPlan.stages.length }})
          </h3>

          <div
            v-for="(stage, index) in travelPlan.stages"
            :key="index"
            class="border border-gray-100 rounded-lg p-4 mb-4 hover:shadow-md transition-shadow duration-200"
          >
            <div class="flex justify-between items-start">
              <div>
                <h4 class="font-medium text-gray-800 text-lg">{{ stage.title }}</h4>
                <p class="text-sm text-gray-600 flex items-center mt-1">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-4 w-4 mr-1 text-emerald-500"
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
                  {{ stage.location }}
                </p>
                <p class="text-sm text-gray-600 flex items-center mt-1">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-4 w-4 mr-1 text-emerald-500"
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
                  {{ new Date(stage.startDate).toLocaleDateString() }} -
                  {{ new Date(stage.endDate).toLocaleDateString() }}
                </p>
                <div v-if="stage.activities && stage.activities.length > 0" class="mt-2">
                  <p class="text-sm text-gray-700 font-medium">Activities:</p>
                  <ul class="list-disc list-inside text-sm text-gray-600 ml-2">
                    <li
                      v-for="(activity, actIndex) in stage.activities"
                      :key="actIndex"
                      class="mt-1"
                    >
                      {{ activity }}
                    </li>
                  </ul>
                </div>
              </div>
              <div class="flex space-x-2">
                <button
                  @click="editStage(index)"
                  class="p-2 bg-emerald-100 text-emerald-600 rounded-md hover:bg-emerald-200 focus:outline-none transition-colors duration-200"
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
                  class="p-2 bg-red-100 text-red-600 rounded-md hover:bg-red-200 focus:outline-none transition-colors duration-200"
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
          class="px-8 py-3 bg-emerald-500 text-white rounded-md hover:bg-emerald-600 focus:outline-none transition-colors duration-200 font-medium shadow-sm flex items-center"
        >
          <span class="mr-2">Save Changes</span>
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

    <div v-else class="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 text-center">
      <div class="animate-pulse">
        <div class="h-8 bg-gray-300 rounded w-1/3 mx-auto mb-4"></div>
        <div class="h-64 bg-gray-300 rounded mb-4"></div>
        <div class="h-8 bg-gray-300 rounded w-1/4 mx-auto"></div>
      </div>
    </div>
  </div>
</template>
