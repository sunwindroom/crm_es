import { request } from '@/utils/request'
import type { Milestone } from '@/types'
export const milestoneApi = {
  getList: (projectId: string) => request.get<Milestone[]>(`/projects/${projectId}/milestones`),
  create: (data: any) => request.post<Milestone>(`/projects/${data.projectId}/milestones`, data),
  update: (id: string, data: any) => request.put<Milestone>(`/projects/milestones/${id}`, data),
  delete: (id: string) => request.delete(`/projects/milestones/${id}`),
  batchDelete: (ids: string[]) => request.delete('/projects/milestones/batch', { data: { ids } }),
  complete: (id: string, data?: any) => request.post<Milestone>(`/projects/milestones/${id}/complete`, data),
  updateStatus: (id: string, status: string, data?: any) => request.patch<Milestone>(`/projects/milestones/${id}/status`, { status, ...data }),
}