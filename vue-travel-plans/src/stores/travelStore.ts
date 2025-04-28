import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { TravelPlan, TravelStage } from '../types'
import { v4 as uuidv4 } from 'uuid'

export const useTravelStore = defineStore('travel', () => {
  const travelPlans = ref<TravelPlan[]>([])
  const searchQuery = ref('')

  // Get all travel plans
  const getAllTravelPlans = computed(() => travelPlans.value)

  // Get filtered travel plans
  const getFilteredTravelPlans = computed(() => {
    if (!searchQuery.value) return travelPlans.value

    const query = searchQuery.value.toLowerCase()
    return travelPlans.value.filter(
      (plan) =>
        plan.title.toLowerCase().includes(query) ||
        plan.description.toLowerCase().includes(query) ||
        plan.destination.toLowerCase().includes(query),
    )
  })

  // Get a specific travel plan by ID
  const getTravelPlanById = (id: string) => {
    return travelPlans.value.find((plan) => plan.id === id)
  }

  // Add a new travel plan
  const addTravelPlan = (travelPlan: Omit<TravelPlan, 'id'>) => {
    const newPlan: TravelPlan = {
      ...travelPlan,
      id: uuidv4(),
    }
    travelPlans.value.push(newPlan)
    return newPlan
  }

  // Update an existing travel plan
  const updateTravelPlan = (id: string, updatedPlan: Partial<TravelPlan>) => {
    const index = travelPlans.value.findIndex((plan) => plan.id === id)
    if (index !== -1) {
      // Create a new object with the existing plan as the base
      const updatedTravelPlan = {
        ...travelPlans.value[index],
        ...updatedPlan,
        // Ensure stages are properly handled if provided
        stages: updatedPlan.stages || travelPlans.value[index].stages,
      }

      // Replace the travel plan in the array
      travelPlans.value[index] = updatedTravelPlan
      return updatedTravelPlan
    }
    return null
  }

  // Delete a travel plan
  const deleteTravelPlan = (id: string) => {
    const index = travelPlans.value.findIndex((plan) => plan.id === id)
    if (index !== -1) {
      travelPlans.value.splice(index, 1)
      return true
    }
    return false
  }

  // Add a stage to a travel plan
  const addStageToTravelPlan = (travelPlanId: string, stage: Omit<TravelStage, 'id'>) => {
    const plan = getTravelPlanById(travelPlanId)
    if (plan) {
      const newStage: TravelStage = {
        ...stage,
        id: uuidv4(),
      }
      plan.stages.push(newStage)
      return newStage
    }
    return null
  }

  // Update a stage in a travel plan
  const updateStage = (
    travelPlanId: string,
    stageId: string,
    updatedStage: Partial<TravelStage>,
  ) => {
    const plan = getTravelPlanById(travelPlanId)
    if (!plan) return null

    const stageIndex = plan.stages.findIndex((stage) => stage.id === stageId)
    if (stageIndex !== -1) {
      plan.stages[stageIndex] = { ...plan.stages[stageIndex], ...updatedStage }
      return plan.stages[stageIndex]
    }
    return null
  }

  // Delete a stage from a travel plan
  const deleteStage = (travelPlanId: string, stageId: string) => {
    const plan = getTravelPlanById(travelPlanId)
    if (!plan) return false

    const stageIndex = plan.stages.findIndex((stage) => stage.id === stageId)
    if (stageIndex !== -1) {
      plan.stages.splice(stageIndex, 1)
      return true
    }
    return false
  }

  // Update search query
  const setSearchQuery = (query: string) => {
    searchQuery.value = query
  }

  // Load initial sample data for demonstration
  const loadInitialData = () => {
    travelPlans.value = [
      {
        id: '1',
        title: 'European Adventure',
        description: 'Exploring the beautiful cities of Europe',
        startDate: '2025-06-01',
        endDate: '2025-06-15',
        destination: 'Europe',
        budget: 5000,
        imageUrl: 'https://images.unsplash.com/photo-1519677100203-a0e668c92439',
        stages: [
          {
            id: '101',
            title: 'Paris Exploration',
            description: 'Visiting the Eiffel Tower and Louvre Museum',
            startDate: '2025-06-01',
            endDate: '2025-06-05',
            location: 'Paris, France',
            imageUrl: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34',
            activities: ['Eiffel Tower', 'Louvre Museum', 'Notre Dame', 'Seine River Cruise'],
          },
          {
            id: '102',
            title: 'Amsterdam Adventure',
            description: 'Canal tours and museum visits',
            startDate: '2025-06-06',
            endDate: '2025-06-10',
            location: 'Amsterdam, Netherlands',
            imageUrl: 'https://images.unsplash.com/photo-1512470876302-972faa2aa9a4',
            activities: ['Anne Frank House', 'Van Gogh Museum', 'Canal Tour', 'Vondelpark'],
          },
          {
            id: '103',
            title: 'Berlin Experience',
            description: 'Historical sites and modern culture',
            startDate: '2025-06-11',
            endDate: '2025-06-15',
            location: 'Berlin, Germany',
            imageUrl: 'https://images.unsplash.com/photo-1528728329032-2972f65dfb3f',
            activities: ['Brandenburg Gate', 'Berlin Wall', 'Museum Island', 'Checkpoint Charlie'],
          },
        ],
      },
      {
        id: '2',
        title: 'Asian Expedition',
        description: 'Exploring the diverse cultures of Southeast Asia',
        startDate: '2025-07-10',
        endDate: '2025-07-30',
        destination: 'Southeast Asia',
        budget: 4000,
        imageUrl: 'https://images.unsplash.com/photo-1528181304800-259b08848526',
        stages: [
          {
            id: '201',
            title: 'Bangkok City Tour',
            description: 'Temple visits and street food exploration',
            startDate: '2025-07-10',
            endDate: '2025-07-15',
            location: 'Bangkok, Thailand',
            imageUrl: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365',
            activities: ['Grand Palace', 'Wat Arun', 'Street Food Tour', 'Chatuchak Market'],
          },
          {
            id: '202',
            title: 'Bali Retreat',
            description: 'Beach relaxation and cultural experiences',
            startDate: '2025-07-16',
            endDate: '2025-07-23',
            location: 'Bali, Indonesia',
            imageUrl: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4',
            activities: [
              'Ubud Monkey Forest',
              'Rice Terraces',
              'Temple Ceremonies',
              'Surf Lessons',
            ],
          },
          {
            id: '203',
            title: 'Singapore City Exploration',
            description: 'Modern architecture and cultural diversity',
            startDate: '2025-07-24',
            endDate: '2025-07-30',
            location: 'Singapore',
            imageUrl: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd',
            activities: [
              'Gardens by the Bay',
              'Marina Bay Sands',
              'Hawker Centers',
              'Sentosa Island',
            ],
          },
        ],
      },
    ]
  }

  // Initialize with sample data
  loadInitialData()

  return {
    travelPlans,
    searchQuery,
    getAllTravelPlans,
    getFilteredTravelPlans,
    getTravelPlanById,
    addTravelPlan,
    updateTravelPlan,
    deleteTravelPlan,
    addStageToTravelPlan,
    updateStage,
    deleteStage,
    setSearchQuery,
  }
})
