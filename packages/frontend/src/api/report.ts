import request from '@/utils/request';

export const reportApi = {
  // 仪表盘
  getDashboard: (params?: any) => 
    request.get('/reports/dashboard', { params }),
  
  // 销售漏斗
  getSalesFunnel: (params?: any) => 
    request.get('/reports/sales-funnel', { params }),
  
  getConversionRate: (params?: any) =>
    request.get('/reports/conversion-rate', { params }),
  
  // 业绩统计
  getPersonalPerformance: (params?: any) => 
    request.get('/reports/performance/personal', { params }),
  
  getTeamPerformance: (params?: any) => 
    request.get('/reports/performance/team', { params }),
  
  getPerformanceTrend: (params?: any) =>
    request.get('/reports/performance/trend', { params }),
  
  // 客户分析
  getCustomerValue: (params?: any) => 
    request.get('/reports/customer-analysis/value', { params }),
  
  getCustomerDistribution: (params?: any) =>
    request.get('/reports/customer-analysis/distribution', { params }),
  
  getCustomerActivity: (params?: any) =>
    request.get('/reports/customer-analysis/activity', { params }),
  
  // 回款统计
  getPaymentProgress: (params?: any) => 
    request.get('/reports/payment/progress', { params }),
  
  getPaymentForecast: (params?: any) =>
    request.get('/reports/payment/forecast', { params }),
  
  getOverduePayments: (params?: any) =>
    request.get('/reports/payment/overdue', { params }),
  
  // 项目统计
  getProjectProgress: (params?: any) => 
    request.get('/reports/project/progress', { params }),
  
  getTimesheetStats: (params?: any) =>
    request.get('/reports/project/timesheet', { params }),
  
  // 跟进活动
  getFollowUpFrequency: (params?: any) =>
    request.get('/reports/activity/frequency', { params }),
  
  getFollowUpEffectiveness: (params?: any) =>
    request.get('/reports/activity/effectiveness', { params }),
};
