import { request } from '@/utils/request'
import type { Lead, PageQuery, PageResponse } from '@/types'
export const leadApi = {
  getList: (params?: PageQuery) => request.get<PageResponse<Lead>>('/leads', { params }),
  getDetail: (id: string) => request.get<Lead>(`/leads/${id}`),
  create: (data: any) => request.post<Lead>('/leads', data),
  update: (id: string, data: any) => request.put<Lead>(`/leads/${id}`, data),
  delete: (id: string) => request.delete(`/leads/${id}`),
  assign: (id: string, data: { userId: string; remark?: string }) => request.post<Lead>(`/leads/${id}/assign`, data),
  batchAssign: (leadIds: string[], data: { userId: string; remark?: string }) => request.post('/leads/batch-assign', { leadIds, ...data }),
  convert: (id: string, data: any) => request.post<Lead>(`/leads/${id}/convert`, data),
  markAsLost: (id: string, reason: string) => request.post<Lead>(`/leads/${id}/lost`, { reason }),
}