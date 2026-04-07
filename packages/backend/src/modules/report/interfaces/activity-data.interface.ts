export interface FollowUpFrequency {
  userId: string;
  userName: string;
  totalCount: number;
  byType: {
    type: string;
    count: number;
  }[];
  byObject: {
    objectType: string;
    count: number;
  }[];
}

export interface FollowUpEffectiveness {
  resourceType: string;
  avgFollowUpCount: number;
  conversionRate: number;
  topPerformers: {
    userId: string;
    userName: string;
    followUpCount: number;
    conversionCount: number;
    conversionRate: number;
  }[];
}
