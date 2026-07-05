import { createRouter, createWebHistory } from 'vue-router'
import { registerAuthGuard } from '@/util/auth.js'

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
      label: '首页',
      active: ['Index']
    },
    component: () => import('@/views/index.vue')
  },
  {
    path: '/article',
    name: 'Article',
    meta: {
      auth: false,
      label: '',
      active: []
    },
    component: () => import('@/views/article.vue')
  },
  {
    path: '/about',
    name: 'About',
    meta: {
      auth: false,
      label: '关于',
      active: ['About']
    },
    component: () => import('@/views/about.vue')
  },

  {
    path: '/login',
    name: 'Login',
    meta: {
      auth: false,
      label: '',
      active: []
    },
    component: () => import('@/views/login.vue')
  },
  {
    path: '/admin',
    name: 'Admin',
    meta: {
      auth: true,
      label: '后台',
      active: ['Admin']
    },
    component: () => import('@/views/admin/index.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

registerAuthGuard(router)

export default router
