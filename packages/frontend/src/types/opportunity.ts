export interface Opportunity {
  id: string;
  customer_id: string;
  lead_id?: string;
  project_id?: string;
  name: string;
  amount: number;
  stage: 'initial' | 'requirement' | 'proposal' | 'negotiation' | 'contract';
  probability: number;
  expected_close_date?: Date;
  status: 'active' | 'won' | 'lost';
  lost_reason?: string;
  description?: string;
  owner_id?: string;
  created_by?: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateOpportunityDto {
  customer_id: string;
  lead_id?: string;
  name: string;
  amount: number;
  stage?: string;
  probability?: number;
  expected_close_date?: Date;
  description?: string;
}

export interface UpdateOpportunityDto {
  name?: string;
  amount?: number;
  stage?: string;
  probability?: number;
  expected_close_date?: Date;
  description?: string;
}

export interface WinOpportunityDto {
  projectName?: string;
  projectType?: string;
  startDate: Date;
  endDate: Date;
  contractName?: string;
  contractAmount?: number;
}

export interface LoseOpportunityDto {
  lostReason: string;
}
