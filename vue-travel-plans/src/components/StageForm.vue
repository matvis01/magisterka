<script setup lang="ts">
import { ref, reactive, defineProps, defineEmits } from 'vue'
import type { TravelStage } from '../types'

// Props
const props = defineProps<{
  mode: 'create' | 'edit',
  isEditingStage: boolean,
  initialStage?: Partial<TravelStage>
}>()

// Emits
const emit = defineEmits(['add-stage', 'cancel-edit'])

// Use the theme colors based on mode
const themeColor = props.mode === 'create' ? 'blue' : 'emerald'

// Reactive state
const stage = reactive<TravelStage & { imageFile?: File | null }>({
  id: '',
  title: '',
  description: '',
  startDate: '',
  endDate: '',
  location: '',
  imageUrl: '',
  imageFile: null,
  activities: [''], // Start with one empty activity
})

const stageErrors = ref({
  title: '',
  dates: '',
  location: '',
})

// Initialize with props data if editing existing stage
if (props.initialStage) {
  Object.assign(stage, {
    id: props.initialStage.id || '',
    title: props.initialStage.title || '',
    description: props.initialStage.description || '',
    startDate: props.initialStage.startDate || '',
    endDate: props.initialStage.endDate || '',
    location: props.initialStage.location || '',
    imageUrl: props.initialStage.imageUrl || '',
    imageFile: null,
    activities: props.initialStage.activities ? [...props.initialStage.activities, ''] : [''],
  })
}

// File upload handler
const handleStageImageUpload = (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files.length > 0) {
    stage.imageFile = input.files[0];
    stage.imageUrl = URL.createObjectURL(input.files[0]);
  }
}

const addActivity = () => {
  stage.activities.push('')
}

const removeActivity = (index: number) => {
  stage.activities.splice(index, 1)
}

const validateStage = () => {
  let isValid = true
  stageErrors.value = {
    title: '',
    dates: '',
    location: '',
  }

  if (!stage.title.trim()) {
    stageErrors.value.title = 'Stage title is required'
    isValid = false
  }

  if (!stage.startDate || !stage.endDate) {
    stageErrors.value.dates = 'Start and end dates are required'
    isValid = false
  } else if (new Date(stage.startDate) > new Date(stage.endDate)) {
    stageErrors.value.dates = 'End date must be after start date'
    isValid = false
  }

  if (!stage.location.trim()) {
    stageErrors.value.location = 'Location is required'
    isValid = false
  }

  return isValid
}

const handleAddStage = () => {
  if (!validateStage()) return

  // Filter out empty activities
  const activities = stage.activities.filter((a) => a.trim() !== '')
  
  const stageData = {
    ...stage,
    activities,
  }

  emit('add-stage', stageData)

  // Reset form if not canceled from parent
  if (!props.isEditingStage) {
    resetForm()
  }
}

const cancelEdit = () => {
  emit('cancel-edit')
}

const resetForm = () => {
  Object.assign(stage, {
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
</script>

<template>
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
          d="M9 5l7 7-7 7"
        />
      </svg>
      {{ isEditingStage ? 'Edit Stage' : 'Add Travel Stage' }}
    </h2>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      <div class="col-span-2">
        <label class="block text-gray-700 font-medium mb-2">Stage Title</label>
        <input
          v-model="stage.title"
          type="text"
          placeholder="Enter stage title"
          class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none transition-colors text-gray-800"
          :class="{
            [`focus:ring-2 focus:ring-${themeColor}-500 focus:border-${themeColor}-500`]: true,
            'border-red-500 focus:ring-red-500 focus:border-red-500': stageErrors.title
          }"
        />
        <p v-if="stageErrors.title" class="text-red-500 text-sm mt-1">
          {{ stageErrors.title }}
        </p>
      </div>

      <div class="col-span-2">
        <label class="block text-gray-700 font-medium mb-2">Location</label>
        <input
          v-model="stage.location"
          type="text"
          placeholder="Stage location (city, country)"
          class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none transition-colors text-gray-800"
          :class="{
            [`focus:ring-2 focus:ring-${themeColor}-500 focus:border-${themeColor}-500`]: true,
            'border-red-500 focus:ring-red-500 focus:border-red-500': stageErrors.location
          }"
        />
        <p v-if="stageErrors.location" class="text-red-500 text-sm mt-1">
          {{ stageErrors.location }}
        </p>
      </div>

      <div>
        <label class="block text-gray-700 font-medium mb-2">Start Date</label>
        <input
          v-model="stage.startDate"
          type="date"
          class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none transition-colors text-gray-800"
          :class="{
            [`focus:ring-2 focus:ring-${themeColor}-500 focus:border-${themeColor}-500`]: true,
            'border-red-500 focus:ring-red-500 focus:border-red-500': stageErrors.dates
          }"
        />
      </div>

      <div>
        <label class="block text-gray-700 font-medium mb-2">End Date</label>
        <input
          v-model="stage.endDate"
          type="date"
          class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none transition-colors text-gray-800"
          :class="{
            [`focus:ring-2 focus:ring-${themeColor}-500 focus:border-${themeColor}-500`]: true,
            'border-red-500 focus:ring-red-500 focus:border-red-500': stageErrors.dates
          }"
        />
        <p v-if="stageErrors.dates" class="text-red-500 text-sm mt-1">
          {{ stageErrors.dates }}
        </p>
      </div>

      <div class="col-span-2">
        <label class="block text-gray-700 font-medium mb-2">Stage Image (optional)</label>
        <div class="flex items-center">
          <label 
            class="w-full flex flex-col items-center px-4 py-6 bg-white rounded-lg border-2 border-dashed tracking-wide cursor-pointer hover:bg-opacity-10 transition-colors"
            :class="`text-${themeColor}-500 border-${themeColor}-500 hover:bg-${themeColor}-50`"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span class="mt-2 text-sm">
              {{ stage.imageFile ? stage.imageFile.name : stage.imageUrl ? 'Current image (click to change)' : 'Select or drag an image' }}
            </span>
            <input 
              type="file" 
              class="hidden" 
              accept="image/*"
              @change="handleStageImageUpload"
            />
          </label>
        </div>
        <div v-if="stage.imageUrl" class="mt-2">
          <img :src="stage.imageUrl" alt="Selected image preview" class="h-24 object-cover rounded">
        </div>
      </div>

      <div class="col-span-2">
        <label class="block text-gray-700 font-medium mb-2">Description</label>
        <textarea
          v-model="stage.description"
          rows="3"
          placeholder="Describe this stage of your trip"
          class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none transition-colors text-gray-800"
          :class="{
            [`focus:ring-2 focus:ring-${themeColor}-500 focus:border-${themeColor}-500`]: true
          }"
        ></textarea>
      </div>

      <div class="col-span-2">
        <label class="block text-gray-700 font-medium mb-2">Activities</label>
        <div
          v-for="(activity, index) in stage.activities"
          :key="index"
          class="flex items-center mb-2 group"
        >
          <input
            v-model="stage.activities[index]"
            type="text"
            placeholder="Add an activity"
            class="flex-grow px-4 py-2 border border-gray-300 rounded-md focus:outline-none transition-colors text-gray-800"
            :class="{
              [`focus:ring-2 focus:ring-${themeColor}-500 focus:border-${themeColor}-500`]: true
            }"
          />
          <button
            v-if="index === stage.activities.length - 1"
            @click="addActivity"
            class="ml-2 p-2 text-white rounded-md focus:outline-none transition-colors duration-200"
            :class="`bg-${themeColor}-500 hover:bg-${themeColor}-600`"
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
            v-if="stage.activities.length > 1"
            @click="removeActivity(index)"
            class="ml-2 p-2 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none transition-colors duration-200"
            :class="{ 'opacity-80 group-hover:opacity-100': mode === 'edit' }"
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
        @click="cancelEdit"
        class="px-4 py-2 bg-gray-200 text-gray-700 rounded-md mr-2 hover:bg-gray-300 transition-colors duration-200 font-medium"
      >
        Cancel
      </button>
      <button
        @click="handleAddStage"
        class="px-6 py-2 text-white rounded-md focus:outline-none transition-colors duration-200 font-medium shadow-sm flex items-center"
        :class="`bg-${themeColor}-500 hover:bg-${themeColor}-600`"
      >
        <svg
          v-if="isEditingStage && mode === 'edit'"
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
</template>