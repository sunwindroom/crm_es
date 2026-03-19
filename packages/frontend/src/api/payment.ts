import { request } from '@/utils/request'
import type { Payment, CreatePaymentRequest, PageQuery, PageResponse } from '@/types'

export const paymentApi = {
  getList(params?: PageQuery & { contractId?: string; startDate?: string; endDate?: string }) {
    return request.get<PageResponse<Payment>>('/payments', { params })
  },
  getByContractId(contractId: string, params?: PageQuery) {
    return request.get<PageResponse<Payment>>('/payments', { params: { ...params, contractId } })
  },
  getDetail(id: string) {
    return request.get<Payment>(`/payments/${id}`)
  },
  create(data: CreatePaymentRequest) {
    return request.post<Payment>('/payments', data)
  },
  update(id: string, data: Partial<CreatePaymentRequest>) {
    return request.put<Payment>(`/payments/${id}`, data)
  },
  delete(id: string) {
    return request.delete(`/payments/${id}`)
  },
  confirm(id: string, data?: { remark?: string }) {
    return request.post<Payment>(`/payments/${id}/confirm`, data)
  },
  reject(id: string, data: { reason: string }) {
    return request.post<Payment>(`/payments/${id}/reject`, data)
  },
  batchConfirm(ids: string[], data?: { remark?: string }) {
    return request.post<{ count: number }>('/payments/batch-confirm', { ids, ...data })
  },
  getStats(contractId?: string) {
    const url = contractId ? `/contracts/${contractId}/payments/stats` : '/payment-plans/statistics'
    return request.get(url)
  },
}
