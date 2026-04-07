import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/auth/Login.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '', redirect: '/dashboard' },
      { path: 'dashboard', name: 'Dashboard', component: () => import('@/views/dashboard/index.vue'), meta: { title: '工作台', icon: 'Odometer' } },
      { path: 'leads', name: 'Leads', component: () => import('@/views/lead/index.vue'), meta: { title: '线索管理', icon: 'User' } },
      { path: 'customers', name: 'Customers', component: () => import('@/views/customer/index.vue'), meta: { title: '客户管理', icon: 'OfficeBuilding' } },
      { path: 'customers/:id', name: 'CustomerDetail', component: () => import('@/views/customer/detail.vue'), meta: { title: '客户详情', hidden: true } },
      { path: 'opportunities', name: 'Opportunities', component: () => import('@/views/opportunity/index.vue'), meta: { title: '商机管理', icon: 'TrendCharts' } },
      { path: 'projects', name: 'Projects', component: () => import('@/views/project/index.vue'), meta: { title: '项目管理', icon: 'Files' } },
      { path: 'projects/:id/timesheet', name: 'ProjectTimesheet', component: () => import('@/views/project/timesheet.vue'), meta: { title: '工时填报', hidden: true } },
      { path: 'projects/:id/members', name: 'ProjectMembers', component: () => import('@/views/project/members.vue'), meta: { title: '成员管理', hidden: true } },
      { path: 'debug/permission', name: 'PermissionDebug', component: () => import('@/views/debug/PermissionDebug.vue'), meta: { title: '权限调试', hidden: true } },
      { path: 'contracts', name: 'Contracts', component: () => import('@/views/contract/index.vue'), meta: { title: '合同管理', icon: 'Document' } },
      { path: 'payments', name: 'Payments', component: () => import('@/views/payment/index.vue'), meta: { title: '回款管理', icon: 'Money' } },
      { path: 'reports', name: 'Reports', component: () => import('@/views/report/index.vue'), meta: { title: '报表统计', icon: 'DataAnalysis' } },
      {
        path: 'system',
        name: 'System',
        meta: { title: '系统管理', icon: 'Setting' },
        children: [
          { path: 'users', name: 'UserManagement', component: () => import('@/views/system/UserManagement.vue'), meta: { title: '用户管理', icon: 'UserFilled' } },
          { path: 'roles', name: 'RoleManagement', component: () => import('@/views/system/RoleManagement.vue'), meta: { title: '角色管理', icon: 'Key' } },
          { path: 'profile', name: 'Profile', component: () => import('@/views/system/Profile.vue'), meta: { title: '个人中心', icon: 'Avatar' } },
        ]
      }
    ]
  }
]

const router = createRouter({ history: createWebHistory(), routes })

router.beforeEach((to, _from, next) => {
  const auth = useAuthStore()
  if (to.meta.requiresAuth !== false && !auth.isAuthenticated) {
    next('/login')
  } else if (to.path === '/login' && auth.isAuthenticated) {
    next('/dashboard')
  } else {
    next()
  }
})

export default router