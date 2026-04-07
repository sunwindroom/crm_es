import { request } from '@/utils/request'

export const projectApi = {
  // 项目基础操作
  getList: (params?: any) => request.get<any>('/projects', { params }),
  getDetail: (id: string) => request.get<any>(`/projects/${id}`),
  create: (data: any) => request.post<any>('/projects', data),
  update: (id: string, data: any) => request.put<any>(`/projects/${id}`, data),
  delete: (id: string) => request.delete(`/projects/${id}`),
  updateStatus: (id: string, status: string) => request.put(`/projects/${id}/status`, { status }),

  // 里程碑管理
  getMilestones: (projectId: string) => request.get<any[]>(`/projects/${projectId}/milestones`),
  addMilestone: (projectId: string, data: any) => request.post<any>(`/projects/${projectId}/milestones`, data),
  updateMilestone: (milestoneId: string, data: any) => request.put<any>(`/projects/milestones/${milestoneId}`, data),
  deleteMilestone: (milestoneId: string) => request.delete(`/projects/milestones/${milestoneId}`),
  completeMilestone: (milestoneId: string, data?: any) => request.post<any>(`/projects/milestones/${milestoneId}/complete`, data),

  // 项目成员管理
  getMembers: (projectId: string) => request.get<any[]>(`/projects/${projectId}/members`),
  addMember: (projectId: string, data: { userId: string; role?: string }) =>
    request.post<any>(`/projects/${projectId}/members`, data),
  addMembersBatch: (projectId: string, userIds: string[]) =>
    request.post<any>(`/projects/${projectId}/members/batch`, { userIds }),
  removeMember: (projectId: string, memberId: string) =>
    request.delete(`/projects/${projectId}/members/${memberId}`),

  // 工时管理
  getTimesheets: (projectId: string, params?: any) => 
    request.get<any[]>(`/projects/${projectId}/timesheets`, { params }),
  addTimesheet: (projectId: string, data: any) => 
    request.post<any>(`/projects/${projectId}/timesheets`, data),
  updateTimesheet: (projectId: string, timesheetId: string, data: any) => 
    request.put<any>(`/projects/${projectId}/timesheets/${timesheetId}`, data),
  deleteTimesheet: (projectId: string, timesheetId: string) => 
    request.delete(`/projects/${projectId}/timesheets/${timesheetId}`),

  // 项目统计
  getStats: (projectId: string) => request.get<any>(`/projects/${projectId}/stats`),
  getGanttData: (projectId: string) => request.get<any>(`/projects/${projectId}/gantt`),

  // 项目经理指派
  assignManager: (projectId: string, managerId: string) =>
    request.put<any>(`/projects/${projectId}/manager`, { managerId }),
}
