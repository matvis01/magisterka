import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/HomeView.vue'),
    },
    {
      path: '/travel/:id',
      name: 'travel-detail',
      component: () => import('@/views/TravelDetailView.vue'),
    },
    {
      path: '/create',
      name: 'create-travel',
      component: () => import('@/views/CreateTravelView.vue'),
    },
    {
      path: '/edit/:id',
      name: 'edit-travel',
      component: () => import('@/views/EditTravelView.vue'),
    },
  ],
})

export default router
