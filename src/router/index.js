import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: '/index'
  },
  {
    path: '/index',
    name: 'Index',
    meta: {
      auth: false,
      name: '首页',
      active: ['Index']
    },
    component: () => import('@/views/index.vue')
  },
  {
    path: '/article',
    name: 'Article',
    meta: {
      auth: false,
      name: '',
      active: []
    },
    component: () => import('@/views/article.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
