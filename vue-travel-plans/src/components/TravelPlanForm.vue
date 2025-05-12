<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import type { TravelPlan, TravelStage } from '../types'
import { v4 as uuidv4 } from 'uuid'
import StageForm from './StageForm.vue'

// Props
const props = defineProps<{
  initialTravelPlan?: Partial<TravelPlan> | null,
  mode: 'create' | 'edit',
  submitButtonText?: string
}>()

// Emits
const emit = defineEmits(['submit', 'cancel'])

// Reactive state
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

const travelErrors = ref({
  title: '',
  dates: '',
  destination: '',
})

const isEditingStage = ref(false)
const activeStageIndex = ref(-1)
const currentStage = ref<Partial<TravelStage> | null>(null)

// Initialize with props data if in edit mode
watch(() => props.initialTravelPlan, (newValue) => {
  if (newValue) {
    Object.assign(travelPlan, {
      id: newValue.id || '',
      title: newValue.title || '',
      description: newValue.description || '',
      startDate: newValue.startDate || '',
      endDate: newValue.endDate || '',
      destination: newValue.destination || '',
      budget: newValue.budget,
      imageUrl: newValue.imageUrl || '',
      imageFile: null,
      stages: newValue.stages ? [...newValue.stages] : [],
    })
  }
}, { immediate: true })

// File upload handlers
const handleTravelImageUpload = (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files.length > 0) {
    travelPlan.imageFile = input.files[0];
    travelPlan.imageUrl = URL.createObjectURL(input.files[0]);
  }
}

const handleAddStage = (stage: TravelStage) => {
  if (isEditingStage.value && activeStageIndex.value !== -1) {
    // Update existing stage
    travelPlan.stages[activeStageIndex.value] = { ...stage }
    isEditingStage.value = false
    activeStageIndex.value = -1
    currentStage.value = null
  } else {
    // Add new stage
    travelPlan.stages.push({ ...stage })
  }
}

const editStage = (index: number) => {
  const stage = travelPlan.stages[index]
  currentStage.value = { ...stage }
  isEditingStage.value = true
  activeStageIndex.value = index
}

const removeStage = (index: number) => {
  travelPlan.stages.splice(index, 1)
}

const cancelStageEdit = () => {
  isEditingStage.value = false
  activeStageIndex.value = -1
  currentStage.value = null
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

const handleSubmit = () => {
  if (!validateTravelPlan()) return

  // Ensure stages have IDs
  const stagesWithIds = travelPlan.stages.map((stage) => {
    if (!stage.id) {
      return {
        ...stage,
        id: uuidv4(),
      }
    }
    return stage
  })

  // Create a clean copy of the travel plan to emit
  const planToSubmit = {
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

  emit('submit', planToSubmit)
}

const handleCancel = () => {
  emit('cancel')
}

// Use the theme colors based on mode
const themeColor = props.mode === 'create' ? 'blue' : 'emerald'
</script>

<template>
  <div class="bg-white shadow-md rounded-lg overflow-hidden mb-8" :class="{ 'border border-gray-100': mode === 'edit' }">
    <div class="p-6" :class="{ 'border-b border-gray-100': mode === 'edit' }">
      <h2 class="text-2xl font-bold text-gray-800 mb-6 flex items-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-6 w-6 mr-2"
          :class="`text-${themeColor}-500`"
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
            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none transition-colors text-gray-800"
            :class="{
              [`focus:ring-2 focus:ring-${themeColor}-500 focus:border-${themeColor}-500`]: true,
              'border-red-500 focus:ring-red-500 focus:border-red-500': travelErrors.title
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
            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none transition-colors text-gray-800"
            :class="{
              [`focus:ring-2 focus:ring-${themeColor}-500 focus:border-${themeColor}-500`]: true,
              'border-red-500 focus:ring-red-500 focus:border-red-500': travelErrors.destination
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
            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none transition-colors text-gray-800"
            :class="{
              [`focus:ring-2 focus:ring-${themeColor}-500 focus:border-${themeColor}-500`]: true,
              'border-red-500 focus:ring-red-500 focus:border-red-500': travelErrors.dates
            }"
          />
        </div>

        <div>
          <label class="block text-gray-700 font-medium mb-2">End Date</label>
          <input
            v-model="travelPlan.endDate"
            type="date"
            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none transition-colors text-gray-800"
            :class="{
              [`focus:ring-2 focus:ring-${themeColor}-500 focus:border-${themeColor}-500`]: true,
              'border-red-500 focus:ring-red-500 focus:border-red-500': travelErrors.dates
            }"
          />
          <p v-if="travelErrors.dates" class="text-red-500 text-sm mt-1">
            {{ travelErrors.dates }}
          </p>
        </div>

        <div>
          <label class="block text-gray-700 font-medium mb-2">Budget (optional)</label>
          <div class="relative">
            <div v-if="mode === 'edit'" class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span class="text-gray-500">$</span>
            </div>
            <input
              v-model.number="travelPlan.budget"
              type="number"
              :placeholder="mode === 'create' ? 'Your budget in $' : 'Your budget'"
              class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none transition-colors text-gray-800"
              :class="{
                [`focus:ring-2 focus:ring-${themeColor}-500 focus:border-${themeColor}-500 ${mode === 'edit' ? 'pl-8' : ''}`]: true
              }"
            />
          </div>
        </div>

        <div>
          <label class="block text-gray-700 font-medium mb-2">Cover Image (optional)</label>
          <div class="flex items-center">
            <label 
              class="w-full flex flex-col items-center px-4 py-6 bg-white rounded-lg border-2 border-dashed tracking-wide cursor-pointer hover:bg-opacity-10 transition-colors"
              :class="`text-${themeColor}-500 border-${themeColor}-500 hover:bg-${themeColor}-50`"
            >
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
            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none transition-colors text-gray-800"
            :class="{
              [`focus:ring-2 focus:ring-${themeColor}-500 focus:border-${themeColor}-500`]: true
            }"
          ></textarea>
        </div>
      </div>
    </div>
  </div>

  <!-- Stages Section -->
  <div class="bg-white shadow-md rounded-lg overflow-hidden mb-8" :class="{ 'border border-gray-100': mode === 'edit' }">
    <!-- Use the StageForm component -->
    <StageForm 
      :mode="mode" 
      :isEditingStage="isEditingStage" 
      :initialStage="currentStage"
      @add-stage="handleAddStage"
      @cancel-edit="cancelStageEdit"
    />

    <!-- List of added stages -->
    <div class="p-6" v-if="travelPlan.stages.length > 0">
      <h3 class="text-lg font-semibold text-gray-800 mb-4 flex items-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-5 w-5 mr-2"
          :class="`text-${themeColor}-500`"
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
        :class="{
          'border border-gray-100 rounded-lg p-4 mb-4 hover:shadow-md transition-shadow duration-200': mode === 'edit',
          'border-b last:border-0 pb-4 mb-4': mode === 'create'
        }"
      >
        <div class="flex justify-between items-start">
          <div>
            <h4 class="font-medium text-gray-800" :class="{ 'text-lg': mode === 'edit' }">{{ stage.title }}</h4>
            <p class="text-sm text-gray-600" :class="{ 'flex items-center mt-1': mode === 'edit' }">
              <svg
                v-if="mode === 'edit'"
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
              <template v-if="mode === 'create'">
                | {{ new Date(stage.startDate).toLocaleDateString() }} -
                {{ new Date(stage.endDate).toLocaleDateString() }}
              </template>
            </p>
            <p v-if="mode === 'edit'" class="text-sm text-gray-600 flex items-center mt-1">
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
            <div v-if="stage.activities && stage.activities.length > 0 && mode === 'edit'" class="mt-2">
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
              class="p-2 rounded-md focus:outline-none transition-colors duration-200"
              :class="{
                'bg-emerald-100 text-emerald-600 hover:bg-emerald-200': mode === 'edit',
                'bg-blue-100 text-blue-600 hover:bg-blue-200': mode === 'create'
              }"
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

  <!-- Action Buttons -->
  <div class="flex justify-end">
    <button
      v-if="mode === 'edit'"
      @click="handleCancel"
      class="px-4 py-2 bg-white text-emerald-600 rounded-md hover:bg-emerald-50 transition-colors duration-200 font-medium shadow-sm mr-4"
    >
      Cancel
    </button>
    <button
      @click="handleSubmit"
      class="px-8 py-3 text-white rounded-md focus:outline-none flex items-center shadow-md"
      :class="{
        'bg-green-500 hover:bg-green-600': mode === 'create',
        'bg-emerald-500 hover:bg-emerald-600 transition-colors duration-200 font-medium': mode === 'edit'
      }"
    >
      <span class="mr-2">{{ submitButtonText || (mode === 'create' ? 'Save Travel Plan' : 'Save Changes') }}</span>
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
</template>