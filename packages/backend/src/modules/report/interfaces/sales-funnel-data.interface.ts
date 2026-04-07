export interface SalesFunnelData {
  stage: string;
  name: string;
  probability: number;
  count: number;
  amount: number;
  weightedAmount: number;
}

export interface ConversionRateData {
  fromStage: string;
  toStage: string;
  count: number;
  rate: number;
  avgDuration: number; // 平均停留天数
}

export interface StageHistory {
  opportunityId: string;
  fromStage: string | null;
  toStage: string;
  changedAt: Date;
  changedBy: string;
}
