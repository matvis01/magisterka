<script setup lang="ts">
import { defineProps, defineEmits } from 'vue'
import type { TravelPlan } from '../types'

const props = defineProps<{
  plan: TravelPlan
}>()

const emit = defineEmits(['detail', 'edit', 'delete'])

const handleDetail = () => emit('detail', props.plan.id)
const handleEdit = (event: Event) => emit('edit', props.plan.id, event)
const handleDelete = (event: Event) => emit('delete', props.plan.id, event)
</script>

<template>
  <div
    class="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 cursor-pointer"
    @click="handleDetail"
  >
    <div class="relative h-48 overflow-hidden ">
      <img
        :src="plan.imageUrl || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828'"
        :alt="plan.title"
        class="w-full h-full object-cover"
      />
      <div class="absolute top-0 right-0 mt-2 mr-2 flex space-x-2">
        <button
          @click.stop="handleEdit"
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
          @click.stop="handleDelete"
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
            <span>{{ new Date(plan.startDate).toLocaleDateString() }} - {{ new Date(plan.endDate).toLocaleDateString() }}</span>
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
</template>
