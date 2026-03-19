import { request } from '@/utils/request'
import type { LoginParams, LoginResponse, User } from '@/types/auth'
export const authApi = {
  login: (params: LoginParams) => request.post<LoginResponse>('/auth/login', params),
  logout: () => request.post('/auth/logout'),
  getProfile: () => request.get<User>('/auth/profile'),
}