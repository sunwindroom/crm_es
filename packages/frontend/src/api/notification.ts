import request from '@/utils/request';

export const notificationApi = {
  // 获取通知列表
  getList: (params?: any) => request.get('/notifications', { params }),

  // 获取未读通知数量
  getUnreadCount: () => request.get('/notifications/unread-count'),

  // 获取单个通知
  getOne: (id: string) => request.get(`/notifications/${id}`),

  // 标记通知为已读
  markAsRead: (id: string) => request.put(`/notifications/${id}/read`),

  // 标记所有通知为已读
  markAllAsRead: () => request.put('/notifications/read-all'),
};

export const leadHandoverApi = {
  // 触发线索交接流程
  trigger: (leadId: string, data?: { csManagerId?: string }) =>
    request.post(`/leads/${leadId}/trigger-handover`, data),

  // 获取线索交接历史
  getHistory: (leadId: string) => request.get(`/leads/${leadId}/handover-history`),
};
