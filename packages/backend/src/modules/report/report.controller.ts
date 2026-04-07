import { Controller, Get, Query, Request } from '@nestjs/common';
import { ReportService } from './report.service';

@Controller('reports')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  /**
   * 获取仪表盘统计数据
   */
  @Get('dashboard')
  async getDashboardStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.reportService.getDashboardStats(start, end);
  }

  /**
   * 获取销售漏斗数据
   */
  @Get('sales-funnel')
  async getSalesFunnel() {
    return this.reportService.getSalesFunnel();
  }

  /**
   * 获取项目状态统计
   */
  @Get('project-status')
  async getProjectStatusStats() {
    return this.reportService.getProjectStatusStats();
  }

  /**
   * 获取线索来源统计
   */
  @Get('lead-source')
  async getLeadSourceStats() {
    return this.reportService.getLeadSourceStats();
  }

  /**
   * 获取回款趋势数据
   */
  @Get('payment-trend')
  async getPaymentTrend(@Query('months') months?: string) {
    return this.reportService.getPaymentTrend(months ? parseInt(months) : 6);
  }

  /**
   * 获取项目工时统计
   */
  @Get('project-timesheet')
  async getProjectTimesheetStats(@Query('projectId') projectId?: string) {
    return this.reportService.getProjectTimesheetStats(projectId);
  }

  /**
   * 获取业绩排名
   */
  @Get('performance-ranking')
  async getPerformanceRanking(
    @Query('type') type?: 'sales' | 'project',
    @Query('limit') limit?: string,
  ) {
    return this.reportService.getPerformanceRanking(
      type || 'sales',
      limit ? parseInt(limit) : 10
    );
  }

  /**
   * 获取综合报表数据
   */
  @Get('comprehensive')
  async getComprehensiveReport(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.reportService.getComprehensiveReport(start, end);
  }
}
