export interface PaymentProgress {
  contractId: string;
  contractNo: string;
  contractName: string;
  amount: number;
  paidAmount: number;
  paymentRate: number;
  pendingAmount: number;
  ownerName: string;
  customerName: string;
}

export interface PaymentForecast {
  month: string;
  plannedAmount: number;
  plannedCount: number;
}

export interface OverduePayment {
  planId: string;
  contractId: string;
  contractNo: string;
  contractName: string;
  plannedAmount: number;
  plannedDate: Date;
  overdueDays: number;
  ownerName: string;
  customerName: string;
}
