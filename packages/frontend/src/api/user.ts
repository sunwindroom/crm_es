import { request } from '@/utils/request'
import type { User, PageQuery } from '@/types'
export const userApi = {
  getList: (params?: PageQuery & { role?: string; status?: string }) => request.get<any>('/users', { params }),
  getDetail: (id: string) => request.get<User>(`/users/${id}`),
  getSalesUsers: (params?: { keyword?: string }) => request.get<User[]>('/users/sales', { params }),
  create: (data: any) => request.post<User>('/users', data),
  update: (id: string, data: any) => request.put<User>(`/users/${id}`, data),
  delete: (id: string) => request.delete(`/users/${id}`),
  updateStatus: (id: string, status: User["status"]) => request.patch(`/users/${id}/status`, { status }),
  resetPassword: (id: string, newPassword: string) => request.post(`/users/${id}/reset-password`, { newPassword }),
  getCurrentUser: () => request.get<User>('/users/me'),
  getSubordinates: () => request.get<User[]>('/users/subordinates'),
  getSuperior: () => request.get<User>('/users/superior'),
  getRoles: () => request.get<any[]>('/roles'),
}