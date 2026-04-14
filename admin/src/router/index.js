import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/login/index.vue')
  },
  {
    path: '/',
    component: () => import('../layout/index.vue'),
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('../views/dashboard/index.vue'),
        meta: { title: '首页' }
      },
      {
        path: 'ship',
        name: 'Ship',
        component: () => import('../views/ship/index.vue'),
        meta: { title: '船舶数据' }
      },
      {
        path: 'user',
        name: 'User',
        component: () => import('../views/user/index.vue'),
        meta: { title: '用户数据' }
      },
      {
        path: 'commission',
        name: 'Commission',
        component: () => import('../views/commission/index.vue'),
        meta: { title: '委托请求' }
      },
      {
        path: 'transaction',
        name: 'Transaction',
        component: () => import('../views/transaction/index.vue'),
        meta: { title: '交易记录' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('admin_token')
  if (to.path !== '/login' && !token) {
    next('/login')
  } else {
    next()
  }
})

export default router
