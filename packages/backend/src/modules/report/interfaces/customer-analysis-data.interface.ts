export interface CustomerValue {
  customerId: string;
  customerName: string;
  level: string;
  industry: string;
  contractAmount: number;
  paidAmount: number;
  opportunityCount: number;
  contractCount: number;
  valueScore: number;
  rank: number;
}

export interface CustomerDistribution {
  value: string;
  count: number;
  percentage: number;
}

export interface CustomerActivity {
  customerId: string;
  customerName: string;
  lastFollowUpAt: Date | null;
  lastVisitAt: Date | null;
  followUpCount: number;
  visitCount: number;
  daysSinceLastActivity: number;
  activityLevel: 'active' | 'inactive' | 'silent';
}
