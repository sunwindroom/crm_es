export interface DashboardStats {
  leads: {
    total: number;
    new: number;
    converted: number;
    lost: number;
    conversionRate: number;
  };
  customers: {
    total: number;
    new: number;
  };
  opportunities: {
    total: number;
    totalAmount: number;
    weightedAmount: number;
    won: number;
    winRate: number;
  };
  contracts: {
    total: number;
    totalAmount: number;
    signed: number;
  };
  payments: {
    paidAmount: number;
    pendingAmount: number;
    completionRate: number;
  };
  projects: {
    total: number;
    active: number;
    completed: number;
  };
}

export interface MetricCard {
  title: string;
  value: number;
  trend?: number;
  unit?: string;
  icon?: string;
}
