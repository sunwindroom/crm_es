export interface PersonalPerformance {
  userId: string;
  userName: string;
  opportunityAmount: number;
  wonAmount: number;
  contractAmount: number;
  paidAmount: number;
  targetAmount: number;
  achievementRate: number;
  rank: number;
  trend?: PerformanceTrend[];
}

export interface TeamPerformance {
  teamTotal: {
    opportunityAmount: number;
    wonAmount: number;
    contractAmount: number;
    paidAmount: number;
    memberCount: number;
  };
  members: PersonalPerformance[];
}

export interface PerformanceTrend {
  period: string; // 2024-01, 2024-Q1, 2024
  amount: number;
  count: number;
  growth?: number; // 环比增长率
  yoyGrowth?: number; // 同比增长率
}
