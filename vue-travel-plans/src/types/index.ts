export interface TravelStage {
  id: string
  title: string
  description: string
  startDate: string
  endDate: string
  location: string
  imageUrl?: string
  activities: string[]
}

export interface TravelPlan {
  id: string
  title: string
  description: string
  startDate: string
  endDate: string
  imageUrl?: string
  destination: string
  budget?: number
  stages: TravelStage[]
}
