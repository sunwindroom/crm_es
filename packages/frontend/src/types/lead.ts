export interface Lead {
  id: string;
  name: string;
  company: string;
  phone: string;
  email?: string;
  source: string;
  industry?: string;
  region?: string;
  requirement?: string;
  budget?: number;
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
  owner_id?: string;
  assigned_to?: string;
  assigned_at?: Date;
  lost_reason?: string;
  created_by?: string;
  department?: string;
  remark?: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateLeadDto {
  name: string;
  company: string;
  phone: string;
  email?: string;
  source?: string;
  industry?: string;
  region?: string;
  requirement?: string;
  budget?: number;
  department?: string;
  remark?: string;
}

export interface UpdateLeadDto {
  name?: string;
  company?: string;
  phone?: string;
  email?: string;
  source?: string;
  industry?: string;
  region?: string;
  requirement?: string;
  budget?: number;
  status?: string;
  department?: string;
  remark?: string;
}

export interface AssignLeadDto {
  userId: string;
}

export interface ConvertLeadDto {
  customerName?: string;
  opportunityName?: string;
  opportunityAmount?: number;
}
