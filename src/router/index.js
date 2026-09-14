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
    path: '/links',
    name: 'Links',
    meta: {
      auth: false,
      label: '友情链接',
      active: ['Links']
    },
    component: () => import('@/views/links.vue')
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
    component: () => import('@/views/admin/index.vue'),
    children: [
      {
        path: 'articlelist',
        name: 'Admin-Article-list',
        meta: {
          auth: true,
          label: '文章管理',
          active: ['Admin', 'Article']
        },
        component: () => import('@/views/admin/ArticleManage/list.vue'),
      },
      {
        path: 'articleedit',
        name: 'Admin-Article-edit',
        meta: {
          auth: true,
          label: '',
          active: ['Admin', 'Article']
        },
        props: (route) => ({
          type: route.query.type || 'add',
          id: route.query.id ? Number(route.query.id) : undefined,
        }),
        component: () => import('@/views/admin/ArticleManage/edit.vue'),
      },
      {
        path: 'commentlist',
        name: 'Admin-Comment-list',
        meta: {
          auth: true,
          label: '评论管理',
          active: ['Admin', 'Comment']
        },
        component: () => import('@/views/admin/CommentManage/list.vue'),
      },
      {
        path: 'dictlist',
        name: 'Admin-Dict-List',
        meta: {
          auth: true,
          label: '字典管理',
          active: ['Admin', 'Dict']
        },
        component: () => import('@/views/admin/DictManage/list.vue'),
      },
      {
        path: 'linklist',
        name: 'Admin-Link-List',
        meta: {
          auth: true,
          label: '友情链接管理',
          active: ['Admin', 'Link']
        },
        component: () => import('@/views/admin/LinkManage/list.vue'),
      },
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

registerAuthGuard(router)

export default router
