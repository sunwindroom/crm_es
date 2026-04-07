export interface ProjectProgress {
  projectId: string;
  projectName: string;
  status: string;
  managerName: string;
  totalMilestones: number;
  completedMilestones: number;
  progress: number;
  overdueMilestones: number;
  startDate: Date;
  expectedEndDate: Date;
}

export interface TimesheetStats {
  projectId: string;
  projectName: string;
  totalHours: number;
  estimatedHours: number;
  usageRate: number;
  members: {
    userId: string;
    userName: string;
    hours: number;
  }[];
}
