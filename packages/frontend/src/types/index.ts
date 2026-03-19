export interface User {
  id: string; username: string; name: string; phone: string;
  email?: string; department?: string; position?: string; avatar?: string;
  role: UserRole; status: UserStatus; superiorId?: string; superiorName?: string;
  subordinateIds?: string[]; createdAt: string; updatedAt: string;
}
export type UserRole = 'admin'|'ceo'|'cto'|'cmo'|'sales_manager'|'sales'|'project_manager'|'business'|'finance';
export type UserStatus = 'active'|'inactive'|'locked';
export type Permission =
  'lead_create'|'lead_view'|'lead_edit'|'lead_delete'|'lead_assign'|'lead_convert'|
  'customer_create'|'customer_view'|'customer_edit'|'customer_delete'|
  'project_create'|'project_view'|'project_edit'|'project_delete'|
  'contract_create'|'contract_view'|'contract_edit'|'contract_delete'|
  'payment_create'|'payment_view'|'payment_edit'|'payment_delete'|
  'user_create'|'user_view'|'user_edit'|'user_delete'|
  'role_view'|'role_edit'|'report_view'|'dashboard_view';
export interface Role { id: string; name: string; code: UserRole; description: string; permissions: Permission[]; isSystem: boolean; createdAt: string; updatedAt: string; }
export interface Lead {
  id: string; name: string; company: string; phone: string; email?: string;
  source: string; industry?: string; region?: string; requirement?: string; budget?: number;
  status: string; assignedTo?: string; assignedUser?: User; assignedAt?: string;
  createdBy?: string; creator?: User; lostReason?: string; remark?: string;
  createdAt: string; updatedAt: string;
}
export interface Customer {
  id: string; name: string; type?: string; industry?: string; scale?: string;
  address?: string; phone?: string; email?: string; website?: string;
  level: string; status: string; description?: string; customFields?: Record<string, any>;
  ownerId?: string; owner?: User; createdBy?: string; creator?: User;
  createdAt: string; updatedAt: string;
}
export interface Contact { id: string; customerId: string; name: string; position?: string; phone?: string; email?: string; department?: string; wechat?: string; isPrimary: boolean; remark?: string; createdAt: string; updatedAt: string; }
export interface Opportunity {
  id: string; customerId: string; customer?: Customer; name: string; amount: number;
  stage: string; probability: number; expectedCloseDate?: string; status: string;
  lostReason?: string; description?: string; ownerId?: string; owner?: User;
  createdBy?: string; createdAt: string; updatedAt: string;
}
export interface Project {
  id: string; customerId: string; customer?: Customer; opportunityId?: string; contractId?: string;
  name: string; code?: string; type: string; status: string; priority?: string;
  manager: string; managerUser?: User; budget?: number; startDate: string; endDate: string;
  actualEndDate?: string; description?: string; progress: number;
  milestones?: Milestone[]; createdBy?: string; createdAt: string; updatedAt: string;
}
export interface Milestone {
  id: string; projectId: string; name: string; description?: string;
  plannedDate: string; actualDate?: string; status: MilestoneStatus;
  assignee?: string; assigneeUser?: User; assigneeName?: string;
  dependencies?: string[]; delayReason?: string; weight?: number;
  createdAt: string; updatedAt: string;
}
export type MilestoneStatus = 'not_started'|'in_progress'|'completed'|'delayed'|'cancelled';
export interface Contract {
  id: string; customerId: string; customer?: Customer; opportunityId?: string; projectId?: string;
  contractNo: string; name: string; type?: string; amount: number; paidAmount?: number;
  signDate?: string; startDate: string; endDate: string; status: string;
  description?: string; terms?: string; createdBy: string; creator?: User;
  ownerId?: string; owner?: User; approvedBy?: string; approvedAt?: string;
  createdAt: string; updatedAt: string;
}
export interface Payment {
  id: string; contractId: string; contract?: Contract; planId?: string;
  paymentNo?: string; amount: number; paymentMethod: string; paymentDate: string;
  expectedDate?: string; status: string; remark?: string;
  confirmedBy?: string; confirmedAt?: string; rejectionReason?: string;
  createdBy: string; creator?: User; createdAt: string; updatedAt: string;
}
export interface PageQuery { page?: number; pageSize?: number; keyword?: string; sortBy?: string; sortOrder?: 'ASC'|'DESC'; [key: string]: any; }
export interface PageResponse<T> { items?: T[]; data?: T[]; total: number; page: number; pageSize: number; }
export interface CreatePaymentRequest { contractId: string; amount: number; paymentMethod: string; paymentDate: string; expectedDate?: string; remark?: string; }
export interface CreateMilestoneRequest { projectId: string; name: string; description?: string; plannedDate: string; assignee?: string; dependencies?: string[]; }