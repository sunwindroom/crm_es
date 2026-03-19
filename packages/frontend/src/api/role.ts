import { request } from '@/utils/request'
export const roleApi = {
  getList: () => request.get<any[]>('/roles'),
  getDetail: (id: string) => request.get<any>(`/roles/${id}`),
  getByCode: (code: string) => request.get<any>(`/roles/code/${code}`),
  create: (data: any) => request.post<any>('/roles', data),
  update: (id: string, data: any) => request.put<any>(`/roles/${id}`, data),
  delete: (id: string) => request.delete(`/roles/${id}`),
}