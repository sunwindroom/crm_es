import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '@/api/auth'
import type { User, LoginParams } from '@/types/auth'
import { usePermissionStore } from './permission'
import { ElMessage } from 'element-plus'

export const useAuthStore = defineStore('auth', () => {
  // 从 localStorage 初始化
  const token = ref<string | null>(localStorage.getItem('token'))
  const user = ref<User | null>((() => {
    try {
      const s = localStorage.getItem('user')
      return s ? JSON.parse(s) : null
    } catch {
      return null
    }
  })())

  const isAuthenticated = computed(() => !!token.value)

  async function login(params: LoginParams): Promise<boolean> {
    try {
      const response = await authApi.login(params)

      // 兼容直接响应和嵌套 data 响应
      const data = (response as any).data ?? response

      token.value = data.token
      user.value = data.user
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      localStorage.setItem('userRole', data.user.role)

      // 加载权限
      await loadPermissions()

      ElMessage.success('登录成功')
      return true
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || '登录失败'
      ElMessage.error(msg)
      return false
    }
  }

  async function loadPermissions(): Promise<void> {
    try {
      const permissionStore = usePermissionStore()
      // 根据用户角色设置权限
      const permissions = getPermissionsByRole(user.value?.role || '')
      permissionStore.setPermissions(permissions)
    } catch (error) {
      console.error('加载权限失败:', error)
    }
  }

  function getPermissionsByRole(role: string): any[] {
    // 根据角色返回权限列表
    const rolePermissions: Record<string, string[]> = {
      admin: ['lead_create', 'lead_view', 'lead_edit', 'lead_delete', 'lead_assign', 'lead_convert',
             'customer_create', 'customer_view', 'customer_edit', 'customer_delete',
             'opportunity_create', 'opportunity_view', 'opportunity_edit', 'opportunity_delete',
             'project_create', 'project_view', 'project_edit', 'project_delete',
             'contract_create', 'contract_view', 'contract_edit', 'contract_delete',
             'payment_create', 'payment_view', 'payment_edit', 'payment_delete',
             'user_create', 'user_view', 'user_edit', 'user_delete',
             'role_view', 'role_edit'],
      ceo: ['lead_create', 'lead_view', 'lead_edit', 'lead_delete', 'lead_assign', 'lead_convert',
            'customer_create', 'customer_view', 'customer_edit', 'customer_delete',
            'opportunity_create', 'opportunity_view', 'opportunity_edit', 'opportunity_delete',
            'project_create', 'project_view', 'project_edit', 'project_delete',
            'contract_create', 'contract_view', 'contract_edit', 'contract_delete',
            'payment_create', 'payment_view', 'payment_edit', 'payment_delete',
            'user_view', 'role_view'],
      sales_manager: ['lead_create', 'lead_view', 'lead_edit', 'lead_delete', 'lead_assign', 'lead_convert',
                     'customer_create', 'customer_view', 'customer_edit', 'customer_delete',
                     'opportunity_create', 'opportunity_view', 'opportunity_edit', 'opportunity_delete',
                     'project_view', 'contract_view', 'payment_view'],
      sales: ['lead_create', 'lead_view', 'lead_edit', 'lead_convert',
              'customer_create', 'customer_view', 'customer_edit',
              'opportunity_create', 'opportunity_view', 'opportunity_edit',
              'project_view', 'contract_view', 'payment_view'],
      project_manager: ['lead_view', 'customer_view',
                       'project_create', 'project_view', 'project_edit', 'project_delete',
                       'contract_view', 'payment_view'],
      finance: ['lead_view', 'customer_view', 'project_view',
               'contract_create', 'contract_view', 'contract_edit',
               'payment_create', 'payment_view', 'payment_edit', 'payment_delete'],
    }

    const codes = rolePermissions[role] || []
    return codes.map((code, index) => ({
      id: `perm_${index}`,
      name: code,
      code: code,
      resource: code.split('_')[0],
      action: code.split('_')[1],
      description: code
    }))
  }

  async function logout(): Promise<void> {
    try {
      await authApi.logout()
    } catch {
      // 忽略登出接口错误
    } finally {
      token.value = null
      user.value = null
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      localStorage.removeItem('userRole')

      // 清空权限
      const permissionStore = usePermissionStore()
      permissionStore.clearPermissions()
    }
  }

  async function fetchProfile(): Promise<User | null> {
    try {
      const response = await authApi.getProfile()
      const data = (response as any).data ?? response
      user.value = data
      localStorage.setItem('user', JSON.stringify(data))
      localStorage.setItem('userRole', data.role)

      // 重新加载权限
      await loadPermissions()

      return data
    } catch {
      await logout()
      return null
    }
  }

  function updateUser(updates: Partial<User>): void {
    if (user.value) {
      user.value = { ...user.value, ...updates }
      localStorage.setItem('user', JSON.stringify(user.value))
    }
  }

  return {
    token,
    user,
    isAuthenticated,
    login,
    logout,
    fetchProfile,
    updateUser,
    loadPermissions,
  }
})
