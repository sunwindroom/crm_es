import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '@/api/auth'
import type { User, LoginParams } from '@/types/auth'
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

      ElMessage.success('登录成功')
      return true
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || '登录失败'
      ElMessage.error(msg)
      return false
    }
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
    }
  }

  async function fetchProfile(): Promise<User | null> {
    try {
      const response = await authApi.getProfile()
      const data = (response as any).data ?? response
      user.value = data
      localStorage.setItem('user', JSON.stringify(data))
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
  }
})
